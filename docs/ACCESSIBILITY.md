# Accessibility Checklist

Athena's accessibility target is a quiet, keyboard-usable local app. This checklist covers the primary user flows.

## Editor

- Main editor is reachable by keyboard.
- Entry action buttons have labels or tooltips.
- Self-report sliders have axis labels.
- Analysis toggle has an accessible label.
- Tag controls expose add/remove labels.

## Navigation

- Primary tabs are buttons with visible labels.
- Current section is visually distinct.
- Lock action is keyboard reachable.

## Entries

- Search input has an accessible name.
- Include/exclude tag controls use labels.
- Clear filters is keyboard reachable.
- Empty states are textual.
- Search snippets render as text, not HTML injection.

## Settings

- Settings tabs use visible labels.
- Provider/model controls are native selects.
- Queue controls are buttons with visible text.
- Data import file input has an accessible label.
- Local export button has visible text.
- Import preview and result regions use `aria-live`.

## Auth And Vault Gates

- Username/password/key inputs are labelled.
- Setup/login/open actions are keyboard reachable.
- Error states are textual.
- Passwordless local access remains an explicit action.

## Import/Export

- Local export is a direct button action.
- Import uses a labelled file input.
- Import preview appears before destructive replace.
- Replace action asks for explicit confirmation.
- Result summary is visible after import.

## Manual Smoke

Before a release:

1. Navigate Editor, Entries, Observations, and Settings with keyboard.
2. Open Settings > Data, trigger local export, choose an import file, and clear preview.
3. Verify focus remains usable after modal/browser confirmation.
4. Check primary text contrast in light UI.
5. Confirm no critical action is icon-only without a label or tooltip.

Automated axe coverage is deferred until dependency cost and test stability are reviewed.
