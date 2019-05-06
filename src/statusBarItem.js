"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const config_1 = require("./config");
class StatusBarItem {
    constructor(context) {
        this.numRepos = 0;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.statusBarItem.text = 'Git Graph';
        this.statusBarItem.tooltip = 'View Git Graph';
        this.statusBarItem.command = 'git-graph.view';
        context.subscriptions.push(this.statusBarItem);
    }
    setNumRepos(numRepos) {
        this.numRepos = numRepos;
        this.refresh();
    }
    refresh() {
        if (config_1.getConfig().showStatusBarItem() && this.numRepos > 0) {
            this.statusBarItem.show();
        }
        else {
            this.statusBarItem.hide();
        }
    }
}
exports.StatusBarItem = StatusBarItem;
//# sourceMappingURL=statusBarItem.js.map