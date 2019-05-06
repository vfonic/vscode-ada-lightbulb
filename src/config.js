"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Config {
    constructor() {
        this.workspaceConfiguration = vscode.workspace.getConfiguration(
          "ada-git"
        );
    }
    autoCenterCommitDetailsView() {
        return this.workspaceConfiguration.get('autoCenterCommitDetailsView', true);
    }
    dateFormat() {
        return this.workspaceConfiguration.get('dateFormat', 'Date & Time');
    }
    dateType() {
        return this.workspaceConfiguration.get('dateType', 'Author Date');
    }
    fetchAvatars() {
        return this.workspaceConfiguration.get('fetchAvatars', false);
    }
    graphColours() {
        return this.workspaceConfiguration.get('graphColours', ['#0085d9', '#d9008f', '#00d90a', '#d98500', '#a300d9', '#ff0000'])
            .filter((v) => v.match(/^\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgb[a]?\s*\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\))\s*$/) !== null);
    }
    graphStyle() {
        return this.workspaceConfiguration.get('graphStyle', 'rounded');
    }
    initialLoadCommits() {
        return this.workspaceConfiguration.get('initialLoadCommits', 300);
    }
    loadMoreCommits() {
        return this.workspaceConfiguration.get('loadMoreCommits', 75);
    }
    maxDepthOfRepoSearch() {
        return this.workspaceConfiguration.get('maxDepthOfRepoSearch', 0);
    }
    showCurrentBranchByDefault() {
        return this.workspaceConfiguration.get('showCurrentBranchByDefault', false);
    }
    showStatusBarItem() {
        return this.workspaceConfiguration.get('showStatusBarItem', true);
    }
    showUncommittedChanges() {
        return this.workspaceConfiguration.get('showUncommittedChanges', true);
    }
    tabIconColourTheme() {
        return this.workspaceConfiguration.get('tabIconColourTheme', 'colour');
    }
    gitPath() {
        let path = vscode.workspace.getConfiguration('git').get('path', null);
        return path !== null ? path : 'git';
    }
}
function getConfig() {
    return new Config();
}
exports.getConfig = getConfig;
//# sourceMappingURL=config.js.map
