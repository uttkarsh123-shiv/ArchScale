
import * as vscode from "vscode";
import * as path from "node:path";
import { scanProject } from "./analyzer/projectScanner";
import type { ProjectAnalysis } from "./analyzer/types";

const EXTENSION_ID = "archscale";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function renderReport(analysis: ProjectAnalysis): string {
  const list = (items: string[]) =>
    items.length
      ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "<li>None detected</li>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline';">
  <title>ArchScale Report</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      padding: 20px;
      max-width: 900px;
      margin: auto;
    }
    h1, h2 { color: var(--vscode-titleBar-activeForeground); }
    section {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    li { margin: 8px 0; overflow-wrap: anywhere; }
    .muted { color: var(--vscode-descriptionForeground); }
    code { overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <h1>ArchScale Analysis</h1>
  <p class="muted">Initial static project scan — not a runtime performance assessment.</p>

  <section>
    <h2>Project</h2>
    <p><strong>Name:</strong> ${escapeHtml(analysis.projectName)}</p>
    <p><strong>Root:</strong> <code>${escapeHtml(analysis.projectPath)}</code></p>
    <p><strong>Package manager:</strong> ${escapeHtml(analysis.packageManager)}</p>
  </section>

  <section>
    <h2>Detected frameworks</h2>
    <ul>${list(analysis.frameworks)}</ul>
  </section>

  <section>
    <h2>Dependencies (${analysis.dependencies.length})</h2>
    <ul>${list(analysis.dependencies)}</ul>
  </section>

  <section>
    <h2>Investigation prompts</h2>
    <ul>${list(analysis.findings)}</ul>
    <p class="muted">
      These are technology-based prompts, not confirmed scalability defects.
    </p>
  </section>
</body>
</html>`;
}

export function activate(context: vscode.ExtensionContext) {
  console.log("ArchScale extension is now active.");

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  statusBarItem.command = "archscale.analyzeWorkspace";
  statusBarItem.text = "$(sparkle) ArchScale";
  statusBarItem.tooltip = "Analyze the current project with ArchScale";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  const helloDisposable = vscode.commands.registerCommand(
    "archscale.helloWorld",
    async () => {
      vscode.window.showInformationMessage(
        "Hello from ArchScale! The extension is ready for development."
      );
    }
  );

  const analyzeDisposable = vscode.commands.registerCommand(
    "archscale.analyzeWorkspace",
    async () => {
      const config = vscode.workspace.getConfiguration(EXTENSION_ID);

      if (!config.get<boolean>("enabled", true)) {
        vscode.window.showInformationMessage(
          "ArchScale is disabled. Enable it in settings to continue."
        );
        return;
      }

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

      if (!workspaceFolder) {
        vscode.window.showWarningMessage(
          "Open a project folder before using ArchScale."
        );
        return;
      }

      try {
        const analysis = scanProject(workspaceFolder.uri.fsPath);

        const panel = vscode.window.createWebviewPanel(
          "archscale.report",
          `ArchScale: ${analysis.projectName}`,
          vscode.ViewColumn.One,
          { enableScripts: false }
        );

        panel.webview.html = renderReport(analysis);

        vscode.window.showInformationMessage(
          `ArchScale scanned ${analysis.projectName}: ${analysis.dependencies.length} dependencies detected.`
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An unknown error occurred.";

        vscode.window.showErrorMessage(`ArchScale: ${message}`);
      }
    }
  );

  context.subscriptions.push(helloDisposable, analyzeDisposable);
}

export function deactivate() {}
