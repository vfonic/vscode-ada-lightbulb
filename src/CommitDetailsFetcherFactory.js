const CommitDetailsFetcher = require('./CommitDetailsFetcher').default;
const UncommittedDetailsFetcher = require('./UncommittedDetailsFetcher').default;

class CommitDetailsFetcherFactory {
  static initialize(repo, commitHash) {
    if (commitHash === '*') {
      return new UncommittedDetailsFetcher(repo, commitHash);
    }

    return new CommitDetailsFetcher(repo, commitHash);
  }
}

exports.default = CommitDetailsFetcherFactory;
