const cp = require('child_process');
const Config = require('./Config').default;

const configuration = new Config();

const headRegex = /^\(HEAD detached at [0-9A-Za-z]+\)/g;
const gitLogSeparator = 'XX7Nal-YARtTpjCikii9nJxER19D6diSyk-AWkPb';

class DataSource {
  static execGit(command, repo, callback) {
    const fullCommand = `"${configuration.gitPath}" ${command}`;
    console.log('Executing git command: ', fullCommand);
    cp.exec(fullCommand, { cwd: repo }, callback);
  }

  get gitLogFormat() {
    return ['%H', '%P', '%an', '%ae', '%at', '%s'].join(gitLogSeparator);
  }

  get gitCommitDetailsFormat() {
    return ['%H', '%P', '%an', '%ae', '%at', '%cn'].join(gitLogSeparator) + '%n%B';
  }

  getBranches(repo) {
    return new Promise(resolve => {
      DataSource.execGit('branch -a', repo, (err, stdout) => {
        const branchData = { branches: [], head: null, error: false };
        if (err) {
          branchData.error = true;
        } else {
          const lines = stdout.split(DataSource.eolRegex).filter(Boolean);
          lines.forEach(line => {
            const name = line.substring(2).split(' -> ')[0];
            if (name.match(headRegex) != null) {
              return;
            }
            if (line[0] === '*') {
              branchData.head = name;
              branchData.branches.unshift(name);
            } else {
              branchData.branches.push(name);
            }
          });
        }
        resolve(branchData);
      });
    });
  }

  getCommits(repo, branch, maxCommits) {
    return new Promise(resolve => {
      Promise.all([this.getGitLog(repo, branch, maxCommits + 1), this.getRefs(repo)]).then(async results => {
        const commits = results[0];
        const refData = results[1];
        const moreCommitsAvailable = commits.length === maxCommits + 1;
        if (moreCommitsAvailable) {
          commits.pop();
        }
        if (refData.head != null) {
          const hasUncommittedChanges = await this.hasUncommittedChanges(repo);
          if (hasUncommittedChanges) {
            commits.unshift({
              hash: '*',
              parentHashes: [refData.head],
              author: '*',
              email: '',
              date: Math.round(new Date().getTime() / 1000),
              message: 'Uncommitted Changes',
            });
          }
        }
        const commitNodes = [];
        const commitLookup = {};
        commits.forEach((commit, i) => {
          commitLookup[commit.hash] = i;
          commitNodes.push({
            hash: commit.hash,
            parentHashes: commit.parentHashes,
            author: commit.author,
            email: commit.email,
            date: commit.date,
            message: commit.message,
            refs: [],
          });
        });
        refData.refs.forEach(ref => commitLookup[ref.hash] && commitNodes[commitLookup[ref.hash]].refs.push(ref));
        resolve({
          commits: commitNodes,
          head: refData.head,
          moreCommitsAvailable: moreCommitsAvailable,
        });
      });
    });
  }

  getCommitFile(repo, commitHash, filePath) {
    return this.spawnGit(['show', commitHash + ':' + filePath], repo, stdout => stdout, '');
  }

  getRemoteUrl(repo) {
    return new Promise(resolve => {
      DataSource.execGit('config --get remote.origin.url', repo, (err, stdout) => {
        resolve(!err ? stdout.split(DataSource.eolRegex)[0] : null);
      });
    });
  }

  isGitRepository(path) {
    return new Promise(resolve => DataSource.execGit('rev-parse --git-dir', path, err => resolve(!err)));
  }

  addTag(repo, tagName, commitHash, lightweight, message) {
    const args = ['tag'];
    if (lightweight) {
      args.push(tagName);
    } else {
      args.push('-a', tagName, '-m', message);
    }
    args.push(commitHash);
    return this.runGitCommandSpawn(args, repo);
  }

  deleteTag(repo, tagName) {
    return this.runGitCommand('tag -d ' + escapeRefName(tagName), repo);
  }

  pushTag(repo, tagName) {
    return this.runGitCommand('push origin ' + escapeRefName(tagName), repo);
  }

  createBranch(repo, branchName, commitHash) {
    return this.runGitCommand('branch ' + escapeRefName(branchName) + ' ' + commitHash, repo);
  }

  checkoutBranch(repo, branchName, remoteBranch) {
    return this.runGitCommand(
      'checkout ' +
        (remoteBranch == null
          ? escapeRefName(branchName)
          : ' -b ' + escapeRefName(branchName) + ' ' + escapeRefName(remoteBranch)),
      repo
    );
  }

  checkoutCommit(repo, commitHash) {
    return this.runGitCommand('checkout ' + commitHash, repo);
  }

  deleteBranch(repo, branchName, forceDelete) {
    return this.runGitCommand(
      'branch --delete' + (forceDelete ? ' --force' : '') + ' ' + escapeRefName(branchName),
      repo
    );
  }

  renameBranch(repo, oldName, newName) {
    return this.runGitCommand('branch -m ' + escapeRefName(oldName) + ' ' + escapeRefName(newName), repo);
  }

  mergeBranch(repo, branchName, createNewCommit) {
    return this.runGitCommand('merge ' + escapeRefName(branchName) + (createNewCommit ? ' --no-ff' : ''), repo);
  }

