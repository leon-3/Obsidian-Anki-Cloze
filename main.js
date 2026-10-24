const { Plugin, PluginSettingTab, Setting, Notice } = require("obsidian");

function getClozeIntervals(cardText) {
  const tokenRegex = /(\{\{c\d+::|\}\})/g;
  let match;
  let depth = 0;
  const intervals = [];
  let openStart = -1;

  while ((match = tokenRegex.exec(cardText)) !== null) {
    const token = match[0];
    const index = match.index;

    if (token.startsWith("{{c")) {
      if (depth === 0) {
        openStart = index;
      }
      depth++;
    } else if (token === "}}") {
      if (depth > 0) {
        depth--;
        if (depth === 0) {
          intervals.push({ start: openStart, end: index + 2 });
          openStart = -1;
        }
      }
    }
  }

  // If an unclosed cloze remains, treat everything from openStart to card end as within cloze
  if (depth > 0 && openStart !== -1) {
    intervals.push({ start: openStart, end: cardText.length });
  }

  return intervals;
}

function hasNestedClozes(text) {
  const tokenRegex = /(\{\{c\d+::|\}\})/g;
  let match;
  let depth = 0;
  while ((match = tokenRegex.exec(text)) !== null) {
    if (match[0].startsWith("{{c")) {
      depth++;
      if (depth > 1) return true;
    } else if (match[0] === "}}") {
      depth = Math.max(0, depth - 1);
    }
  }
  return false;
}

