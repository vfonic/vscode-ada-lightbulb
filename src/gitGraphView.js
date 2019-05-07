"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : new P(function(resolve) {
              resolve(result.value);
            }).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const config_1 = require("./config");
const diffDocProvider_1 = require("./diffDocProvider");
const repoFileWatcher_1 = require("./repoFileWatcher");
const utils_1 = require("./utils");
class GitGraphView {
  constructor(
    panel,
    extensionPath,
    dataSource,
    extensionState,
    avatarManager,
    repoManager
  ) {
    this.disposables = [];
    this.isGraphViewLoaded = false;
    this.isPanelVisible = true;
    this.currentRepo = null;
    this.panel = panel;
    this.extensionPath = extensionPath;
    this.avatarManager = avatarManager;
    this.dataSource = dataSource;
    this.extensionState = extensionState;
    this.repoManager = repoManager;
    this.avatarManager.registerView(this);
    panel.iconPath =
      config_1.getConfig().tabIconColourTheme() === "colour"
        ? this.getUri("resources", "webview-icon.svg")
        : {
            light: this.getUri("resources", "webview-icon-light.svg"),
            dark: this.getUri("resources", "webview-icon-dark.svg")
          };
    this.update();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.onDidChangeViewState(
      () => {
        if (this.panel.visible !== this.isPanelVisible) {
          if (this.panel.visible) {
            this.update();
          } else {
            this.currentRepo = null;
            this.repoFileWatcher.stop();
          }
          this.isPanelVisible = this.panel.visible;
        }
      },
      null,
      this.disposables
    );
    this.repoFileWatcher = new repoFileWatcher_1.RepoFileWatcher(() => {
      if (this.panel.visible) {
        this.sendMessage({ command: "refresh" });
      }
    });
    this.repoManager.registerViewCallback((repos, numRepos) => {
      if (!this.panel.visible) return;
      if (
        (numRepos === 0 && this.isGraphViewLoaded) ||
        (numRepos > 0 && !this.isGraphViewLoaded)
      ) {
        this.update();
      } else {
        this.respondLoadRepos(repos);
      }
    });
    this.panel.webview.onDidReceiveMessage(
      msg =>
        __awaiter(this, void 0, void 0, function*() {
          if (this.dataSource === null) return;
          this.repoFileWatcher.mute();
          switch (msg.command) {
            case "addTag":
              this.sendMessage({
                command: "addTag",
                status: yield this.dataSource.addTag(
                  msg.repo,
                  msg.tagName,
                  msg.commitHash,
                  msg.lightweight,
                  msg.message
                )
              });
              break;
            case "fetchAvatar":
              this.avatarManager.fetchAvatarImage(
                msg.email,
                msg.repo,
                msg.commits
              );
              break;
            case "checkoutBranch":
              this.sendMessage({
                command: "checkoutBranch",
                status: yield this.dataSource.checkoutBranch(
                  msg.repo,
                  msg.branchName,
                  msg.remoteBranch
                )
              });
              break;
            case "checkoutCommit":
              this.sendMessage({
                command: "checkoutCommit",
                status: yield this.dataSource.checkoutCommit(
                  msg.repo,
                  msg.commitHash
                )
              });
              break;
            case "cherrypickCommit":
              this.sendMessage({
                command: "cherrypickCommit",
                status: yield this.dataSource.cherrypickCommit(
                  msg.repo,
                  msg.commitHash,
                  msg.parentIndex
                )
              });
              break;
            case "commitDetails":
              this.sendMessage({
                command: "commitDetails",
                commitDetails: yield this.dataSource.commitDetails(
                  msg.repo,
                  msg.commitHash
                )
              });
              break;
            case "copyToClipboard":
              this.sendMessage({
                command: "copyToClipboard",
                type: msg.type,
                success: yield utils_1.copyToClipboard(msg.data)
              });
              break;
            case "createBranch":
              this.sendMessage({
                command: "createBranch",
                status: yield this.dataSource.createBranch(
                  msg.repo,
                  msg.branchName,
                  msg.commitHash
                )
              });
              break;
            case "deleteBranch":
              this.sendMessage({
                command: "deleteBranch",
                status: yield this.dataSource.deleteBranch(
                  msg.repo,
                  msg.branchName,
                  msg.forceDelete
                )
              });
              break;
            case "deleteTag":
              this.sendMessage({
                command: "deleteTag",
                status: yield this.dataSource.deleteTag(msg.repo, msg.tagName)
              });
              break;
            case "loadBranches":
              let branchData = yield this.dataSource.getBranches(
                  msg.repo,
                  msg.showRemoteBranches
                ),
                isRepo = true;
              if (branchData.error) {
                isRepo = yield this.dataSource.isGitRepository(msg.repo);
              }
              this.sendMessage({
                command: "loadBranches",
                branches: branchData.branches,
                head: branchData.head,
                hard: msg.hard,
                isRepo: isRepo
              });
              if (msg.repo !== this.currentRepo) {
                this.currentRepo = msg.repo;
                this.extensionState.setLastActiveRepo(msg.repo);
                this.repoFileWatcher.start(msg.repo);
              }
              break;
            case "loadCommits":
              this.sendMessage(
                Object.assign(
                  { command: "loadCommits" },
                  yield this.dataSource.getCommits(
                    msg.repo,
                    msg.branchName,
                    msg.maxCommits,
                    msg.showRemoteBranches
                  ),
                  { hard: msg.hard }
                )
              );
              break;
            case "loadRepos":
              if (!msg.check || !(yield this.repoManager.checkReposExist())) {
                this.respondLoadRepos(this.repoManager.getRepos());
              }
              break;
            case "mergeBranch":
              this.sendMessage({
                command: "mergeBranch",
                status: yield this.dataSource.mergeBranch(
                  msg.repo,
                  msg.branchName,
                  msg.createNewCommit
                )
              });
              break;
            case "mergeCommit":
              this.sendMessage({
                command: "mergeCommit",
                status: yield this.dataSource.mergeCommit(
                  msg.repo,
                  msg.commitHash,
                  msg.createNewCommit
                )
              });
              break;
            case "pushTag":
              this.sendMessage({
                command: "pushTag",
                status: yield this.dataSource.pushTag(msg.repo, msg.tagName)
              });
              break;
            case "renameBranch":
              this.sendMessage({
                command: "renameBranch",
                status: yield this.dataSource.renameBranch(
                  msg.repo,
                  msg.oldName,
                  msg.newName
                )
              });
              break;
            case "resetToCommit":
              this.sendMessage({
                command: "resetToCommit",
                status: yield this.dataSource.resetToCommit(
                  msg.repo,
                  msg.commitHash,
                  msg.resetMode
                )
              });
              break;
            case "revertCommit":
              this.sendMessage({
                command: "revertCommit",
                status: yield this.dataSource.revertCommit(
                  msg.repo,
                  msg.commitHash,
                  msg.parentIndex
                )
              });
              break;
            case "saveRepoState":
              this.repoManager.setRepoState(msg.repo, msg.state);
              break;
            case "viewDiff":
              this.sendMessage({
                command: "viewDiff",
                success: yield this.viewDiff(
                  msg.repo,
                  msg.commitHash,
                  msg.oldFilePath,
                  msg.newFilePath,
                  msg.type
                )
              });
              break;
          }
          this.repoFileWatcher.unmute();
        }),
      null,
      this.disposables
    );
  }
  static createOrShow(
    extensionPath,
    dataSource,
    extensionState,
    avatarManager,
    repoManager
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    if (GitGraphView.currentPanel) {
      GitGraphView.currentPanel.panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      "ada-git",
      "Ada Git",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(extensionPath, "media"))]
      }
    );
    GitGraphView.currentPanel = new GitGraphView(
      panel,
      extensionPath,
      dataSource,
      extensionState,
      avatarManager,
      repoManager
    );
  }
  sendMessage(msg) {
    this.panel.webview.postMessage(msg);
  }
  dispose() {
    GitGraphView.currentPanel = undefined;
    this.panel.dispose();
    this.avatarManager.deregisterView();
    this.repoFileWatcher.stop();
    this.repoManager.deregisterViewCallback();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) x.dispose();
    }
  }
  update() {
    return __awaiter(this, void 0, void 0, function*() {
      this.panel.webview.html = yield this.getHtmlForWebview();
    });
  }
  getHtmlForWebview() {
    const config = config_1.getConfig();
    const viewState = {
      autoCenterCommitDetailsView: config.autoCenterCommitDetailsView(),
      dateFormat: config.dateFormat(),
      fetchAvatars:
        config.fetchAvatars() && this.extensionState.isAvatarStorageAvailable(),
      graphColours: config.graphColours(),
      graphStyle: config.graphStyle(),
      initialLoadCommits: config.initialLoadCommits(),
      lastActiveRepo: this.extensionState.getLastActiveRepo(),
      loadMoreCommits: config.loadMoreCommits(),
      repos: this.repoManager.getRepos(),
      showCurrentBranchByDefault: config.showCurrentBranchByDefault()
    };
    const nonce = getNonce();
    const colorParams = viewState.graphColours.map((graphColor, index) => '[data-color="' + index + '"]{--ada-git-color:var(--ada-git-color' + index + ");}").join(' ');
    return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src vscode-resource: 'unsafe-inline'; script-src vscode-resource: 'nonce-${nonce}'; img-src data:;">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link rel="stylesheet" type="text/css" href="${this.getMediaUri("main.css")}">
				<link rel="stylesheet" type="text/css" href="${this.getMediaUri("dropdown.css")}">
				<title>Ada Git</title>
				<style>${colorParams}"</style>
			</head>
			${this.getHtmlBodyForWebview(nonce, viewState)}
		</html>`;
  }
  getHtmlBodyForWebview(nonce, viewState) {
    let body, numRepos = Object.keys(viewState.repos).length;
    const colorVars = viewState.graphColours.map((graphColor, index) => "--ada-git-color" + index + ":" + graphColor + ";").join(' ');
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
			<script nonce="${nonce}">var viewState = ${JSON.stringify(viewState)};</script>
			<script src="${this.getMediaUri("web.js")}"></script>
			</body>`;
    } else {
      body = `<body class="unableToLoad" style="${colorVars}">
			<h2>Unable to load Ada Git</h2>
			<p>Either the current workspace does not contain a Git repository, or the Git executable could not be found.</p>
			<p>If you are using a portable Git installation, make sure you have set the Visual Studio Code Setting "git.path" to the path of your portable installation (e.g. "C:\\Program Files\\Git\\bin\\git.exe" on Windows).</p>
			</body>`;
    }
    this.isGraphViewLoaded = numRepos > 0;
    return body;
  }
  getMediaUri(file) {
    return this.getUri("media", file).with({ scheme: "vscode-resource" });
  }
  getUri(...pathComps) {
    return vscode.Uri.file(path.join(this.extensionPath, ...pathComps));
  }
  respondLoadRepos(repos) {
    this.sendMessage({
      command: "loadRepos",
      repos: repos,
      lastActiveRepo: this.extensionState.getLastActiveRepo()
    });
  }
  viewDiff(repo, commitHash, oldFilePath, newFilePath, type) {
    let abbrevHash = utils_1.abbrevCommit(commitHash);
    let pathComponents = newFilePath.split("/");
    let title =
      pathComponents[pathComponents.length - 1] +
      " (" +
      (type === "A"
        ? "Added in " + abbrevHash
        : type === "D"
        ? "Deleted in " + abbrevHash
        : utils_1.abbrevCommit(commitHash) +
          "^ ↔ " +
          utils_1.abbrevCommit(commitHash)) +
      ")";
    return new Promise(resolve => {
      vscode.commands
        .executeCommand(
          "vscode.diff",
          diffDocProvider_1.encodeDiffDocUri(
            repo,
            oldFilePath,
            commitHash + "^"
          ),
          diffDocProvider_1.encodeDiffDocUri(repo, newFilePath, commitHash),
          title,
          { preview: true }
        )
        .then(() => resolve(true))
        .then(() => resolve(false));
    });
  }
}
exports.GitGraphView = GitGraphView;
function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
//# sourceMappingURL=gitGraphView.js.map