  mergeCommit(repo, commitHash, createNewCommit) {
    return this.runGitCommand('merge ' + commitHash + (createNewCommit ? ' --no-ff' : ''), repo);
  }

  cherrypickCommit(repo, commitHash, parentIndex) {
    return this.runGitCommand('cherry-pick ' + commitHash + (parentIndex > 0 ? ' -m ' + parentIndex : ''), repo);
  }

  revertCommit(repo, commitHash, parentIndex) {
    return this.runGitCommand('revert --no-edit ' + commitHash + (parentIndex > 0 ? ' -m ' + parentIndex : ''), repo);
  }

  resetToCommit(repo, commitHash, resetMode) {
    return this.runGitCommand('reset --' + resetMode + ' ' + commitHash, repo);
  }

  getRefs(repo) {
    return new Promise(resolve => {
      DataSource.execGit('show-ref -d --head', repo, (err, stdout) => {
        let refData = { head: null, refs: [] };
        if (!err) {
          let lines = stdout.split(DataSource.eolRegex).map(line => line.split(' '));
          lines.forEach(line => {
            if (line.length < 2) {
              return;
            }
            let hash = line.shift();
            let ref = line.join(' ');
            if (ref.startsWith('refs/heads/')) {
              refData.refs.push({
                hash: hash,
                name: ref.substring(11),
                type: 'head',
              });
            } else if (ref.startsWith('refs/tags/')) {
              refData.refs.push({
                hash: hash,
                name: ref.endsWith('^{}') ? ref.substring(10, ref.length - 3) : ref.substring(10),
                type: 'tag',
              });
            } else if (ref.startsWith('refs/remotes/')) {
              refData.refs.push({
                hash: hash,
                name: ref.substring(13),
                type: 'remote',
              });
            } else if (ref === 'HEAD') {
              refData.head = hash;
            }
          });
        }
        resolve(refData);
      });
    });
  }

  getGitLog(repo, branch, num) {
    const args = ['log', '--max-count=' + num, '--format=' + this.gitLogFormat, '--date-order'];
    if (branch !== '') {
      args.push(escapeRefName(branch));
    } else {
      args.push('--branches', '--tags');
      args.push('--remotes');
    }
    return this.spawnGit(
      args,
      repo,
      stdout => {
        const lines = stdout.split(DataSource.eolRegex).map(line => line.split(gitLogSeparator));
        const gitCommits = [];
        lines.forEach(line => {
          if (line.length !== 6) {
            return;
          }
          gitCommits.push({
            hash: line[0],
            parentHashes: line[1].split(' '),
            author: line[2],
            email: line[3],
            date: parseInt(line[4]),
            message: line[5],
          });
        });
        return gitCommits;
      },
      []
    );
  }

  hasUncommittedChanges(repo) {
    return new Promise((resolve, reject) =>
      DataSource.execGit('status -s --branch --untracked-files --porcelain', repo, (err, stdout) => {
        if (err) {
          console.error(err);
          reject(new Error(err));
        }
        const lines = stdout.split(DataSource.eolRegex);
        resolve(lines.length > 2);
      })
    );
  }

  runGitCommand(command, repo) {
    return new Promise(resolve =>
      DataSource.execGit(command, repo, (err, stdout, stderr) => {
        if (!err) {
          resolve(null);
        } else {
          let lines;
          if (stdout !== '' || stderr !== '') {
            lines = (stdout !== '' ? stdout : stderr !== '' ? stderr : '').split(DataSource.eolRegex);
          } else {
            lines = err.message.split(DataSource.eolRegex);
            lines.shift();
          }
          resolve(lines.slice(0, lines.length - 1).join('\n'));
        }
      })
    );
  }

  runGitCommandSpawn(args, repo) {
    return new Promise(resolve => {
      let stdout = '',
        stderr = '',
        err = false;
      const cmd = cp.spawn(configuration.gitPath, args, { cwd: repo });
      cmd.stdout.on('data', d => {
        stdout += d;
      });
      cmd.stderr.on('data', d => {
        stderr += d;
      });
      cmd.on('error', e => {
        resolve(e.message.split(DataSource.eolRegex).join('\n'));
        err = true;
      });
      cmd.on('exit', code => {
        if (err) {
          return;
        }
        if (code === 0) {
          resolve(null);
        } else {
          const lines = (stdout !== '' ? stdout : stderr !== '' ? stderr : '').split(DataSource.eolRegex);
          resolve(lines.slice(0, lines.length - 1).join('\n'));
        }
      });
    });
  }

  spawnGit(args, repo, successValue, errorValue) {
    return new Promise(resolve => {
      let stdout = '';
      let err = false;
      const cmd = cp.spawn(configuration.gitPath, args, { cwd: repo });
      cmd.stdout.on('data', d => {
        stdout += d;
      });
      cmd.on('error', () => {
        resolve(errorValue);
        err = true;
      });
      cmd.on('exit', code => {
        if (err) {
          return;
        }
        resolve(code === 0 ? successValue(stdout) : errorValue);
      });
    });
  }
}

DataSource.eolRegex = /\r\n|\r|\n/g;
exports.DataSource = DataSource;

function escapeRefName(str) {
  return str.replace(/'/g, "'");
}
