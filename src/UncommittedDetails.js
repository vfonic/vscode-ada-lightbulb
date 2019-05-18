const dataSource_1 = require('./dataSource');
const CommitDetailsProcessor = require('./CommitDetailsProcessor').default;

const eolRegex = /\r\n|\r|\n/g;

class UncommittedDetails {
  constructor(repo, commitHash) {
    this.repo = repo;
    this.commitHash = commitHash;
    this.dataSource = dataSource_1.DataSource;
  }

  call() {
    return new Promise(resolve => {
      Promise.all([
        new Promise((resolve, reject) =>
          this.dataSource.execGit('rev-parse HEAD', this.repo, (err, stdout) => {
            if (err) {
              console.error(err);
              reject();
            } else {
              const head = stdout.replace(/\s+/g, '');
              resolve({
                hash: '*',
                parents: [head],
                author: '*',
                email: '',
                date: Math.round(new Date().getTime() / 1000),
                committer: '*',
                body: 'Uncommitted Changes',
                fileChanges: [],
              });
            }
          })
        ),
        new Promise((resolve, reject) =>
          this.dataSource.execGit(
            'diff --name-status -r -m --root --find-renames --diff-filter=AMDR HEAD',
            this.repo,
            (err, stdout) => {
              if (err) {
                console.error(err);
                reject();
              } else {
                resolve(stdout.split(eolRegex));
              }
            }
          )
        ),
        new Promise((resolve, reject) =>
          this.dataSource.execGit(
            'diff --numstat -r -m --root --find-renames --diff-filter=AMDR HEAD',
            this.repo,
            (err, stdout) => {
              if (err) {
                console.error(err);
                reject();
              } else {
                resolve(stdout.split(eolRegex));
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

exports.default = UncommittedDetails;
