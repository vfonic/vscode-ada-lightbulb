"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const vscode = require("vscode");
const config_1 = require("./config");
const utils_1 = require("./utils");
class RepoManager {
    constructor(dataSource, extensionState, statusBarItem) {
        this.folderWatchers = {};
        this.viewCallback = null;
        this.createEventPaths = [];
        this.changeEventPaths = [];
        this.processCreateEventsTimeout = null;
        this.processChangeEventsTimeout = null;
        this.dataSource = dataSource;
        this.extensionState = extensionState;
        this.statusBarItem = statusBarItem;
        this.repos = extensionState.getRepos();
        this.maxDepthOfRepoSearch = config_1.getConfig().maxDepthOfRepoSearch();
        this.startupTasks();
        this.folderChangeHandler = vscode.workspace.onDidChangeWorkspaceFolders((e) => __awaiter(this, void 0, void 0, function* () {
            if (e.added.length > 0) {
                let path, changes = false;
                for (let i = 0; i < e.added.length; i++) {
                    path = utils_1.getPathFromUri(e.added[i].uri);
                    if (yield this.searchDirectoryForRepos(path, this.maxDepthOfRepoSearch))
                        changes = true;
                    this.startWatchingFolder(path);
                }
                if (changes)
                    this.sendRepos();
            }
            if (e.removed.length > 0) {
                let changes = false, path;
                for (let i = 0; i < e.removed.length; i++) {
                    path = utils_1.getPathFromUri(e.removed[i].uri);
                    if (this.removeReposWithinFolder(path))
                        changes = true;
                    this.stopWatchingFolder(path);
                }
                if (changes)
                    this.sendRepos();
            }
        }));
    }
    dispose() {
        if (this.folderChangeHandler !== null) {
            this.folderChangeHandler.dispose();
            this.folderChangeHandler = null;
        }
        let folders = Object.keys(this.folderWatchers);
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
    maxDepthOfRepoSearchChanged() {
        let newDepth = config_1.getConfig().maxDepthOfRepoSearch();
        if (newDepth > this.maxDepthOfRepoSearch) {
            this.maxDepthOfRepoSearch = newDepth;
            this.searchWorkspaceForRepos();
        }
        else {
            this.maxDepthOfRepoSearch = newDepth;
        }
    }
    startupTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            this.removeReposNotInWorkspace();
            if (!(yield this.checkReposExist()))
                this.sendRepos();
            yield this.searchWorkspaceForRepos();
            this.startWatchingFolders();
        });
    }
    removeReposNotInWorkspace() {
        let rootsExact = [], rootsFolder = [], workspaceFolders = vscode.workspace.workspaceFolders, repoPaths = Object.keys(this.repos), path;
        if (typeof workspaceFolders !== 'undefined') {
            for (let i = 0; i < workspaceFolders.length; i++) {
                path = utils_1.getPathFromUri(workspaceFolders[i].uri);
                rootsExact.push(path);
                rootsFolder.push(path + '/');
            }
        }
        for (let i = 0; i < repoPaths.length; i++) {
            if (rootsExact.indexOf(repoPaths[i]) === -1 && !rootsFolder.find(x => repoPaths[i].startsWith(x)))
                this.removeRepo(repoPaths[i]);
        }
    }
    getRepos() {
        let repoPaths = Object.keys(this.repos).sort(), repos = {};
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
        let pathFolder = path + '/', repoPaths = Object.keys(this.repos), changes = false;
        for (let i = 0; i < repoPaths.length; i++) {
            if (repoPaths[i] === path || repoPaths[i].startsWith(pathFolder)) {
                this.removeRepo(repoPaths[i]);
                changes = true;
            }
        }
        return changes;
    }
    isDirectoryWithinRepos(path) {
        let repoPaths = Object.keys(this.repos);
        for (let i = 0; i < repoPaths.length; i++) {
            if (path === repoPaths[i] || path.startsWith(repoPaths[i] + '/'))
                return true;
        }
        return false;
    }
    sendRepos() {
        let repos = this.getRepos();
        let numRepos = Object.keys(repos).length;
        this.statusBarItem.setNumRepos(numRepos);
        if (this.viewCallback !== null)
            this.viewCallback(repos, numRepos);
    }
    checkReposExist() {
        return new Promise(resolve => {
            let repoPaths = Object.keys(this.repos), changes = false;
            utils_1.evalPromises(repoPaths, 3, path => this.dataSource.isGitRepository(path)).then(results => {
                for (let i = 0; i < repoPaths.length; i++) {
                    if (!results[i]) {
                        this.removeRepo(repoPaths[i]);
                        changes = true;
                    }
                }
                if (changes)
                    this.sendRepos();
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
            let rootFolders = vscode.workspace.workspaceFolders, changes = false;
            if (typeof rootFolders !== 'undefined') {
                for (let i = 0; i < rootFolders.length; i++) {
                    if (yield this.searchDirectoryForRepos(utils_1.getPathFromUri(rootFolders[i].uri), this.maxDepthOfRepoSearch))
                        changes = true;
                }
            }
            if (changes)
                this.sendRepos();
        });
    }
    searchDirectoryForRepos(directory, maxDepth) {
        return new Promise(resolve => {
            if (this.isDirectoryWithinRepos(directory)) {
                resolve(false);
                return;
            }
            this.dataSource.isGitRepository(directory).then(isRepo => {
                if (isRepo) {
                    this.addRepo(directory);
                    resolve(true);
                }
                else if (maxDepth > 0) {
                    fs.readdir(directory, (err, dirContents) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            resolve(false);
                        }
                        else {
                            let dirs = [];
                            for (let i = 0; i < dirContents.length; i++) {
                                if (dirContents[i] !== '.git' && (yield isDirectory(directory + '/' + dirContents[i]))) {
                                    dirs.push(directory + '/' + dirContents[i]);
                                }
                            }
                            resolve((yield utils_1.evalPromises(dirs, 2, dir => this.searchDirectoryForRepos(dir, maxDepth - 1))).indexOf(true) > -1);
                        }
                    }));
                }
                else {
                    resolve(false);
                }
            }).catch(() => resolve(false));
        });
    }
    startWatchingFolders() {
        let rootFolders = vscode.workspace.workspaceFolders;
        if (typeof rootFolders !== 'undefined') {
            for (let i = 0; i < rootFolders.length; i++) {
                this.startWatchingFolder(utils_1.getPathFromUri(rootFolders[i].uri));
            }
        }
    }
    startWatchingFolder(path) {
        let watcher = vscode.workspace.createFileSystemWatcher(path + '/**');
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
        return __awaiter(this, void 0, void 0, function* () {
            let path = utils_1.getPathFromUri(uri);
            if (path.indexOf('/.git/') > -1)
                return;
            if (path.endsWith('/.git'))
                path = path.slice(0, -5);
            if (this.createEventPaths.indexOf(path) > -1)
                return;
            this.createEventPaths.push(path);
            if (this.processCreateEventsTimeout !== null)
                clearTimeout(this.processCreateEventsTimeout);
            this.processCreateEventsTimeout = setTimeout(() => this.processCreateEvents(), 1000);
        });
    }
    onWatcherChange(uri) {
        let path = utils_1.getPathFromUri(uri);
        if (path.indexOf('/.git/') > -1)
            return;
        if (path.endsWith('/.git'))
            path = path.slice(0, -5);
        if (this.changeEventPaths.indexOf(path) > -1)
            return;
        this.changeEventPaths.push(path);
        if (this.processChangeEventsTimeout !== null)
            clearTimeout(this.processChangeEventsTimeout);
        this.processChangeEventsTimeout = setTimeout(() => this.processChangeEvents(), 1000);
    }
    onWatcherDelete(uri) {
        let path = utils_1.getPathFromUri(uri);
        if (path.indexOf('/.git/') > -1)
            return;
        if (path.endsWith('/.git'))
            path = path.slice(0, -5);
        if (this.removeReposWithinFolder(path))
            this.sendRepos();
    }
    processCreateEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            let path, changes = false;
            while (path = this.createEventPaths.shift()) {
                if (yield isDirectory(path)) {
                    if (yield this.searchDirectoryForRepos(path, this.maxDepthOfRepoSearch))
                        changes = true;
                }
            }
            this.processCreateEventsTimeout = null;
            if (changes)
                this.sendRepos();
        });
    }
    processChangeEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            let path, changes = false;
            while (path = this.changeEventPaths.shift()) {
                if (!(yield doesPathExist(path))) {
                    if (this.removeReposWithinFolder(path))
                        changes = true;
                }
            }
            this.processChangeEventsTimeout = null;
            if (changes)
                this.sendRepos();
        });
    }
}
exports.RepoManager = RepoManager;
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
//# sourceMappingURL=repoManager.js.map
