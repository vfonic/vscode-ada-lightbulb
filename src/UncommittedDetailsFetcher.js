const dataSource_1 = require('./DataSource');
const CommitDetails = require('./CommitDetails').default;
const CommitFileChange = require('./CommitFileChange').default;

class UncommittedDetailsFetcher {
  constructor(repo, commitHash) {
    this.repo = repo;
    this.commitHash = commitHash;
    this.dataSource = dataSource_1.DataSource;
  }

  call() {
    return new Promise((resolve, reject) =>
      this.dataSource.execGit('status -s', this.repo, (err, stdout) => {
        if (err) {
          console.error(err);
          reject(new Error(err));
        } else {
          const head = stdout.replace(/\s+/g, '');
          const fileChangeLines = stdout.split(this.dataSource.eolRegex).filter(Boolean);
          const fileChanges = fileChangeLines.map(fileChangeLine => {
            const [filePath, newFilePath] = fileChangeLine.slice(3).split(' -> ');
            return new CommitFileChange({
              filePath,
              newFilePath: newFilePath || filePath,
              statusCode: fileChangeLine[0] || 'M',
            });
          });
          resolve(
            new CommitDetails({
              hash: '*',
              parents: [head],
              author: '*',
              email: '',
              date: Math.round(new Date().getTime() / 1000),
              committer: '*',
              body: 'Uncommitted Changes',
              fileChanges,
            })
          );
        }
      })
    );
  }
}

exports.default = UncommittedDetailsFetcher;
