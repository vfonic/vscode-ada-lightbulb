// @ts-nocheck
import path from 'path'
import vscode from 'vscode'

class AssetLoader {
  constructor(extensionPath) {
    this.extensionPath = extensionPath
  }

  getUri(...pathComps) {
    return vscode.Uri.file(path.join(this.extensionPath, ...pathComps))
  }
}

export default AssetLoader
