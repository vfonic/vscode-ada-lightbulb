// @ts-nocheck
const __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }

      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }

      function step(result) {
        if (result.done) {
          resolve(result.value);
        } else {
          new P(function (resolve) {
            resolve(result.value);
          }).then(fulfilled, rejected);
        }
      }

      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
import { evalPromises, getPathFromUri } from './utils';
import fs from 'fs';
import vscode from 'vscode';

class RepoManager {
  constructor(dataSource, extensionState) {
    this.folderWatchers = {};
    this.viewCallback = null;
    this.createEventPaths = [];
    this.changeEventPaths = [];
    this.processCreateEventsTimeout = null;
    this.processChangeEventsTimeout = null;
    this.dataSource = dataSource;
    this.extensionState = extensionState;
    this.repos = extensionState.getRepos();
    this.startupTasks();
    this.folderChangeHandler = vscode.workspace.onDidChangeWorkspaceFolders(e =>
      __awaiter(this, void 0, void 0, function* () {
        if (e.added.length > 0) {
          let path,
            changes = false;
          for (let i = 0; i < e.added.length; i++) {
            path = getPathFromUri(e.added[i].uri);
            if (yield this.searchDirectoryForRepos(path)) {
              changes = true;
            }
            this.startWatchingFolder(path);
          }
          if (changes) {
            this.sendRepos();
          }
        }
        if (e.removed.length > 0) {
          let changes = false,
            path;
          for (let i = 0; i < e.removed.length; i++) {
            path = getPathFromUri(e.removed[i].uri);
            if (this.removeReposWithinFolder(path)) {
              changes = true;
            }
            this.stopWatchingFolder(path);
          }
          if (changes) {
            this.sendRepos();
          }
        }
      })
    );
  }

  dispose() {
    if (this.folderChangeHandler != null) {
      this.folderChangeHandler.dispose();
      this.folderChangeHandler = null;
    }
    const folders = Object.keys(this.folderWatchers);
    for (let i = 0; i < folders.length; i++) {
      this.stopWatchingFolder(folders[i]);
    }
  }

  registerViewCallback(viewCallback) {
    this.viewCallback = viewCallback;
  }

  deregisterViewCallback() {
    this.viewCallback = null;
  }

  startupTasks() {
    return __awaiter(this, void 0, void 0, function* () {
      this.removeReposNotInWorkspace();
      if (!(yield this.checkReposExist())) {
        this.sendRepos();
      }
      yield this.searchWorkspaceForRepos();
      this.startWatchingFolders();
    });
  }

  removeReposNotInWorkspace() {
    const rootsExact = [];
    const rootsFolder = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const repoPaths = Object.keys(this.repos);
    let path;
    if (typeof workspaceFolders !== 'undefined') {
      for (let i = 0; i < workspaceFolders.length; i++) {
        path = getPathFromUri(workspaceFolders[i].uri);
        rootsExact.push(path);
        rootsFolder.push(path + '/');
      }
    }
    for (let i = 0; i < repoPaths.length; i++) {
      if (rootsExact.indexOf(repoPaths[i]) === -1 && !rootsFolder.find(x => repoPaths[i].startsWith(x))) {
        this.removeRepo(repoPaths[i]);
      }
    }
  }

  getRepos() {
    const repoPaths = Object.keys(this.repos).sort(),
      repos = {};
    for (let i = 0; i < repoPaths.length; i++) {
      repos[repoPaths[i]] = this.repos[repoPaths[i]];
    }
    return repos;
  }

  addRepo(repo) {
    this.repos[repo] = { columnWidths: null };
    this.extensionState.saveRepos(this.repos);
  }

  removeRepo(repo) {
    delete this.repos[repo];
    this.extensionState.saveRepos(this.repos);
  }

  removeReposWithinFolder(path) {
    const pathFolder = path + '/';
    const repoPaths = Object.keys(this.repos);
    let changes = false;
    for (let i = 0; i < repoPaths.length; i++) {
      if (repoPaths[i] === path || repoPaths[i].startsWith(pathFolder)) {
        this.removeRepo(repoPaths[i]);
        changes = true;
      }
    }
    return changes;
  }

  isDirectoryWithinRepos(path) {
    const repoPaths = Object.keys(this.repos);
    for (let i = 0; i < repoPaths.length; i++) {
      if (path === repoPaths[i] || path.startsWith(repoPaths[i] + '/')) {
        return true;
      }
    }
    return false;
  }

  sendRepos() {
    const repos = this.getRepos();
    const numRepos = Object.keys(repos).length;
    if (this.viewCallback != null) {
      this.viewCallback(repos, numRepos);
    }
  }

