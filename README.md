# ArchScale

AI-assisted architecture and scalability analysis for Node.js projects.

## Features

- Quick project-level architecture awareness from within VS Code
- Starter command wiring for extension-based analysis workflows
- Configurable extension settings for enabling/disabling the tool and customizing the default prompt
- Ready-to-extend command infrastructure for building deeper project analysis features

## Getting started

1. Open this folder in VS Code.
2. Run the extension host with `F5`.
3. Use the command palette and run `ArchScale: Analyze Current Project`.
4. Start implementing your actual project analysis logic in `src/extension.ts`.

## Extension settings

This extension contributes the following settings:

- `archscale.enabled`: Enable or disable the extension.
- `archscale.defaultPrompt`: Default prompt used when analyzing a project.

## Development

```bash
npm install
npm test
```

## Notes

This is a working starter extension scaffold. You can now replace the placeholder commands with real architecture analysis features, LLM integrations, and workspace tooling.
