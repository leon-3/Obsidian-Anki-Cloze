# Anki Cloze Deletion for Obsidian

[![Release](https://img.shields.io/badge/version-1.0.2-blue?style=flat-square)](https://github.com/leon-3/Obsidian-Anki-Cloze/releases)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/leon-3/Obsidian-Anki-Cloze/blob/main/LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-1.0.0%2B-informational?style=flat-square)](https://obsidian.md)
[![Obsidian Store](https://img.shields.io/badge/Obsidian-In--App%20Store-7c3aed?style=flat-square)](obsidian://show-plugin?id=anki-cloze)
[![Webpage](https://img.shields.io/badge/Obsidian-Store%20Webpage-purple?style=flat-square)](https://community.obsidian.md/plugins/anki-cloze)

A lightweight Obsidian plugin that gives you fast keyboard shortcuts to create Anki-style clozes (`{{cN::text}}`). It counts cloze numbers per flashcard block instead of across your entire note, so every card automatically starts fresh at `c1`.

It is built for the flashcard syntax used by [Anki-VaultSync](https://github.com/leon-3/Anki-VaultSync) and [Markdown2Anki](https://github.com/leon-3/Markdown2Anki):
- [Anki Card Styling](https://github.com/leon-3/Obsidian-Anki-Card-Highlighting): Companion plugin that visualizes clozes, card badges, and status lines in Obsidian.
- [Anki-VaultSync](https://github.com/leon-3/Anki-VaultSync): Desktop add-on for direct sync between your vault and Anki without extra servers.
- [Markdown2Anki](https://github.com/leon-3/Markdown2Anki): Standalone command-line tool and compiler.

---

## Highlights & Key Features

- Card-scoped cloze numbers: Numbers (`c1`, `c2`, ...) are tracked inside each card block separated by `---`. Every new card starts back at `c1`.
- Anki-like hotkeys: Press `Ctrl+Shift+C` to create the next cloze on a new card (`cN+1`), or `Ctrl+Alt+C` to reuse the same number (`cN`) on the current card.
- Safe editing: Automatically skips YAML frontmatter and stops invalid nested clozes before they reach Anki.

---

## Installation & Quickstart

### Method 1: Obsidian Community Plugins
1. Open **Settings** > **Community plugins** in Obsidian.
2. Search for **Anki Cloze Deletion** (or open [Obsidian Plugin Store](obsidian://show-plugin?id=anki-cloze)).
3. Click **Install**, then **Enable**.

### Method 2: Manual Installation
1. Download `main.js` and `manifest.json` from the latest [GitHub Release](https://github.com/leon-3/Obsidian-Anki-Cloze/releases).
2. Create the folder `<Vault>/.obsidian/plugins/anki-cloze/` in your vault.
3. Place `main.js` and `manifest.json` inside.
4. Reload Obsidian plugins and turn on **Anki Cloze Deletion**.

---

## Documentation

### Card Syntax & Scoped Delimiters
The card format recognized by this plugin follows the syntax from [Anki-VaultSync](https://github.com/leon-3/Anki-VaultSync) and [Markdown2Anki](https://github.com/leon-3/Markdown2Anki). For deck routing, note updates, and tag options, check the documentation there.

Cards are separated by standard `---` lines:

```markdown
---
ADDED: Cloze %%a1b2c3%%
The first card starts at {{c1::c1}} and {{c2::c2}}.

---
Cloze
The next card starts back at {{c1::c1}} automatically.

---
```

### Keyboard Shortcuts

Both commands work on highlighted text or with an empty cursor:

#### 1. Cloze Deletion (new card)
- Default Shortcut: `Ctrl + Shift + C` (macOS: `Cmd + Shift + C`)
- Increments the highest cloze number in the current card by 1.
- Wraps selection in `{{cN+1::...}}`.

#### 2. Cloze Deletion (same card)
- Default Shortcut: `Ctrl + Alt + C` (macOS: `Cmd + Option + C`)
- Reuses the highest cloze number in the current card.
- Wraps selection in `{{cN::...}}` so both blanks are tested together.

### Customizing Shortcuts
Change shortcuts anytime in Obsidian under **Settings** > **Hotkeys** by searching for `Anki Cloze`.

---

## Development & Building

### Requirements
- Node.js

### Validating Script Syntax
```bash
node -c main.js
```
