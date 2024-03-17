import * as vscode from 'vscode';

class FancyViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    console.warn('Fancy resolveWebviewView');
    this._view = webviewView;

    webviewView.webview.options = { enableScripts: true };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  public showWebview(html: string) {
    if (!this._view) {
      return;
    }
    this._view.webview.html = html;
    this._view.show();
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    const scriptUri = ''; // webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
    const stylesUri = ''; // webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesUri}" rel="stylesheet">
        <title>Fancy View</title>
      </head>
      <body>
        <div>Select git commit to view files changed</div>
        <script src="${scriptUri}"></script>
      </body>
      </html>
    `;
  }
}

export default FancyViewProvider;
