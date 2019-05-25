const vscode = require('vscode');
const utils_1 = require('./utils');

const fileChangeRegex = /(^\.git\/(config|index|HEAD|refs\/stash|refs\/heads\/.*|refs\/remotes\/.*|refs\/tags\/.*)$)|(^(?!\.git).*$)|(^\.git[^\/]+$)/;

class RepoFileWatcher {
  constructor(repoChangeCallback) {
    this.repo = null;
    this.fsWatcher = null;
    this.refreshTimeout = null;
    this.muted = false;
    this.resumeAt = 0;
    this.repoChangeCallback = repoChangeCallback;
  }

  start(repo) {
    if (this.fsWatcher != null) {
      this.stop();
    }
    this.repo = repo;
    this.fsWatcher = vscode.workspace.createFileSystemWatcher(repo + '/**');
    this.fsWatcher.onDidCreate(uri => this.refresh(uri));
    this.fsWatcher.onDidChange(uri => this.refresh(uri));
    this.fsWatcher.onDidDelete(uri => this.refresh(uri));
  }

  stop() {
    if (this.fsWatcher != null) {
      this.fsWatcher.dispose();
      this.fsWatcher = null;
    }
  }

  mute() {
    this.muted = true;
  }

  unmute() {
    this.muted = false;
    this.resumeAt = new Date().getTime() + 1500;
  }

  async refresh(uri) {
    if (this.muted) {
      return;
    }
    if (
      !utils_1
        .getPathFromUri(uri)
        .replace(this.repo + '/', '')
        .match(fileChangeRegex)
    ) {
      return;
    }
    if (new Date().getTime() < this.resumeAt) {
      return;
    }
    if (this.refreshTimeout != null) {
      clearTimeout(this.refreshTimeout);
    }
    this.refreshTimeout = setTimeout(() => {
      this.repoChangeCallback();
    }, 750);
  }
}

exports.default = RepoFileWatcher;
