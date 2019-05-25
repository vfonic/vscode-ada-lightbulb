const LAST_ACTIVE_REPO = 'lastActiveRepo';
const REPO_STATES = 'repoStates';

class ExtensionState {
  constructor(context) {
    this.globalState = context.globalState;
    this.workspaceState = context.workspaceState;
    this.globalStoragePath = context.globalStoragePath;
  }

  getRepos() {
    return this.workspaceState.get(REPO_STATES, {});
  }

  saveRepos(gitRepoSet) {
    this.workspaceState.update(REPO_STATES, gitRepoSet);
  }

  getLastActiveRepo() {
    return this.workspaceState.get(LAST_ACTIVE_REPO, null);
  }

  setLastActiveRepo(repo) {
    this.workspaceState.update(LAST_ACTIVE_REPO, repo);
  }
}

exports.default = ExtensionState;
