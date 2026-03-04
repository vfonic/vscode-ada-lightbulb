// @ts-nocheck
import * as vscode from 'vscode';
import DataSource from './DataSource';

class FancyViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _pendingCommit?: { repo: string; commitHash: string; parts: { summary: string; fileList: string } };

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _dataSource: DataSource
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = { enableScripts: true };

    webviewView.webview.onDidReceiveMessage(async msg => {
      if (msg.command === 'requestFileDiff') {
        const diff = await this._dataSource.getFileDiff(msg.repo, msg.commitHash, msg.filePath);
        webviewView.webview.postMessage({ command: 'fileDiff', diff });
      }
    });

    if (this._pendingCommit) {
      const { repo, commitHash, parts } = this._pendingCommit;
      this._pendingCommit = undefined;
      webviewView.webview.html = this._wrapInDocument(repo, commitHash, parts);
    } else {
      webviewView.webview.html = this._getHtmlForWebview();
    }
  }

  public async showCommitDetails(repo: string, commitHash: string, parts: { summary: string; fileList: string }) {
    if (this._view) {
      this._view.webview.html = this._wrapInDocument(repo, commitHash, parts);
      this._view.show(true);
    } else {
      this._pendingCommit = { repo, commitHash, parts };
      await vscode.commands.executeCommand('my-webview.focus');
    }
  }

  private _wrapInDocument(repo: string, commitHash: string, parts: { summary: string; fileList: string }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commit Details</title>
  <style>${this._getStyles()}</style>
</head>
<body>
  <div id="commitSummary">${parts.summary}</div>
  <div id="splitPane">
    <div id="fileListPane">${parts.fileList}</div>
    <div id="diffPane"><em>Loading diff...</em></div>
  </div>
  <script>${this._getScript(repo, commitHash)}</script>
</body>
</html>`;
  }

  private _getStyles() {
    return `
      body { margin: 0; padding: 8px; font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); }
      #commitSummary { padding: 4px 0 8px 0; border-bottom: 1px solid var(--vscode-panel-border, #444); margin-bottom: 8px; font-size: 0.9em; }
      #splitPane { display: flex; flex: 1; min-height: 0; }
      #fileListPane { width: 250px; min-width: 150px; overflow-y: auto; border-right: 1px solid var(--vscode-panel-border, #444); padding-right: 4px; }
      #diffPane { flex: 1; overflow: auto; padding-left: 8px; font-family: var(--vscode-editor-font-family, monospace); font-size: var(--vscode-editor-font-size, 12px); white-space: pre; }
      .gitFolderContents { list-style: none; padding: 0; margin: 0; }
      .gitFile { padding: 3px 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; border-radius: 3px; font-size: 0.9em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .gitFile:hover { background: var(--vscode-list-hoverBackground, rgba(255,255,255,0.05)); }
      .gitFile.selected { background: var(--vscode-list-activeSelectionBackground, #094771); color: var(--vscode-list-activeSelectionForeground, #fff); }
      .gitFileIcon svg { width: 13px; height: 13px; flex-shrink: 0; }
      .gitFile[data-statuscode="A"] { color: var(--vscode-gitDecoration-addedResourceForeground, #81b88b); }
      .gitFile[data-statuscode="D"] { color: var(--vscode-gitDecoration-deletedResourceForeground, #c74e39); }
      .gitFile[data-statuscode="R"] { color: var(--vscode-gitDecoration-renamedResourceForeground, #73c991); }
      .gitFile.selected[data-statuscode="A"],
      .gitFile.selected[data-statuscode="D"],
      .gitFile.selected[data-statuscode="R"] { color: var(--vscode-list-activeSelectionForeground, #fff); }
      .diff-line { display: block; }
      .diff-add { background: var(--vscode-diffEditor-insertedLineBackground, rgba(155,185,85,0.2)); }
      .diff-del { background: var(--vscode-diffEditor-removedLineBackground, rgba(255,0,0,0.2)); }
      .diff-hunk { color: var(--vscode-descriptionForeground, #888); }
      .diff-header { font-weight: bold; color: var(--vscode-descriptionForeground, #888); }
    `;
  }

  private _getScript(repo: string, commitHash: string) {
    return `
      const vscode = acquireVsCodeApi();
      const repo = ${JSON.stringify(repo)};
      const commitHash = ${JSON.stringify(commitHash)};

      function selectFile(li) {
        document.querySelectorAll('.gitFile').forEach(el => el.classList.remove('selected'));
        li.classList.add('selected');
        document.getElementById('diffPane').innerHTML = '<em>Loading diff...</em>';
        const filePath = decodeURIComponent(li.dataset.filepath);
        vscode.postMessage({ command: 'requestFileDiff', repo, commitHash, filePath });
      }

      function parseDiff(text) {
        if (!text) return '<em>No diff available</em>';
        const lines = text.split(/\\r?\\n/);
        return lines.map(line => {
          let cls = '';
          if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff ')) {
            cls = 'diff-header';
          } else if (line.startsWith('@@')) {
            cls = 'diff-hunk';
          } else if (line.startsWith('+')) {
            cls = 'diff-add';
          } else if (line.startsWith('-')) {
            cls = 'diff-del';
          }
          const escaped = line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          return '<span class="diff-line' + (cls ? ' ' + cls : '') + '">' + escaped + '</span>';
        }).join('');
      }

      window.addEventListener('message', event => {
        const msg = event.data;
        if (msg.command === 'fileDiff') {
          document.getElementById('diffPane').innerHTML = parseDiff(msg.diff);
        }
      });

      document.querySelectorAll('.gitFile').forEach(li => {
        li.addEventListener('click', () => selectFile(li));
      });

      // Auto-select first file on load
      const firstFile = document.querySelector('.gitFile.selected') || document.querySelector('.gitFile');
      if (firstFile) selectFile(firstFile);
    `;
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
