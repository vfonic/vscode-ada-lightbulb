// @ts-nocheck
import CommitFileListView from './CommitFileListView';
import { escapeHtml } from './html_utils';

class CommitView {
  constructor(expandedCommit) {
    this.expandedCommit = expandedCommit;
  }

  render() {
    if (this.expandedCommit == null) {
      return null;
    }

    // const previouslySelectedCommitEl = document.querySelector('.commit.commitDetailsOpen');
    // if (previouslySelectedCommitEl) previouslySelectedCommitEl.classList.remove('commitDetailsOpen');
    // document.querySelector('[data-hash="' + this.expandedCommit.hash + '"]').classList.add('commitDetailsOpen');

    const { commitDetails } = this.expandedCommit;

    // const divEl = document.createElement('div');
    // divEl.innerHTML =
    return `
      <div id="commitDetailsSummary">
      <span class="commitDetailsSummaryTop">
      <span class="commitDetailsSummaryTopRow"><span class="commitDetailsSummaryKeyValues">
      <b>Commit: </b>${escapeHtml(commitDetails.hash)}<br>
      <b>Parents: </b>${commitDetails.parents.join(', ')}<br>
      <b>Author: </b>${escapeHtml(commitDetails.author)} &lt;${escapeHtml(commitDetails.email)}&gt;<br>
      <b>Date: </b>${new Date(commitDetails.date * 1e3).toString()}<br>
      <b>Committer: </b>${escapeHtml(commitDetails.committer)}</span>
      </span></span><br><br>
      ${escapeHtml(commitDetails.body).replace(/\n/g, '<br>')}</div>
      <div id="commitDetailsFiles">${new CommitFileListView(commitDetails.fileChanges).render()}</div>
    `;

    // const panel = vscode.window.createWebviewPanel('myBottomPanel', 'My Bottom Panel', vscode.ViewColumn.Three, {});
    // panel.webview.html = `
    //   <!DOCTYPE html>
    //   <html lang="en">
    //   <head>
    //       <meta charset="UTF-8">
    //       <title>Commitsa</title>
    //   </head>
    //   <body>
    //       ${divEl.innerHTML}
    //   </body>
    //   </html>
    // `;
  }
}

export default CommitView;
