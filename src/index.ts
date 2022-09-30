// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path from 'path';
import vscode from 'vscode';
import { exportFiles } from './export-files';
import { generate } from './generate';
import { getRootDir } from './utils';

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "LazyI18n" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json

  let disposable2 = vscode.commands.registerCommand('extension.JS2i18n', function () {
    const document = vscode.window.activeTextEditor?.document;
    if (!document) {
      return;
    }

    // The code you place here will be executed every time your command is executed
    const currentlyOpenTabfilePath = document.fileName;

    const extname = path.extname(currentlyOpenTabfilePath);
    if (!extname.match(/(js|jsx|tsx|ts)$/i)) {
      vscode.window.showWarningMessage('仅支持 JavaScript / TypeScript 类型 [js, jsx, ts, tsx] 的文件。');
      return false;
    }

    const rootPath = getRootDir();
    generate(currentlyOpenTabfilePath, rootPath, 'js');
    return;
  });

  let disposable5 = vscode.commands.registerCommand('extension.ExportArchive', function () {
    const rootPath = getRootDir();
    if (!rootPath) {
      return;
    }

    exportFiles(rootPath, vscode.window.showInformationMessage);
  });

  context.subscriptions.concat([disposable2, disposable5]);
}

// this method is called when your extension is deactivated
function deactivate() {}

export { activate, deactivate };
