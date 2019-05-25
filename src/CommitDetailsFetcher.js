const dataSource_1 = require('./DataSource');
const CommitDetails = require('./CommitDetails').default;
const CommitDetailsProcessor = require('./CommitDetailsProcessor').default;

const gitLogSeparator = 'XX7Nal-YARtTpjCikii9nJxER19D6diSyk-AWkPb';
const gitCommitDetailsFormat = ['%H', '%P', '%an', '%ae', '%at', '%cn'].join(gitLogSeparator) + '%n%B';

class CommitDetailsFetcher {
  constructor(repo, commitHash) {
    this.repo = repo;
    this.commitHash = commitHash;
    this.dataSource = dataSource_1.DataSource;
  }

  call() {
    return new Promise((resolve, reject) =>
      Promise.all([
        new Promise((resolve, reject) =>
          this.dataSource.execGit(
            'show --quiet ' + this.commitHash + ' --format="' + gitCommitDetailsFormat + '"',
            this.repo,
            (err, stdout) => {
              if (err) {
                console.error(err);
                reject(new Error(err));
              } else {
                const lines = stdout.split(this.dataSource.eolRegex).filter(Boolean);
                let commitInfo = lines[0].split(gitLogSeparator);
                resolve(
                  new CommitDetails({
                    hash: commitInfo[0],
                    parents: commitInfo[1].split(' '),
                    author: commitInfo[2],
                    email: commitInfo[3],
                    date: parseInt(commitInfo[4]),
                    committer: commitInfo[5],
                    body: lines.slice(1, lines.length - 1).join('\n'),
                    fileChanges: [],
                  })
                );
              }
            }
          )
        ),
        new Promise((resolve, reject) =>
          this.dataSource.execGit(
            'diff-tree --name-status -r -m --root --find-renames --diff-filter=AMDR ' + this.commitHash,
            this.repo,
            (err, stdout) => {
              if (err) {
                console.error(err);
                reject(new Error(err));
              } else {
                resolve(stdout.split(this.dataSource.eolRegex).slice(1));
              }
            }
          )
        ),
      ])
        .then(new CommitDetailsProcessor(resolve).call)
        .catch(err => {
          console.error(err);
          reject(new Error(err));
        })
    );
  }
}

exports.default = CommitDetailsFetcher;
