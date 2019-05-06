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
const vscode = require("vscode");
const utils_1 = require("./utils2");
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
        if (this.fsWatcher !== null) {
            this.stop();
        }
        this.repo = repo;
        this.fsWatcher = vscode.workspace.createFileSystemWatcher(repo + '/**');
        this.fsWatcher.onDidCreate(uri => this.refesh(uri));
        this.fsWatcher.onDidChange(uri => this.refesh(uri));
        this.fsWatcher.onDidDelete(uri => this.refesh(uri));
    }
    stop() {
        if (this.fsWatcher !== null) {
            this.fsWatcher.dispose();
            this.fsWatcher = null;
        }
    }
    mute() {
        this.muted = true;
    }
    unmute() {
        this.muted = false;
        this.resumeAt = (new Date()).getTime() + 1500;
    }
    refesh(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.muted)
                return;
            if (!utils_1.getPathFromUri(uri).replace(this.repo + '/', '').match(fileChangeRegex))
                return;
            if ((new Date()).getTime() < this.resumeAt)
                return;
            if (this.refreshTimeout !== null) {
                clearTimeout(this.refreshTimeout);
            }
            this.refreshTimeout = setTimeout(() => {
                this.repoChangeCallback();
            }, 750);
        });
    }
}
exports.RepoFileWatcher = RepoFileWatcher;
//# sourceMappingURL=repoFileWatcher.js.map
