const vscode = require('vscode');

class Config {
  get config() {
    return vscode.workspace.getConfiguration('ada-lightbulb');
  }

  get graphColors() {
    return this.config.get('graphColors', ['#0085d9', '#d9008f', '#00d90a', '#d98500', '#a300d9', '#ff0000']);
  }

  get gitPath() {
    const path = vscode.workspace.getConfiguration('git').get('path', null);
    return path != null ? path : 'git';
  }
}

exports.default = Config;
