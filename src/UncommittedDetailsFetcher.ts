// @ts-nocheck
import CommitDetails from './CommitDetails';
import CommitFileChange from './CommitFileChange';
import DataSource from './DataSource';

class UncommittedDetailsFetcher {
  constructor(repo, commitHash) {
    this.repo = repo;
    this.commitHash = commitHash;
    this.dataSource = DataSource;
  }

  call() {
    return new Promise((resolve, reject) =>
      this.dataSource.execGit('status -s', this.repo, (err, stdout) => {
        if (err) {
          console.error(err);
          reject(new Error(err));
        } else {
          const fileChangeLines = stdout.split(this.dataSource.eolRegex).filter(Boolean);
          const fileChanges = [];
          const stagedFileChanges = [];
          const unstagedFileChanges = [];

          fileChangeLines.forEach(line => {
            const x = line[0]; // staged column
            const y = line[1]; // unstaged column
            const [filePath, newFilePath] = line.slice(3).split(' -> ');
            const baseData = { filePath, newFilePath: newFilePath || filePath };

            // Staged: X is not ' ' and not '?'
            if (x !== ' ' && x !== '?') {
              const staged = new CommitFileChange({ ...baseData, statusCode: x });
              stagedFileChanges.push(staged);
              fileChanges.push(staged);
            }

            // Unstaged: Y is not ' '
            if (y !== ' ') {
              const statusCode = y === '?' ? 'A' : y;
              const unstaged = new CommitFileChange({ ...baseData, statusCode });
              unstagedFileChanges.push(unstaged);
              if (x === ' ' || x === '?') {
                fileChanges.push(unstaged);
              }
            }
          });

          resolve(
            new CommitDetails({
              hash: '*',
              parents: [],
              author: '*',
              email: '',
              date: Math.round(new Date().getTime() / 1000),
              committer: '*',
              body: 'Uncommitted Changes',
              fileChanges,
              stagedFileChanges,
              unstagedFileChanges,
            })
          );
        }
      })
    );
  }
}

export default UncommittedDetailsFetcher;