  checkReposExist() {
    return new Promise(resolve => {
      const repoPaths = Object.keys(this.repos);
      let changes = false;
      evalPromises(repoPaths, 3, path => this.dataSource.isGitRepository(path)).then(results => {
        for (let i = 0; i < repoPaths.length; i++) {
          if (!results[i]) {
            this.removeRepo(repoPaths[i]);
            changes = true;
          }
        }
        if (changes) {
          this.sendRepos();
        }
        resolve(changes);
      });
    });
  }

  setRepoState(repo, state) {
    this.repos[repo] = state;
    this.extensionState.saveRepos(this.repos);
  }

  searchWorkspaceForRepos() {
    return __awaiter(this, void 0, void 0, function* () {
      const rootFolders = vscode.workspace.workspaceFolders;
      let changes = false;
      if (typeof rootFolders !== 'undefined') {
        for (let i = 0; i < rootFolders.length; i++) {
          if (yield this.searchDirectoryForRepos(getPathFromUri(rootFolders[i].uri))) {
            changes = true;
          }
        }
      }
      if (changes) {
        this.sendRepos();
      }
    });
  }

  searchDirectoryForRepos(directory) {
    return new Promise(resolve => {
      if (this.isDirectoryWithinRepos(directory)) {
        resolve(false);
        return;
      }
      this.dataSource
        .isGitRepository(directory)
        .then(isRepo => {
          if (isRepo) {
            this.addRepo(directory);
          }
          resolve(isRepo);
        })
        .catch(() => resolve(false));
    });
  }

  startWatchingFolders() {
    const rootFolders = vscode.workspace.workspaceFolders;
    if (typeof rootFolders !== 'undefined') {
      for (let i = 0; i < rootFolders.length; i++) {
        this.startWatchingFolder(getPathFromUri(rootFolders[i].uri));
      }
    }
  }

  startWatchingFolder(path) {
    const watcher = vscode.workspace.createFileSystemWatcher(path + '/**');
    watcher.onDidCreate(uri => this.onWatcherCreate(uri));
    watcher.onDidChange(uri => this.onWatcherChange(uri));
    watcher.onDidDelete(uri => this.onWatcherDelete(uri));
    this.folderWatchers[path] = watcher;
  }

  stopWatchingFolder(path) {
    this.folderWatchers[path].dispose();
    delete this.folderWatchers[path];
  }

  onWatcherCreate(uri) {
    // eslint-disable-next-line require-yield
    return __awaiter(this, void 0, void 0, function* () {
      let path = getPathFromUri(uri);
      if (path.indexOf('/.git/') > -1) {
        return;
      }
      if (path.endsWith('/.git')) {
        path = path.slice(0, -5);
      }
      if (this.createEventPaths.indexOf(path) > -1) {
        return;
      }
      this.createEventPaths.push(path);
      if (this.processCreateEventsTimeout != null) {
        clearTimeout(this.processCreateEventsTimeout);
      }
      this.processCreateEventsTimeout = setTimeout(() => this.processCreateEvents(), 1000);
    });
  }

  onWatcherChange(uri) {
    let path = getPathFromUri(uri);
    if (path.indexOf('/.git/') > -1) {
      return;
    }
    if (path.endsWith('/.git')) {
      path = path.slice(0, -5);
    }
    if (this.changeEventPaths.indexOf(path) > -1) {
      return;
    }
    this.changeEventPaths.push(path);
    if (this.processChangeEventsTimeout != null) {
      clearTimeout(this.processChangeEventsTimeout);
    }
    this.processChangeEventsTimeout = setTimeout(() => this.processChangeEvents(), 1000);
  }

  onWatcherDelete(uri) {
    let path = getPathFromUri(uri);
    if (path.indexOf('/.git/') > -1) {
      return;
    }
    if (path.endsWith('/.git')) {
      path = path.slice(0, -5);
    }
    if (this.removeReposWithinFolder(path)) {
      this.sendRepos();
    }
  }

  processCreateEvents() {
    return __awaiter(this, void 0, void 0, function* () {
      let path,
        changes = false;
      while ((path = this.createEventPaths.shift())) {
        if (yield isDirectory(path)) {
          if (yield this.searchDirectoryForRepos(path)) {
            changes = true;
          }
        }
      }
      this.processCreateEventsTimeout = null;
      if (changes) {
        this.sendRepos();
      }
    });
  }

  processChangeEvents() {
    return __awaiter(this, void 0, void 0, function* () {
      let path,
        changes = false;
      while ((path = this.changeEventPaths.shift())) {
        if (!(yield doesPathExist(path))) {
          if (this.removeReposWithinFolder(path)) {
            changes = true;
          }
        }
      }
      this.processChangeEventsTimeout = null;
      if (changes) {
        this.sendRepos();
      }
    });
  }
}

export default RepoManager;

function isDirectory(path) {
  return new Promise(resolve => {
    fs.stat(path, (err, stats) => {
      resolve(err ? false : stats.isDirectory());
    });
  });
}

function doesPathExist(path) {
  return new Promise(resolve => {
    fs.stat(path, err => resolve(!err));
  });
}
