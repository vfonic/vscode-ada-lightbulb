const path = require('path');
const vscode = require('vscode');
const Config = require('./config').default;
const CommitDetailsFactory = require('./CommitDetailsFactory').default;
const diffDocProvider_1 = require('./diffDocProvider');
const RepoFileWatcher = require('./repoFileWatcher').default;
const utils_1 = require('./utils');
const AssetLoader = require('./assetLoader').default;
const WebviewHtmlGenerator = require('./webviewHtmlGenerator').default;

const configuration = new Config();

class GitGraphView {
  constructor(panel, extensionPath, dataSource, extensionState, avatarManager, repoManager) {
    this.disposables = [];
    this.isGraphViewLoaded = false;
    this.isPanelVisible = true;
    this.currentRepo = null;
    this.panel = panel;
    this.assetLoader = new AssetLoader(extensionPath);
    this.extensionPath = extensionPath;
    this.avatarManager = avatarManager;
    this.dataSource = dataSource;
    this.extensionState = extensionState;
    this.repoManager = repoManager;
    this.avatarManager.registerView(this);
    panel.iconPath =
      configuration.tabIconColorTheme === 'color'
        ? this.assetLoader.getUri('resources', 'webview-icon.svg')
        : {
            light: this.assetLoader.getUri('resources', 'webview-icon-light.svg'),
            dark: this.assetLoader.getUri('resources', 'webview-icon-dark.svg'),
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
    this.repoFileWatcher = new RepoFileWatcher(() => {
      if (this.panel.visible) {
        this.sendMessage({ command: 'refresh' });
      }
    });
    this.repoManager.registerViewCallback((repos, numRepos) => {
      if (!this.panel.visible) {
        return;
      }
      if ((numRepos === 0 && this.isGraphViewLoaded) || (numRepos > 0 && !this.isGraphViewLoaded)) {
        this.update();
      } else {
        this.respondLoadRepos(repos);
      }
    });
    this.panel.webview.onDidReceiveMessage(
      async msg => {
        if (this.dataSource == null) {
          return;
        }
        this.repoFileWatcher.mute();
        switch (msg.command) {
          case 'addTag':
            this.sendMessage({
              command: 'addTag',
              status: await this.dataSource.addTag(msg.repo, msg.tagName, msg.commitHash, msg.lightweight, msg.message),
            });
            break;
          case 'fetchAvatar':
            this.avatarManager.fetchAvatarImage(msg.email, msg.repo, msg.commits);
            break;
          case 'checkoutBranch':
            this.sendMessage({
              command: 'checkoutBranch',
              status: await this.dataSource.checkoutBranch(msg.repo, msg.branchName, msg.remoteBranch),
            });
            break;
          case 'checkoutCommit':
            this.sendMessage({
              command: 'checkoutCommit',
              status: await this.dataSource.checkoutCommit(msg.repo, msg.commitHash),
            });
            break;
          case 'cherrypickCommit':
            this.sendMessage({
              command: 'cherrypickCommit',
              status: await this.dataSource.cherrypickCommit(msg.repo, msg.commitHash, msg.parentIndex),
            });
            break;
          case 'commitDetails':
            this.sendMessage({
              command: 'commitDetails',
              commitDetails: await CommitDetailsFactory.initialize(msg.repo, msg.commitHash).call(),
            });
            break;
          case 'copyToClipboard':
            this.sendMessage({
              command: 'copyToClipboard',
              type: msg.type,
              success: await utils_1.copyToClipboard(msg.data),
            });
            break;
          case 'createBranch':
            this.sendMessage({
              command: 'createBranch',
              status: await this.dataSource.createBranch(msg.repo, msg.branchName, msg.commitHash),
            });
            break;
          case 'deleteBranch':
            this.sendMessage({
              command: 'deleteBranch',
              status: await this.dataSource.deleteBranch(msg.repo, msg.branchName, msg.forceDelete),
            });
            break;
          case 'deleteTag':
            this.sendMessage({
              command: 'deleteTag',
              status: await this.dataSource.deleteTag(msg.repo, msg.tagName),
            });
            break;
          case 'loadBranches':
            const branchData = await this.dataSource.getBranches(msg.repo, msg.showRemoteBranches);
            const isRepo = branchData.error ? await this.dataSource.isGitRepository(msg.repo) : true;
            this.sendMessage({
              command: 'loadBranches',
              branches: branchData.branches,
              head: branchData.head,
              hard: msg.hard,
              isRepo: isRepo,
            });
            if (msg.repo !== this.currentRepo) {
              this.currentRepo = msg.repo;
              this.extensionState.setLastActiveRepo(msg.repo);
              this.repoFileWatcher.start(msg.repo);
            }
            break;
          case 'loadCommits':
            this.sendMessage(
              Object.assign(
                { command: 'loadCommits' },
                await this.dataSource.getCommits(msg.repo, msg.branchName, msg.maxCommits, msg.showRemoteBranches),
                { hard: msg.hard }
              )
            );
            break;
          case 'loadRepos':
            if (!msg.check || !(await this.repoManager.checkReposExist())) {
              this.respondLoadRepos(this.repoManager.getRepos());
            }
            break;
          case 'mergeBranch':
            this.sendMessage({
              command: 'mergeBranch',
              status: await this.dataSource.mergeBranch(msg.repo, msg.branchName, msg.createNewCommit),
            });
            break;
          case 'mergeCommit':
            this.sendMessage({
              command: 'mergeCommit',
              status: await this.dataSource.mergeCommit(msg.repo, msg.commitHash, msg.createNewCommit),
            });
            break;
          case 'pushTag':
            this.sendMessage({
              command: 'pushTag',
              status: await this.dataSource.pushTag(msg.repo, msg.tagName),
            });
            break;
          case 'renameBranch':
            this.sendMessage({
              command: 'renameBranch',
              status: await this.dataSource.renameBranch(msg.repo, msg.oldName, msg.newName),
            });
            break;
          case 'resetToCommit':
            this.sendMessage({
              command: 'resetToCommit',
              status: await this.dataSource.resetToCommit(msg.repo, msg.commitHash, msg.resetMode),
            });
            break;
          case 'revertCommit':
            this.sendMessage({
              command: 'revertCommit',
              status: await this.dataSource.revertCommit(msg.repo, msg.commitHash, msg.parentIndex),
            });
            break;
          case 'saveRepoState':
            this.repoManager.setRepoState(msg.repo, msg.state);
            break;
          case 'viewDiff':
            this.sendMessage({
              command: 'viewDiff',
              success: await this.viewDiff(msg.repo, msg.commitHash, msg.oldFilePath, msg.newFilePath, msg.type),
            });
            break;
        }
        this.repoFileWatcher.unmute();
      },
      null,
      this.disposables
    );
  }

  static createOrShow(extensionPath, dataSource, extensionState, avatarManager, repoManager) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : vscode.ViewColumn.One;
    if (GitGraphView.currentPanel) {
      GitGraphView.currentPanel.panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel('ada-lightbulb', 'Ada Lightbulb', column, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))],
    });
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
      if (x) {
        x.dispose();
      }
    }
  }

  async update() {
    const viewState = {
      assetLoader: this.assetLoader,
      dateFormat: configuration.dateFormat,
      fetchAvatars: configuration.fetchAvatars && this.extensionState.isAvatarStorageAvailable(),
      graphColors: configuration.graphColors,
      graphStyle: configuration.graphStyle,
      initialLoadCommits: configuration.initialLoadCommits,
      lastActiveRepo: this.extensionState.getLastActiveRepo(),
      loadMoreCommits: configuration.loadMoreCommits,
      repos: this.repoManager.getRepos(),
      showCurrentBranchByDefault: configuration.showCurrentBranchByDefault,
    };
    this.panel.webview.html = new WebviewHtmlGenerator(viewState).getHtmlForWebview();

    const numRepos = this.repoManager.getRepos().length;
    this.isGraphViewLoaded = numRepos > 0;
  }

  respondLoadRepos(repos) {
    this.sendMessage({
      command: 'loadRepos',
      repos: repos,
      lastActiveRepo: this.extensionState.getLastActiveRepo(),
    });
  }

  viewDiff(repo, commitHash, oldFilePath, newFilePath, type) {
    const abbrevHash = utils_1.abbrevCommit(commitHash);
    const pathComponents = newFilePath.split('/');
    const title =
      pathComponents[pathComponents.length - 1] +
      ' (' +
      (type === 'A'
        ? 'Added in ' + abbrevHash
        : type === 'D'
        ? 'Deleted in ' + abbrevHash
        : utils_1.abbrevCommit(commitHash) + '^ ↔ ' + utils_1.abbrevCommit(commitHash)) +
      ')';
    return new Promise(resolve => {
      vscode.commands
        .executeCommand(
          'vscode.diff',
          diffDocProvider_1.encodeDiffDocUri(repo, oldFilePath, commitHash + '^'),
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
