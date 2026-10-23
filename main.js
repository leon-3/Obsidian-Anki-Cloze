const { Plugin, PluginSettingTab, Setting, Notice, MarkdownView } = require("obsidian");

const DEFAULT_SETTINGS = {
  newCardHotkey: {
    modifiers: ["Mod", "Shift"],
    key: "C"
  },
  sameCardHotkey: {
    modifiers: ["Mod", "Shift"],
    key: "V"
  }
};

function formatHotkey(hotkey) {
  if (!hotkey) return "Unassigned";
  const modLabels = hotkey.modifiers.map((m) => (m === "Mod" ? "Ctrl" : m));
  return [...modLabels, hotkey.key.toUpperCase()].join(" + ");
}

function eventToHotkey(evt) {
  const ignoredKeys = ["Control", "Shift", "Alt", "Meta", "AltGraph"];
  if (ignoredKeys.includes(evt.key)) return null;

  const modifiers = [];
  if (evt.ctrlKey || evt.metaKey) modifiers.push("Mod");
  if (evt.altKey) modifiers.push("Alt");
  if (evt.shiftKey) modifiers.push("Shift");

  let key = evt.key.length === 1 ? evt.key.toUpperCase() : evt.key;
  if (evt.code && evt.code.startsWith("Key")) {
    key = evt.code.slice(3).toUpperCase();
  } else if (evt.code && evt.code.startsWith("Digit")) {
    key = evt.code.slice(5);
  }

  return { modifiers, key };
}

function hotkeysMatch(a, b) {
  if (!a || !b) return false;
  if (a.key.toUpperCase() !== b.key.toUpperCase()) return false;
  if (a.modifiers.length !== b.modifiers.length) return false;
  const setA = new Set(a.modifiers);
  return b.modifiers.every((mod) => setA.has(mod));
}

