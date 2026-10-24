# Anki Cloze Deletion for Obsidian

A lightweight Obsidian plugin that brings Anki-style cloze deletion shortcuts (`{{cN::text}}`) to your markdown notes, scoped specifically to individual flashcard blocks.

## Concept & Benefits

A cloze deletion is a fill-in-the-blank flashcard. Instead of formulating explicit question-and-answer pairs, you mask key terms inside a coherent statement or definition.

- **Faster Creation:** Mask key concepts directly without inventing artificial question/answer pairs.
- **Contextual Learning:** Learn facts embedded within their natural context.
- **Efficiency:** Generate multiple flashcards from a single block of text by incrementing the cloze index.

## Card Structure Requirement

Cards must be enclosed between horizontal rules (`---`):

```markdown
---
Cloze
This is an example {{c1::cloze}} card. You can {{c2::hide}} different text parts {{c2::with ease}}.

---
ADDED: Cloze %%3l99il%%
This is another {{c1::example}} cloze card.

---
```

* **Scoped Indexing:** Cloze numbers (`c1`, `c2`, ...) are counted independently within each `--- ... ---` block. Every new card block starts at `c1`.
* **Boundary Validation:** Triggering a cloze shortcut outside a card block displays a warning notice and leaves text unchanged.
* **Frontmatter Safety:** YAML frontmatter (the `---` block at the start of a note) is automatically detected and protected.
* **Nested Cloze Protection:** Multi-layer protection prevents creating nested clozes (e.g. `{{c1::can {{c2::{{c3::happen}}}}}}`), which are invalid in Anki.

## Syntax & Shortcuts

Syntax: `{{cN::Text}}` where `N` is the card index.

Both commands support selected text (wraps the selection) and empty selection (inserts `{{cN::}}` with the cursor placed inside ready to type).

### 1. Cloze Deletion (new card)

* **Default Shortcut:** `Ctrl + Shift + C` (or `Cmd + Shift + C` on macOS)
* **Behavior:** Increments the highest existing cloze number inside the current card block by 1 (e.g., from `c1` to `c2`, or starts at `c1` if none exist).
* **Result:** Wraps the text in `{{cN+1::...}}`, generating a separate flashcard in Anki.

### 2. Cloze Deletion (same card)

* **Default Shortcut:** `Ctrl + Alt + C` (or `Cmd + Option + C` on macOS)
* **Behavior:** Reuses the highest existing cloze number inside the current card block (defaults to `c1` if none exist).
* **Result:** Wraps the text in `{{cN::...}}`. All clozes sharing the same number in a card block are tested together.

## Settings & Customization

Shortcuts are registered natively with Obsidian. You can customize them anytime in **Settings -> Hotkeys** by searching for `Anki Cloze`.

## Installation

### Community Plugins (Recommended once listed)
1. Open **Settings -> Community plugins** and turn off Restricted mode.
2. Search for **Anki Cloze Deletion** and click **Install**, then **Enable**.

### Manual Installation
1. Download `main.js` and `manifest.json` from the latest [GitHub Release](https://github.com/leon-3/Obsidian-Anki-Cloze/releases).
2. Create the folder `<Vault>/.obsidian/plugins/anki-cloze-deletion/` in your Obsidian vault.
3. Place `manifest.json` and `main.js` inside that folder.
4. Reload Obsidian or reload plugins under **Settings -> Community plugins**, then toggle **Anki Cloze Deletion** on.
