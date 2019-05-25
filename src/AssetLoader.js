const path = require('path');
const vscode = require('vscode');

class AssetLoader {
  constructor(extensionPath) {
    this.extensionPath = extensionPath;
  }

  getUri(...pathComps) {
    return vscode.Uri.file(path.join(this.extensionPath, ...pathComps));
  }
}

exports.default = AssetLoader;
