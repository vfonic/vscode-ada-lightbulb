const cp = require('child_process');
const Config = require('./config').default;

const configuration = new Config();
const utils_1 = require('./utils');
const CommitDetailsFactory = require('./CommitDetailsFactory').default;

const eolRegex = /\r\n|\r|\n/g;
const headRegex = /^\(HEAD detached at [0-9A-Za-z]+\)/g;
const gitLogSeparator = 'XX7Nal-YARtTpjCikii9nJxER19D6diSyk-AWkPb';

class DataSource {
  static execGit(command, repo, callback) {
    cp.exec(`"${configuration.gitPath}" ${command}`, { cwd: repo }, callback);
  }

  get gitLogFormat() {
    return ['%H', '%P', '%an', '%ae', '%at', '%s'].join(gitLogSeparator);
  }

  get gitCommitDetailsFormat() {
    return ['%H', '%P', '%an', '%ae', '%at', '%cn'].join(gitLogSeparator) + '%n%B';
  }

  getBranches(repo, showRemoteBranches) {
    return new Promise(resolve => {
      DataSource.execGit('branch' + (showRemoteBranches ? ' -a' : ''), repo, (err, stdout) => {
        let branchData = {
          branches: [],
          head: null,
          error: false,
        };
        if (err) {
          branchData.error = true;
        } else {
          let lines = stdout.split(eolRegex);
          for (let i = 0; i < lines.length - 1; i++) {
            let name = lines[i].substring(2).split(' -> ')[0];
            if (name.match(headRegex) != null) {
              continue;
            }
            if (lines[i][0] === '*') {
              branchData.head = name;
              branchData.branches.unshift(name);
            } else {
              branchData.branches.push(name);
            }
          }
        }
        resolve(branchData);
      });
    });
  }

  getCommits(repo, branch, maxCommits, showRemoteBranches) {
    return new Promise(resolve => {
      Promise.all([
        this.getGitLog(repo, branch, maxCommits + 1, showRemoteBranches),
        this.getRefs(repo, showRemoteBranches),
      ]).then(async results => {
        let commits = results[0],
          refData = results[1],
          i,
          unsavedChanges = null;
        let moreCommitsAvailable = commits.length === maxCommits + 1;
        if (moreCommitsAvailable) {
          commits.pop();
        }
        if (refData.head != null) {
          for (i = 0; i < commits.length; i++) {
            if (refData.head === commits[i].hash) {
              unsavedChanges = await this.getGitUnsavedChanges(repo);
              if (unsavedChanges != null) {
                commits.unshift({
                  hash: '*',
                  parentHashes: [refData.head],
                  author: '*',
                  email: '',
                  date: Math.round(new Date().getTime() / 1000),
                  message: 'Uncommitted Changes',
                  fileChanges: unsavedChanges,
                });
              }
              break;
            }
          }
        }
        let commitNodes = [];
        let commitLookup = {};
        for (i = 0; i < commits.length; i++) {
          commitLookup[commits[i].hash] = i;
          commitNodes.push({
            hash: commits[i].hash,
            parentHashes: commits[i].parentHashes,
            author: commits[i].author,
            email: commits[i].email,
            date: commits[i].date,
            message: commits[i].message,
            refs: [],
          });
        }
        for (i = 0; i < refData.refs.length; i++) {
          if (typeof commitLookup[refData.refs[i].hash] === 'number') {
            commitNodes[commitLookup[refData.refs[i].hash]].refs.push(refData.refs[i]);
          }
        }
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
        resolve(!err ? stdout.split(eolRegex)[0] : null);
      });
    });
  }

  isGitRepository(path) {
    return new Promise(resolve => {
      DataSource.execGit('rev-parse --git-dir', path, err => {
        resolve(!err);
      });
    });
  }

  addTag(repo, tagName, commitHash, lightweight, message) {
    let args = ['tag'];
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

  getRefs(repo, showRemoteBranches) {
    return new Promise(resolve => {
      DataSource.execGit(
        'show-ref ' + (showRemoteBranches ? '' : '--heads --tags') + ' -d --head',
        repo,
        (err, stdout) => {
          let refData = { head: null, refs: [] };
          if (!err) {
            let lines = stdout.split(eolRegex);
            for (let i = 0; i < lines.length - 1; i++) {
              let line = lines[i].split(' ');
              if (line.length < 2) {
                continue;
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
            }
          }
          resolve(refData);
        }
      );
    });
  }

  getGitLog(repo, branch, num, showRemoteBranches) {
    let args = ['log', '--max-count=' + num, '--format=' + this.gitLogFormat, '--date-order'];
    if (branch !== '') {
      args.push(escapeRefName(branch));
    } else {
      args.push('--branches', '--tags');
      if (showRemoteBranches) {
        args.push('--remotes');
      }
    }
    return this.spawnGit(
      args,
      repo,
      stdout => {
        let lines = stdout.split(eolRegex);
        let gitCommits = [];
        for (let i = 0; i < lines.length - 1; i++) {
          let line = lines[i].split(gitLogSeparator);
          if (line.length !== 6) {
            break;
          }
          gitCommits.push({
            hash: line[0],
            parentHashes: line[1].split(' '),
            author: line[2],
            email: line[3],
            date: parseInt(line[4]),
            message: line[5],
          });
        }
        return gitCommits;
      },
      []
    );
  }

  getGitUnsavedChanges(repo) {
    return new Promise(resolve => {
      DataSource.execGit('status -s --branch --untracked-files --porcelain', repo, (err, stdout) => {
        if (!err) {
          let lines = stdout.split(eolRegex);
          resolve(
            lines.length > 2
              ? {
                  branch: lines[0].substring(3).split('...')[0],
                  changes: lines.length - 2,
                }
              : null
          );
        } else {
          resolve(null);
        }
      });
    });
  }

  runGitCommand(command, repo) {
    return new Promise(resolve => {
      DataSource.execGit(command, repo, (err, stdout, stderr) => {
        if (!err) {
          resolve(null);
        } else {
          let lines;
          if (stdout !== '' || stderr !== '') {
            lines = (stdout !== '' ? stdout : stderr !== '' ? stderr : '').split(eolRegex);
          } else {
            lines = err.message.split(eolRegex);
            lines.shift();
          }
          resolve(lines.slice(0, lines.length - 1).join('\n'));
        }
      });
    });
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
        resolve(e.message.split(eolRegex).join('\n'));
        err = true;
      });
      cmd.on('exit', code => {
        if (err) {
          return;
        }
        if (code === 0) {
          resolve(null);
        } else {
          let lines = (stdout !== '' ? stdout : stderr !== '' ? stderr : '').split(eolRegex);
          resolve(lines.slice(0, lines.length - 1).join('\n'));
        }
      });
    });
  }

  spawnGit(args, repo, successValue, errorValue) {
    return new Promise(resolve => {
      let stdout = '',
        err = false;
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

exports.DataSource = DataSource;

function escapeRefName(str) {
  return str.replace(/'/g, "'");
}
