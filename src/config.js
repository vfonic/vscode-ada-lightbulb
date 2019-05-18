'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vscode = require('vscode');

class Config {
  get config() {
    return vscode.workspace.getConfiguration('ada-lightbulb');
  }

  get dateFormat() {
    return this.config.get('dateFormat', 'Date & Time');
  }

  get dateType() {
    return this.config.get('dateType', 'Author Date');
  }

  get fetchAvatars() {
    return this.config.get('fetchAvatars', false);
  }

  get graphColors() {
    return this.config
      .get('graphColors', ['#0085d9', '#d9008f', '#00d90a', '#d98500', '#a300d9', '#ff0000'])
      .filter(
        v => v.match(/^\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgb[a]?\s*\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\))\s*$/) != null
      );
  }

  get graphStyle() {
    return this.config.get('graphStyle', 'rounded');
  }

  get initialLoadCommits() {
    return this.config.get('initialLoadCommits', 300);
  }

  get loadMoreCommits() {
    return this.config.get('loadMoreCommits', 75);
  }

  get maxDepthOfRepoSearch() {
    return this.config.get('maxDepthOfRepoSearch', 0);
  }

  get showCurrentBranchByDefault() {
    return this.config.get('showCurrentBranchByDefault', false);
  }

  get showStatusBarItem() {
    return this.config.get('showStatusBarItem', true);
  }

  get tabIconColorTheme() {
    return this.config.get('tabIconColorTheme', 'color');
  }

  get gitPath() {
    const path = vscode.workspace.getConfiguration('git').get('path', null);
    return path != null ? path : 'git';
  }
}

exports.default = Config;
