// @ts-nocheck
import DataSource from './DataSource'
import DiffDocProvider from './DiffDocProvider'
import ExtensionState from './ExtensionState'
import GitGraphView from './GitGraphView'
import RepoManager from './RepoManager'
import vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  const extensionState = new ExtensionState(context)
  const dataSource = new DataSource()
  const repoManager = new RepoManager(dataSource, extensionState)
  context.subscriptions.push(
    vscode.commands.registerCommand('ada-lightbulb.view', () =>
      GitGraphView.createOrShow(context.extensionPath, dataSource, extensionState, repoManager),
    ),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('ada-lightbulb.goToUncommittedChanges', () => {
      if (GitGraphView.currentPanel) {
        GitGraphView.currentPanel.sendMessage({ command: 'goToUncommittedChanges' })
      }
    }),
  )
  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(DiffDocProvider.scheme, new DiffDocProvider(dataSource)))
  // context.subscriptions.push(
  //   vscode.workspace.onDidChangeConfiguration(e => e.affectsConfiguration('git.path') && dataSource.registerGitPath())
  // );
  context.subscriptions.push(repoManager)
}

export function deactivate() {}
