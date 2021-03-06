class CommitView {
  constructor(expandedCommit, repoDetails, currentRepo) {
    this.currentRepo = currentRepo;
    this.repoDetails = repoDetails;
    this.commitDetailsEl = document.getElementById('commitDetails');
    this.expandedCommit = expandedCommit;
  }

  applyHeightChanges(commitDetailsHeight) {
    this.commitDetailsEl.style.height = commitDetailsHeight + 'px';
    document.getElementsByTagName('body')[0].style.paddingBottom = `${commitDetailsHeight + 6}px`;
    document.getElementById('scrollShadow-bottom').style.bottom = `${commitDetailsHeight + 2}px`;
  }

  initElementResizerForCommitDetails() {
    const resizeClassName = 'resizeRow';
    let commitDetailsHeight = this.repoDetails.commitDetailsHeight;

    if (commitDetailsHeight == null) {
      commitDetailsHeight = 250;
      this.repoDetails.commitDetailsHeight = commitDetailsHeight;
    }

    this.commitDetailsEl.innerHTML = `
      <span class="${resizeClassName} before"></span>
      <span class="${resizeClassName} after"></span>
    `;

    this.applyHeightChanges(commitDetailsHeight);

    let mouseY;
    const onResizeStart = mouseEvent => (mouseY = mouseEvent.clientY);

    const onResize = mouseEvent => {
      let mouseDeltaY = mouseEvent.clientY - mouseY;
      if (commitDetailsHeight + mouseDeltaY < 40) {
        mouseDeltaY = -commitDetailsHeight + 40;
      }
      if (this.commitDetailsEl.clientHeight - mouseDeltaY < ElementResizer.MIN_WIDTH_HEIGHT) {
        mouseDeltaY = this.commitDetailsEl.clientHeight - ElementResizer.MIN_WIDTH_HEIGHT;
      }
      commitDetailsHeight = Math.min(commitDetailsHeight - mouseDeltaY, window.innerHeight - 200);
      mouseY = mouseEvent.clientY;

      this.applyHeightChanges(commitDetailsHeight);
    };

    const onResizeEnd = () => {
      this.repoDetails.commitDetailsHeight = commitDetailsHeight;
      sendMessage({
        command: 'saveRepoState',
        repo: this.currentRepo,
        state: this.repoDetails,
      });
    };

    new ElementResizer(this.commitDetailsEl, resizeClassName, onResizeStart, onResize, onResizeEnd);
  }

  render() {
    emptyElement(this.commitDetailsEl);

    if (this.expandedCommit == null) {
      return null;
    }

    const previouslySelectedCommitEl = document.querySelector('.commit.commitDetailsOpen');
    if (previouslySelectedCommitEl) {
      previouslySelectedCommitEl.classList.remove('commitDetailsOpen');
    }
    document.querySelector('[data-hash="' + this.expandedCommit.hash + '"]').classList.add('commitDetailsOpen');

    const { commitDetails } = this.expandedCommit;

    this.initElementResizerForCommitDetails();

    const divEl = document.createElement('div');

    let html = '';
    html += '<div id="commitDetailsSummary">';
    html += '<span class="commitDetailsSummaryTop">';
    html += '<span class="commitDetailsSummaryTopRow"><span class="commitDetailsSummaryKeyValues">';
    html += '<b>Commit: </b>' + escapeHtml(commitDetails.hash) + '<br>';
    html += '<b>Parents: </b>' + commitDetails.parents.join(', ') + '<br>';
    html +=
      '<b>Author: </b>' + escapeHtml(commitDetails.author) + ' &lt;' + escapeHtml(commitDetails.email) + '&gt;<br>';
    html += '<b>Date: </b>' + new Date(commitDetails.date * 1e3).toString() + '<br>';
    html += '<b>Committer: </b>' + escapeHtml(commitDetails.committer) + '</span>';
    html += '</span></span><br><br>';
    html += escapeHtml(commitDetails.body).replace(/\n/g, '<br>') + '</div>';
    html += '<div id="commitDetailsFiles">' + new CommitFileListView(commitDetails.fileChanges).render() + '</div>';
    divEl.innerHTML = html;
    this.commitDetailsEl.appendChild(divEl);
  }
}
