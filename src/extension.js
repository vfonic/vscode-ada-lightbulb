const vscode = require('vscode');
const avatarManager_1 = require('./avatarManager');
const { DataSource } = require('./dataSource');
const diffDocProvider_1 = require('./diffDocProvider');
const ExtensionState = require('./extensionState').default;
const gitGraphView_1 = require('./gitGraphView');
const repoManager_1 = require('./repoManager');
const statusBarItem_1 = require('./statusBarItem');

function activate(context) {
  const extensionState = new ExtensionState(context);
  const dataSource = new DataSource();
  const avatarManager = new avatarManager_1.AvatarManager(dataSource, extensionState);
  const statusBarItem = new statusBarItem_1.StatusBarItem(context);
  const repoManager = new repoManager_1.RepoManager(dataSource, extensionState, statusBarItem);
  context.subscriptions.push(
    vscode.commands.registerCommand('ada-lightbulb.view', () => {
      gitGraphView_1.GitGraphView.createOrShow(
        context.extensionPath,
        dataSource,
        extensionState,
        avatarManager,
        repoManager
      );
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
      if (e.affectsConfiguration('ada-lightbulb.showStatusBarItem')) {
        statusBarItem.refresh();
      } else if (e.affectsConfiguration('ada-lightbulb.dateType')) {
        dataSource.generateGitCommandFormats();
      } else if (e.affectsConfiguration('ada-lightbulb.maxDepthOfRepoSearch')) {
        repoManager.maxDepthOfRepoSearchChanged();
      } else if (e.affectsConfiguration('git.path')) {
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
