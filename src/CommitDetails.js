const dataSource_1 = require('./dataSource');
const CommitDetailsProcessor = require('./CommitDetailsProcessor').default;

const eolRegex = /\r\n|\r|\n/g;
const gitLogSeparator = 'XX7Nal-YARtTpjCikii9nJxER19D6diSyk-AWkPb';
const gitCommitDetailsFormat = ['%H', '%P', '%an', '%ae', '%at', '%cn'].join(gitLogSeparator) + '%n%B';

class CommitDetails {
  constructor(repo, commitHash) {
    this.repo = repo;
    this.commitHash = commitHash;
    this.dataSource = dataSource_1.DataSource;
  }

  call() {
    return new Promise(resolve => {
      Promise.all([
        new Promise((resolve, reject) =>
          this.dataSource.execGit(
            'show --quiet ' + this.commitHash + ' --format="' + gitCommitDetailsFormat + '"',
            this.repo,
            (err, stdout) => {
              if (err) {
                console.error(err);
                reject();
              } else {
                let lines = stdout.split(eolRegex);
                let lastLine = lines.length - 1;
                while (lines.length > 0 && lines[lastLine] === '') {
                  lastLine--;
                }
                let commitInfo = lines[0].split(gitLogSeparator);
                resolve({
                  hash: commitInfo[0],
                  parents: commitInfo[1].split(' '),
                  author: commitInfo[2],
                  email: commitInfo[3],
                  date: parseInt(commitInfo[4]),
                  committer: commitInfo[5],
                  body: lines.slice(1, lastLine + 1).join('\n'),
                  fileChanges: [],
                });
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
                reject();
              } else {
                resolve(stdout.split(eolRegex).slice(1));
              }
            }
          )
        ),
        new Promise((resolve, reject) =>
          this.dataSource.execGit(
            'diff-tree --numstat -r -m --root --find-renames --diff-filter=AMDR ' + this.commitHash,
            this.repo,
            (err, stdout) => {
              if (err) {
                console.error(err);
                reject();
              } else {
                resolve(stdout.split(eolRegex).slice(1));
              }
            }
          )
        ),
      ])
        .then(new CommitDetailsProcessor(resolve).call)
        .catch(err => {
          console.error(err);
          resolve(null);
        });
    });
  }
}

exports.default = CommitDetails;
