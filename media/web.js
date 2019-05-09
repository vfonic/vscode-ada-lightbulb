window.vscode = acquireVsCodeApi();

new ContextMenu();
var graphViewConfig = {
  autoCenterCommitDetailsView: viewState.autoCenterCommitDetailsView,
  fetchAvatars: viewState.fetchAvatars,
  graphColours: viewState.graphColours,
  graphStyle: viewState.graphStyle,
  grid: {
    x: 16,
    y: 24,
    offsetX: 8,
    offsetY: 12,
    expandY: 250,
  },
  initialLoadCommits: viewState.initialLoadCommits,
  loadMoreCommits: viewState.loadMoreCommits,
  showCurrentBranchByDefault: viewState.showCurrentBranchByDefault,
};
const gitGraph = new GitGraphView(viewState.repos, viewState.lastActiveRepo, graphViewConfig, vscode.getState());
window.addEventListener('message', function(event) {
  var msg = event.data;
  switch (msg.command) {
    case 'addTag':
      refreshGraphOrDisplayError(msg.status, 'Unable to Add Tag');
      break;
    case 'checkoutBranch':
      refreshGraphOrDisplayError(msg.status, 'Unable to Checkout Branch');
      break;
    case 'checkoutCommit':
      refreshGraphOrDisplayError(msg.status, 'Unable to Checkout Commit');
      break;
    case 'cherrypickCommit':
      refreshGraphOrDisplayError(msg.status, 'Unable to Cherry Pick Commit');
      break;
    case 'commitDetails':
      if (msg.commitDetails === null) {
        gitGraph.hideCommitDetails();
        Dialog.showErrorDialog('Unable to load commit details', null, null);
      } else {
        gitGraph.showCommitDetails(msg.commitDetails, generateGitFileTree(msg.commitDetails.fileChanges));
      }
      break;
    case 'copyToClipboard':
      if (msg.success === false) {
        Dialog.showErrorDialog('Unable to Copy ' + msg.type + ' to Clipboard', null, null);
      }
      break;
    case 'createBranch':
      refreshGraphOrDisplayError(msg.status, 'Unable to Create Branch');
      break;
    case 'deleteBranch':
      refreshGraphOrDisplayError(msg.status, 'Unable to Delete Branch');
      break;
    case 'deleteTag':
      refreshGraphOrDisplayError(msg.status, 'Unable to Delete Tag');
      break;
    case 'fetchAvatar':
      gitGraph.loadAvatar(msg.email, msg.image);
      break;
    case 'loadBranches':
      gitGraph.loadBranches(msg.branches, msg.head, msg.hard, msg.isRepo);
      break;
    case 'loadCommits':
      gitGraph.loadCommits(msg.commits, msg.head, msg.moreCommitsAvailable, msg.hard);
      break;
    case 'loadRepos':
      gitGraph.loadRepos(msg.repos, msg.lastActiveRepo);
      break;
    case 'mergeBranch':
      refreshGraphOrDisplayError(msg.status, 'Unable to Merge Branch');
      break;
    case 'mergeCommit':
      refreshGraphOrDisplayError(msg.status, 'Unable to Merge Commit');
      break;
    case 'pushTag':
      refreshGraphOrDisplayError(msg.status, 'Unable to Push Tag');
      break;
    case 'renameBranch':
      refreshGraphOrDisplayError(msg.status, 'Unable to Rename Branch');
      break;
    case 'refresh':
      gitGraph.refresh(false);
      break;
    case 'resetToCommit':
      refreshGraphOrDisplayError(msg.status, 'Unable to Reset to Commit');
      break;
    case 'revertCommit':
      refreshGraphOrDisplayError(msg.status, 'Unable to Revert Commit');
      break;
    case 'viewDiff':
      if (msg.success === false) {
        Dialog.showErrorDialog('Unable to view diff of file', null, null);
      }
      break;
  }
});

function refreshGraphOrDisplayError(status, errorMessage) {
  if (status === null) {
    gitGraph.refresh(true);
  } else {
    Dialog.showErrorDialog(errorMessage, status, null);
  }
}

function generateGitFileTree(gitFiles) {
  const files = { type: 'folder', name: '', folderPath: '', contents: {}, open: true };
  gitFiles.forEach((gitFile, i) => {
    let cur = files;
    const newFilePaths = gitFile.newFilePath.split('/');
    newFilePaths.forEach((newFilePath, j) => {
      if (j < newFilePaths.length - 1) {
        if (typeof cur.contents[newFilePath] === 'undefined') {
          cur.contents[newFilePath] = {
            type: 'folder',
            name: newFilePath,
            folderPath: newFilePaths.slice(0, j + 1).join('/'),
            contents: {},
            open: true,
          };
        }
        cur = cur.contents[newFilePath];
      } else {
        cur.contents[newFilePath] = { type: 'file', name: newFilePath, index: i };
      }
    });
  });
  return files;
}
