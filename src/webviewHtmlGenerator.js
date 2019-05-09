class WebviewHtmlGenerator {
  constructor(state) {
    this.state = state;
  }

  getHtmlForWebview() {
    const nonce = getNonce();
    const colorParams = this.state.graphColours
      .map((_, index) => `[data-color="${index}"]{--ada-lightbulb-color:var(--ada-lightbulb-color${index});}`)
      .join(' ');
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src vscode-resource: 'unsafe-inline'; script-src vscode-resource: 'nonce-${nonce}'; img-src data:;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" type="text/css" href="${this.getMediaUri('main.css')}">
        <link rel="stylesheet" type="text/css" href="${this.getMediaUri('dropdown.css')}">
        <title>Ada Lightbulb</title>
        <style>${colorParams}"</style>
      </head>
      ${this.getHtmlBodyForWebview(nonce)}
    </html>`;
  }

  getHtmlBodyForWebview(nonce) {
    let body,
      numRepos = Object.keys(this.state.repos).length;
    const colorVars = this.state.graphColours
      .map((graphColor, index) => '--ada-lightbulb-color' + index + ':' + graphColor + ';')
      .join(' ');
    if (numRepos > 0) {
      body = `<body style="${colorVars}">
      <div id="controls">
        <span id="repoControl"><span class="unselectable">Repo: </span><div id="repoSelect" class="dropdown"></div></span>
        <span id="branchControl"><span class="unselectable">Branch: </span><div id="branchSelect" class="dropdown"></div></span>
        <label id="showRemoteBranchesControl"><input type="checkbox" id="showRemoteBranchesCheckbox" value="1" checked>Show Remote Branches</label>
        <div id="refreshBtn" class="roundedBtn">Refresh</div>
      </div>
      <div id="content">
        <div id="commitGraph"></div>
        <div id="commitTable"></div>
      </div>
      <div id="footer"></div>
      <ul id="contextMenu"></ul>
      <div id="dialogBacking"></div>
      <div id="dialog"></div>
      <div id="scrollShadow"></div>
      <script>
        window.exports = class {
          set default(klass) {
            console.log("SETTING:", klass);
            window[klass.constructor.name] = klass;
          }
        };
      </script>
      <script nonce="${nonce}">var viewState = ${JSON.stringify(this.state)};</script>
      <script src="${this.getMediaUri('commitView.js')}"></script>
      <script src="${this.getMediaUri('web.js')}"></script>
      </body>`;
    } else {
      body = `<body class="unableToLoad" style="${colorVars}">
      <h2>Unable to load Ada Lightbulb</h2>
      <p>Either the current workspace does not contain a Git repository, or the Git executable could not be found.</p>
      <p>
        If you are using a portable Git installation, make sure you have set the Visual Studio Code Setting "git.path"
        to the path of your portable installation (e.g. "C:\\Program Files\\Git\\bin\\git.exe" on Windows).
      </p>
      </body>`;
    }
    return body;
  }

  getMediaUri(file) {
    return this.state.assetLoader.getUri('media', file).with({ scheme: 'vscode-resource' });
  }
}

exports.default = WebviewHtmlGenerator;

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
