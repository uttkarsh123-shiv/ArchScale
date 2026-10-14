import * as vscode from 'vscode';

const EXTENSION_ID = 'archscale';

function getDefaultPrompt(): string {
	return vscode.workspace
		.getConfiguration(EXTENSION_ID)
		.get<string>('defaultPrompt', 'Review this project for architecture quality, scalability risks, and modernization opportunities.');
}

export function activate(context: vscode.ExtensionContext) {
	console.log('ArchScale extension is now active.');

	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = 'archscale.analyzeWorkspace';
	statusBarItem.text = '$(sparkle) ArchScale';
	statusBarItem.tooltip = 'Analyze the current project with ArchScale';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	const helloDisposable = vscode.commands.registerCommand('archscale.helloWorld', async () => {
		vscode.window.showInformationMessage('Hello from ArchScale! The extension is ready for development.');
	});

	const analyzeDisposable = vscode.commands.registerCommand('archscale.analyzeWorkspace', async () => {
		const config = vscode.workspace.getConfiguration(EXTENSION_ID);
		if (!config.get<boolean>('enabled', true)) {
			vscode.window.showInformationMessage('ArchScale is currently disabled. Enable it in settings to analyze projects.');
			return;
		}

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			vscode.window.showInformationMessage('Open a workspace folder before using ArchScale.');
			return;
		}

		const prompt = getDefaultPrompt();
		vscode.window.showInformationMessage(`ArchScale is ready for ${workspaceFolder.name}. Prompt: ${prompt}`);
	});

	context.subscriptions.push(helloDisposable, analyzeDisposable);
}

export function deactivate() {}
