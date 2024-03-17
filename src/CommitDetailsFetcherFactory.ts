// @ts-nocheck
import CommitDetailsFetcher from './CommitDetailsFetcher';
import UncommittedDetailsFetcher from './UncommittedDetailsFetcher';

class CommitDetailsFetcherFactory {
  static initialize(repo, commitHash) {
    if (commitHash === '*') {
      return new UncommittedDetailsFetcher(repo, commitHash);
    }

    return new CommitDetailsFetcher(repo, commitHash);
  }
}

export default CommitDetailsFetcherFactory;
