# Anki Cloze Deletion for Obsidian

A lightweight Obsidian plugin that brings Anki-style cloze deletion shortcuts (`{{cN::text}}`) to your markdown notes, scoped specifically to individual flashcard blocks.

## Concept & Benefits

A cloze deletion is a fill-in-the-blank flashcard. Instead of formulating explicit question-and-answer pairs, you take a coherent statement or definition and mask key terms.

- **Faster Creation:** Copy definitions, theorems, or code snippets directly and mask key concepts without inventing artificial questions.
- **Contextual Learning:** Learn facts embedded within their natural context rather than isolated prompts.
- **Efficiency:** Generate multiple flashcards from a single block of text by incrementing the cloze index.

## Card Structure Requirement

This plugin expects cards to be enclosed between two horizontal rules (`---`):

```markdown
---
ADDED: How is the {{c1::probability mass function (pmf)}} defined? %%3l99il%%
For an at most countable sample space $\Omega$, it maps each outcome to its {{c2::probability}}.

---

```

* **Scoped Indexing:** Cloze numbers (`c1`, `c2`, ...) are counted independently within each `--- ... ---` block. Every new card block starts at `c1`.
* **Boundary Validation:** Triggering a cloze shortcut outside a `--- ... ---` block displays a brief warning notice and leaves the text unchanged.

## Syntax & Shortcuts

Syntax: `{{cN::Text}}` where `N` is the card index.

### 1. Cloze Deletion (new card)

* **Default Shortcut:** `Ctrl + Shift + C`
* **Behavior:** Increments the highest existing cloze number inside the current card block by 1 (e.g., from `c1` to `c2`, or starts at `c1` if none exist).
* **Result:** Wraps the selection in `{{cN+1::...}}`, generating a separate flashcard in Anki.

### 2. Cloze Deletion (same card)

* **Default Shortcut:** `Ctrl + Shift + V`
* **Behavior:** Reuses the highest existing cloze number inside the current card block (defaults to `c1` if none exist).
* **Result:** Wraps the selection in `{{cN::...}}`. All clozes sharing the same number in a card block are hidden and revealed simultaneously.

## Settings

* **Custom Shortcuts:** Click either shortcut button in **Settings -> Anki Cloze Deletion** to record a new key combination, or click the reset icon to restore defaults.

## Installation

1. Create the folder `<Vault>/.obsidian/plugins/anki-cloze/`.
2. Place `manifest.json`, `main.js`, and `styles.css` inside that folder.
3. Reload Obsidian and enable **Anki Cloze Deletion** under **Settings -> Community plugins**.

