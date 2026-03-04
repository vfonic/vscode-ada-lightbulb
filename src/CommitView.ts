// @ts-nocheck
import CommitFileListView from './CommitFileListView';
import UncommittedFileListView from './UncommittedFileListView';
import { escapeHtml } from './html_utils';

class CommitView {
  constructor(expandedCommit) {
    this.expandedCommit = expandedCommit;
  }

  render() {
    if (this.expandedCommit == null) {
      return null;
    }

    const { commitDetails } = this.expandedCommit;

    if (commitDetails.hash === '*') {
      return this.renderUncommitted(commitDetails);
    }

    const summary = `
      <span class="commitDetailsSummaryTop">
      <span class="commitDetailsSummaryTopRow"><span class="commitDetailsSummaryKeyValues">
      <b>Commit: </b>${escapeHtml(commitDetails.hash)}<br>
      <b>Parents: </b>${commitDetails.parents.join(', ')}<br>
      <b>Author: </b>${escapeHtml(commitDetails.author)} &lt;${escapeHtml(commitDetails.email)}&gt;<br>
      <b>Date: </b>${new Date(commitDetails.date * 1e3).toString()}<br>
      <b>Committer: </b>${escapeHtml(commitDetails.committer)}</span>
      </span></span><br><br>
      ${escapeHtml(commitDetails.body).replace(/\n/g, '<br>')}`;

    const fileList = new CommitFileListView(commitDetails.fileChanges).render();

    return { summary, fileList };
  }

  renderUncommitted(commitDetails) {
    const summary = '<span class="commitDetailsSummaryTop"><b>Uncommitted Changes</b></span>';
    const fileList = new UncommittedFileListView(commitDetails.unstagedFileChanges, commitDetails.stagedFileChanges).render();
    return { summary, fileList };
  }
}

export default CommitView;
