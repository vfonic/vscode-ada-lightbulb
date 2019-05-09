'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vscode = require('vscode');
class Config {
  constructor() {
    this.workspaceConfiguration = vscode.workspace.getConfiguration('ada-lightbulb');
  }
  get autoCenterCommitDetailsView() {
    return this.workspaceConfiguration.get('autoCenterCommitDetailsView', true);
  }
  get dateFormat() {
    return this.workspaceConfiguration.get('dateFormat', 'Date & Time');
  }
  get dateType() {
    return this.workspaceConfiguration.get('dateType', 'Author Date');
  }
  get fetchAvatars() {
    return this.workspaceConfiguration.get('fetchAvatars', false);
  }
  get graphColours() {
    return this.workspaceConfiguration
      .get('graphColours', ['#0085d9', '#d9008f', '#00d90a', '#d98500', '#a300d9', '#ff0000'])
      .filter(
        v => v.match(/^\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgb[a]?\s*\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\))\s*$/) !== null
      );
  }
  get graphStyle() {
    return this.workspaceConfiguration.get('graphStyle', 'rounded');
  }
  get initialLoadCommits() {
    return this.workspaceConfiguration.get('initialLoadCommits', 300);
  }
  get loadMoreCommits() {
    return this.workspaceConfiguration.get('loadMoreCommits', 75);
  }
  get maxDepthOfRepoSearch() {
    return this.workspaceConfiguration.get('maxDepthOfRepoSearch', 0);
  }
  get showCurrentBranchByDefault() {
    return this.workspaceConfiguration.get('showCurrentBranchByDefault', false);
  }
  get showStatusBarItem() {
    return this.workspaceConfiguration.get('showStatusBarItem', true);
  }
  get showUncommittedChanges() {
    return this.workspaceConfiguration.get('showUncommittedChanges', true);
  }
  get tabIconColourTheme() {
    return this.workspaceConfiguration.get('tabIconColourTheme', 'colour');
  }
  get gitPath() {
    let path = vscode.workspace.getConfiguration('git').get('path', null);
    return path !== null ? path : 'git';
  }
}
exports.default = Config;