module.exports = class AnkiClozePlugin extends Plugin {
  async onload() {
    this.isRecordingHotkey = false;
    await this.loadSettings();

    this.registerCommands();
    this.registerGlobalKeyHandler();

    this.addSettingTab(new AnkiClozeSettingTab(this.app, this));
  }

  registerCommands() {
    this.addCommand({
      id: "cloze-new-card",
      name: "Cloze Deletion (new card)",
      editorCallback: (editor) => {
        this.insertCloze(editor, true);
      }
    });

    this.addCommand({
      id: "cloze-same-card",
      name: "Cloze Deletion (same card)",
      editorCallback: (editor) => {
        this.insertCloze(editor, false);
      }
    });
  }

  registerGlobalKeyHandler() {
    this.registerDomEvent(
      window,
      "keydown",
      (evt) => {
        if (evt.repeat) return;
        if (this.isRecordingHotkey) return;
        if (document.querySelector(".modal-container")) return;

        const pressed = eventToHotkey(evt);
        if (!pressed || pressed.modifiers.length === 0) return;

        const isNewCard = hotkeysMatch(pressed, this.settings.newCardHotkey);
        const isSameCard = hotkeysMatch(pressed, this.settings.sameCardHotkey);

        if (!isNewCard && !isSameCard) return;

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view || !view.editor) return;

        evt.preventDefault();
        evt.stopPropagation();
        this.insertCloze(view.editor, isNewCard);
      },
      true
    );
  }

  findCardBoundaries(editor) {
    const fromLine = editor.getCursor("from").line;
    const toLine = editor.getCursor("to").line;
    const lineCount = editor.lineCount();
    const hrRegex = /^\s*---\s*$/;

    for (let i = fromLine; i <= toLine; i++) {
      if (hrRegex.test(editor.getLine(i))) {
        return null;
      }
    }

    let startHrLine = -1;
    for (let i = fromLine - 1; i >= 0; i--) {
      if (hrRegex.test(editor.getLine(i))) {
        startHrLine = i;
        break;
      }
    }

    let endHrLine = -1;
    for (let i = toLine + 1; i < lineCount; i++) {
      if (hrRegex.test(editor.getLine(i))) {
        endHrLine = i;
        break;
      }
    }

    if (startHrLine === -1 || endHrLine === -1) {
      return null;
    }

    return { startHrLine, endHrLine };
  }

  insertCloze(editor, isNewCard) {
    const boundaries = this.findCardBoundaries(editor);
    if (!boundaries) {
      new Notice("Cloze Error: Cursor must be inside a card block (between two '---' lines).");
      return;
    }

    const cardLines = [];
    for (let i = boundaries.startHrLine + 1; i < boundaries.endHrLine; i++) {
      cardLines.push(editor.getLine(i));
    }
    const cardText = cardLines.join("\n");

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

    const selection = editor.getSelection();
    const prefix = `{{c${targetNumber}::`;
    const suffix = `}}`;

    if (selection && selection.length > 0) {
      editor.replaceSelection(`${prefix}${selection}${suffix}`);
    } else {
      const cursor = editor.getCursor();
      editor.replaceSelection(`${prefix}${suffix}`);
      editor.setCursor({
        line: cursor.line,
        ch: cursor.ch + prefix.length
      });
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

class AnkiClozeSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.activeListener = null;
  }

  hide() {
    this.stopRecording();
  }

  stopRecording() {
    if (this.activeListener) {
      window.removeEventListener("keydown", this.activeListener, true);
      this.activeListener = null;
    }
    this.plugin.isRecordingHotkey = false;
  }

  createHotkeySetting(containerEl, name, desc, settingKey, defaultHotkey) {
    const setting = new Setting(containerEl).setName(name).setDesc(desc);

    setting.addButton((btn) => {
      btn.setButtonText(formatHotkey(this.plugin.settings[settingKey]));
      btn.onClick(() => {
        this.stopRecording();
        this.plugin.isRecordingHotkey = true;

        btn.setButtonText("Press keys... (ESC to cancel)");
        btn.buttonEl.addClass("cloze-recording-btn");

        this.activeListener = async (evt) => {
          evt.preventDefault();
          evt.stopPropagation();

          if (evt.key === "Escape") {
            this.stopRecording();
            btn.buttonEl.removeClass("cloze-recording-btn");
            btn.setButtonText(formatHotkey(this.plugin.settings[settingKey]));
            return;
          }

          const newHotkey = eventToHotkey(evt);
          if (!newHotkey) return;

          this.stopRecording();
          btn.buttonEl.removeClass("cloze-recording-btn");

          this.plugin.settings[settingKey] = newHotkey;
          await this.plugin.saveSettings();

          btn.setButtonText(formatHotkey(newHotkey));
          new Notice(`Shortcut saved: ${formatHotkey(newHotkey)}`);
        };

        window.addEventListener("keydown", this.activeListener, true);
      });
    });

    setting.addExtraButton((btn) => {
      btn
        .setIcon("reset")
        .setTooltip("Reset to default")
        .onClick(async () => {
          this.stopRecording();
          const clonedDefault = {
            modifiers: [...defaultHotkey.modifiers],
            key: defaultHotkey.key
          };
          this.plugin.settings[settingKey] = clonedDefault;
          await this.plugin.saveSettings();
          this.display();
          new Notice("Default shortcut restored.");
        });
    });
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Anki Cloze Settings" });

    this.createHotkeySetting(
      containerEl,
      "Cloze Deletion (new card)",
      "Increments the highest cloze index in the current card block by 1 (Default: Ctrl + Shift + C).",
      "newCardHotkey",
      DEFAULT_SETTINGS.newCardHotkey
    );

    this.createHotkeySetting(
      containerEl,
      "Cloze Deletion (same card)",
      "Reuses the highest cloze index in the current card block (Default: Ctrl + Shift + V).",
      "sameCardHotkey",
      DEFAULT_SETTINGS.sameCardHotkey
    );
  }
}
