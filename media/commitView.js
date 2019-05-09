class CommitView {
  constructor(commitDetails, fileTree, expandedCommit, avatars) {
    this.expandedCommit = expandedCommit;
    this.expandedCommit.commitDetails = commitDetails;
    this.expandedCommit.fileTree = fileTree;
    this.avatars = avatars;
  }

  render() {
    if (this.expandedCommit === null || this.expandedCommit.hash !== this.expandedCommit.commitDetails.hash) {
      return null;
    }

    const { commitDetails, fileTree } = this.expandedCommit;

    let html = '<div><div id="commitDetailsSummary">';
    html +=
      '<span class="commitDetailsSummaryTop' +
      (typeof this.avatars[commitDetails.email] === 'string' ? ' withAvatar' : '') +
      '">';
    html += '<span class="commitDetailsSummaryTopRow"><span class="commitDetailsSummaryKeyValues">';
    html += '<b>Commit: </b>' + escapeHtml(commitDetails.hash) + '<br>';
    html += '<b>Parents: </b>' + commitDetails.parents.join(', ') + '<br>';
    html +=
      '<b>Author: </b>' + escapeHtml(commitDetails.author) + ' &lt;' + escapeHtml(commitDetails.email) + '&gt;<br>';
    html += '<b>Date: </b>' + new Date(commitDetails.date * 1e3).toString() + '<br>';
    html += '<b>Committer: </b>' + escapeHtml(commitDetails.committer) + '</span>';
    if (typeof this.avatars[commitDetails.email] === 'string') {
      html += '<span class="commitDetailsSummaryAvatar"><img src="' + this.avatars[commitDetails.email] + '"></span>';
    }
    html += '</span></span><br><br>';
    html += escapeHtml(commitDetails.body).replace(/\n/g, '<br>') + '</div>';
    html +=
      '<div id="commitDetailsFiles">' + new GitFileTreeView(fileTree, commitDetails.fileChanges).render() + '</div>';
    html += '<div id="commitDetailsClose">' + svgIcons.close + '</div>';
    html += '</div>';
    return html;
  }
}
