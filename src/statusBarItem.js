'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vscode = require('vscode');
const Config = require('./config').default;
const configuration = new Config();

class StatusBarItem {
  constructor(context) {
    this.numRepos = 0;
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    this.statusBarItem.text = 'Ada Lightbulb';
    this.statusBarItem.tooltip = 'View Graph';
    this.statusBarItem.command = 'ada-lightbulb.view';
    context.subscriptions.push(this.statusBarItem);
  }

  setNumRepos(numRepos) {
    this.numRepos = numRepos;
    this.refresh();
  }

  refresh() {
    if (configuration.showStatusBarItem && this.numRepos > 0) {
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }
}

exports.StatusBarItem = StatusBarItem;