module.exports = class AnkiClozePlugin extends Plugin {
  async onload() {
    this.registerCommands();
    this.addSettingTab(new AnkiClozeSettingTab(this.app, this));
  }

  registerCommands() {
    this.addCommand({
      id: "cloze-new-card",
      name: "Cloze Deletion (new card)",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "C" }],
      editorCallback: (editor) => {
        this.insertCloze(editor, true);
      }
    });

    this.addCommand({
      id: "cloze-same-card",
      name: "Cloze Deletion (same card)",
      hotkeys: [{ modifiers: ["Mod", "Alt"], key: "V" }],
      editorCallback: (editor) => {
        this.insertCloze(editor, false);
      }
    });
  }

  findCardBoundaries(editor) {
    const from = editor.getCursor("from");
    const to = editor.getCursor("to");
    const lineCount = editor.lineCount();
    const hrRegex = /^\s*---\s*$/;

    // Check for YAML frontmatter to prevent collision with note metadata
    const file = this.app.workspace.getActiveFile();
    const cache = file ? this.app.metadataCache.getFileCache(file) : null;
    const frontmatterEndLine = cache?.frontmatterPosition?.end?.line ?? -1;

    if (from.line <= frontmatterEndLine) {
      new Notice("Cloze Error: Cannot insert cloze inside YAML frontmatter.");
      return null;
    }

    // Verify selection does not cross card delimiter boundaries
    for (let i = from.line; i <= to.line; i++) {
      if (i > frontmatterEndLine && hrRegex.test(editor.getLine(i))) {
        return null;
      }
    }

    let startHrLine = -1;
    for (let i = from.line - 1; i > frontmatterEndLine; i--) {
      if (hrRegex.test(editor.getLine(i))) {
        startHrLine = i;
        break;
      }
    }

    let endHrLine = -1;
    for (let i = to.line + 1; i < lineCount; i++) {
      if (hrRegex.test(editor.getLine(i))) {
        endHrLine = i;
        break;
      }
    }

    if (startHrLine === -1 || endHrLine === -1) {
      return null;
    }

    return { startHrLine, endHrLine, from, to };
  }

  getCardOffset(targetLine, targetCh, startHrLine, cardLines) {
    let offset = 0;
    const lineIndex = Math.max(0, targetLine - (startHrLine + 1));
    for (let i = 0; i < lineIndex && i < cardLines.length; i++) {
      offset += cardLines[i].length + 1; // +1 for the newline character
    }
    offset += targetCh;
    return offset;
  }

  insertCloze(editor, isNewCard) {
    const boundaries = this.findCardBoundaries(editor);
    if (!boundaries) {
      const file = this.app.workspace.getActiveFile();
      const cache = file ? this.app.metadataCache.getFileCache(file) : null;
      const frontmatterEndLine = cache?.frontmatterPosition?.end?.line ?? -1;
      if (editor.getCursor("from").line > frontmatterEndLine) {
        new Notice("Cloze Error: Cursor must be inside a card block (between two '---' lines).");
      }
      return;
    }

    const { startHrLine, endHrLine, from, to } = boundaries;

    const cardLines = [];
    for (let i = startHrLine + 1; i < endHrLine; i++) {
      cardLines.push(editor.getLine(i));
    }
    const cardText = cardLines.join("\n");

    const selection = editor.getSelection();

    // Nested Cloze Protection Layer 1: Selection text inspection
    if (selection && (/\{\{c\d+::/i.test(selection) || /\}\}/.test(selection))) {
      new Notice("Cloze Error: Selection already contains a cloze deletion.");
      return;
    }

    // Nested Cloze Protection Layer 2: Cloze interval check within the card block
    const offsetA = this.getCardOffset(from.line, from.ch, startHrLine, cardLines);
    const offsetB = this.getCardOffset(to.line, to.ch, startHrLine, cardLines);
    const fromOffset = Math.min(offsetA, offsetB);
    const toOffset = Math.max(offsetA, offsetB);

    const intervals = getClozeIntervals(cardText);
    for (const interval of intervals) {
      if (fromOffset === toOffset) {
        if (fromOffset > interval.start && fromOffset < interval.end) {
          new Notice("Cloze Error: Cannot insert cloze inside an existing cloze deletion.");
          return;
        }
      } else {
        const overlap = Math.max(fromOffset, interval.start) < Math.min(toOffset, interval.end);
        const encloses = fromOffset <= interval.start && toOffset >= interval.end;
        if (overlap || encloses) {
          new Notice("Cloze Error: Cannot nest clozes inside or around an existing cloze deletion.");
          return;
        }
      }
    }

    // Determine target cloze index
    const regex = /\{\{c(\d+)::/g;
    let match;
    let maxNumber = 0;

    while ((match = regex.exec(cardText)) !== null) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }

    let targetNumber;
    if (maxNumber === 0) {
      targetNumber = 1;
    } else {
      targetNumber = isNewCard ? maxNumber + 1 : maxNumber;
    }

    const prefix = `{{c${targetNumber}::`;
    const suffix = `}}`;
    const replacement =
      selection && selection.length > 0
        ? `${prefix}${selection}${suffix}`
        : `${prefix}${suffix}`;

    // Nested Cloze Protection Layer 3: Validation of projected result
    const projectedCardText =
      cardText.slice(0, fromOffset) + replacement + cardText.slice(toOffset);
    if (hasNestedClozes(projectedCardText)) {
      new Notice("Cloze Error: Action would create an invalid nested cloze deletion.");
      return;
    }

    // Apply via atomic transaction so text change and caret positioning
    // are recorded as a single operation in the undo/redo history.
    if (selection && selection.length > 0) {
      const replacementLines = replacement.split("\n");
      const endLine = from.line + replacementLines.length - 1;
      const endCh =
        (replacementLines.length === 1 ? from.ch : 0) +
        replacementLines[replacementLines.length - 1].length;
      const endPos = { line: endLine, ch: endCh };

      editor.transaction({
        changes: [{ from, to, text: replacement }],
        selection: { from: endPos, to: endPos }
      });
    } else {
      const insidePos = { line: from.line, ch: from.ch + prefix.length };

      editor.transaction({
        changes: [{ from, to: from, text: replacement }],
        selection: { from: insidePos, to: insidePos }
      });
    }
  }
};

class AnkiClozeSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Anki Cloze Settings" });

    new Setting(containerEl)
      .setName("Hotkey configuration")
      .setDesc(
        "Hotkeys are managed natively by Obsidian. You can view or customize them under 'Settings -> Hotkeys' by searching for 'Anki Cloze'."
      )
      .addButton((btn) => {
        btn.setButtonText("Open hotkeys").onClick(() => {
          if (this.app.setting && typeof this.app.setting.openTabById === "function") {
            this.app.setting.openTabById("hotkeys");
            const activeTab = this.app.setting.activeTab;
            if (activeTab && typeof activeTab.setQuery === "function") {
              activeTab.setQuery("Anki Cloze");
            } else if (activeTab && activeTab.searchComponent) {
              activeTab.searchComponent.setValue("Anki Cloze");
              if (typeof activeTab.updateHotkeyVisibility === "function") {
                activeTab.updateHotkeyVisibility();
              }
            }
          }
        });
      });
  }
}
