const CommitDetails = require('./CommitDetails').default;
const UncommittedDetails = require('./UncommittedDetails').default;

class CommitDetailsFactory {
  static initialize(repo, commitHash) {
    if (commitHash === '*') {
      return new UncommittedDetails(repo, commitHash);
    }

    return new CommitDetails(repo, commitHash);
  }
}

exports.default = CommitDetailsFactory;
