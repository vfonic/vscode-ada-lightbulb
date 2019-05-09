class CommitView {
  constructor(commitDetails, fileTree, expandedCommit) {
    this.commitDetails = commitDetails;
    this.fileTree = fileTree;
    this.expandedCommit = expandedCommit;
  }

  render() {
    if (this.expandedCommit === null || this.expandedCommit.hash !== this.commitDetails.hash) {
      return;
    }
  }
}

exports.default = CommitView;
