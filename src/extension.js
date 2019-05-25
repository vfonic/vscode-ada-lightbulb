const vscode = require('vscode');
const { DataSource } = require('./DataSource');
const diffDocProvider_1 = require('./diffDocProvider');
const ExtensionState = require('./ExtensionState').default;
const gitGraphView_1 = require('./GitGraphView');
const repoManager_1 = require('./RepoManager');

function activate(context) {
  const extensionState = new ExtensionState(context);
  const dataSource = new DataSource();
  const repoManager = new repoManager_1.RepoManager(dataSource, extensionState);
  context.subscriptions.push(
    vscode.commands.registerCommand('ada-lightbulb.view', () => {
      gitGraphView_1.GitGraphView.createOrShow(context.extensionPath, dataSource, extensionState, repoManager);
    })
  );
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      diffDocProvider_1.DiffDocProvider.scheme,
      new diffDocProvider_1.DiffDocProvider(dataSource)
    )
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('git.path')) {
        dataSource.registerGitPath();
      }
    })
  );
  context.subscriptions.push(repoManager);
}

exports.activate = activate;

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
