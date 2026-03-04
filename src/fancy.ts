import * as vscode from 'vscode';

class FancyViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _pendingHtml?: string;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = { enableScripts: true };

    if (this._pendingHtml) {
      webviewView.webview.html = this._pendingHtml;
      this._pendingHtml = undefined;
    } else {
      webviewView.webview.html = this._getHtmlForWebview();
    }
  }

  public async showWebview(html: string) {
    if (this._view) {
      this._view.webview.html = html;
      this._view.show(true);
    } else {
      this._pendingHtml = html;
      await vscode.commands.executeCommand('my-webview.focus');
    }
  }

  private _getHtmlForWebview() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fancy View</title>
      </head>
      <body>
        <div>Select git commit to view files changed</div>
      </body>
      </html>
    `;
  }
}

export default FancyViewProvider;
