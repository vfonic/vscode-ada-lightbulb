'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : new P(function(resolve) {
              resolve(result.value);
            }).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, '__esModule', { value: true });
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const url = require('url');
class AvatarManager {
  constructor(dataSource, extensionState) {
    this.view = null;
    this.remoteSourceCache = {};
    this.interval = null;
    this.githubTimeout = 0;
    this.gitLabTimeout = 0;
    this.dataSource = dataSource;
    this.extensionState = extensionState;
    this.avatarStorageFolder = this.extensionState.getAvatarStoragePath();
    this.avatars = this.extensionState.getAvatarCache();
    this.queue = new AvatarRequestQueue(() => {
      if (this.interval !== null) return;
      this.interval = setInterval(() => {
        this.fetchAvatarsInterval();
      }, 10000);
      this.fetchAvatarsInterval();
    });
  }
  fetchAvatarImage(email, repo, commits) {
    if (typeof this.avatars[email] !== 'undefined') {
      let t = new Date().getTime();
      if (
        this.avatars[email].timestamp < t - 1209600000 ||
        (this.avatars[email].identicon && this.avatars[email].timestamp < t - 345600000)
      ) {
        this.queue.add(email, repo, commits, false);
      }
      if (this.avatars[email].image !== null) {
        this.sendAvatarToWebView(email, () => {
          this.removeAvatarFromCache(email);
          this.queue.add(email, repo, commits, true);
        });
      }
    } else {
      this.queue.add(email, repo, commits, true);
    }
  }
  registerView(view) {
    this.view = view;
  }
  deregisterView() {
    this.view = null;
  }
  removeAvatarFromCache(email) {
    delete this.avatars[email];
    this.extensionState.removeAvatarFromCache(email);
  }
  clearCache() {
    this.avatars = {};
    this.extensionState.clearAvatarCache();
  }
  fetchAvatarsInterval() {
    return __awaiter(this, void 0, void 0, function*() {
      if (this.queue.hasItems()) {
        let avatarRequest = this.queue.takeItem();
        if (avatarRequest === null) return;
        let remoteSource = yield this.getRemoteSource(avatarRequest);
        switch (remoteSource.type) {
          case 'github':
            this.fetchFromGithub(avatarRequest, remoteSource.owner, remoteSource.repo);
            break;
          case 'gitlab':
            this.fetchFromGitLab(avatarRequest);
            break;
          default:
            this.fetchFromGravatar(avatarRequest);
        }
      } else if (this.interval !== null) {
        clearInterval(this.interval);
        this.interval = null;
      }
    });
  }
  getRemoteSource(avatarRequest) {
    return __awaiter(this, void 0, void 0, function*() {
      if (typeof this.remoteSourceCache[avatarRequest.repo] === 'string') {
        return this.remoteSourceCache[avatarRequest.repo];
      } else {
        let remoteUrl = yield this.dataSource.getRemoteUrl(avatarRequest.repo),
          remoteSource;
        if (remoteUrl !== null) {
          if (remoteUrl.startsWith('https://github.com/')) {
            let remoteUrlComps = remoteUrl.split('/');
            remoteSource = {
              type: 'github',
              owner: remoteUrlComps[3],
              repo: remoteUrlComps[4].replace(/\.git$/, '')
            };
          } else if (remoteUrl.startsWith('https://gitlab.com/')) {
            remoteSource = { type: 'gitlab' };
          } else {
            remoteSource = { type: 'gravatar' };
          }
        } else {
          remoteSource = { type: 'gravatar' };
        }
        this.remoteSourceCache[avatarRequest.repo] = remoteSource;
        return remoteSource;
      }
    });
  }
  fetchFromGithub(avatarRequest, owner, repo) {
    let t = new Date().getTime();
    if (t < this.githubTimeout) {
      this.queue.addItem(avatarRequest, this.githubTimeout, false);
      this.fetchAvatarsInterval();
      return;
    }
    let commitIndex =
      avatarRequest.commits.length < 5
        ? avatarRequest.commits.length - 1 - avatarRequest.attempts
        : Math.round((4 - avatarRequest.attempts) * 0.25 * (avatarRequest.commits.length - 1));
    https
      .get(
        {
          hostname: 'api.github.com',
          path: '/repos/' + owner + '/' + repo + '/commits/' + avatarRequest.commits[commitIndex],
          headers: { 'User-Agent': 'vscode-ada-lightbulb' },
          agent: false,
          timeout: 15000
        },
        res => {
          let respBody = '';
          res.on('data', chunk => {
            respBody += chunk;
          });
          res.on('end', () =>
            __awaiter(this, void 0, void 0, function*() {
              if (res.headers['x-ratelimit-remaining'] === '0') {
                this.githubTimeout = parseInt(res.headers['x-ratelimit-reset']) * 1000;
              }
              if (res.statusCode === 200) {
                let commit = JSON.parse(respBody);
                if (commit.author && commit.author.avatar_url) {
                  let img = yield this.downloadAvatarImage(avatarRequest.email, commit.author.avatar_url + '&size=54');
                  if (img !== null) this.saveAvatar(avatarRequest.email, img, false);
                  return;
                }
              } else if (res.statusCode === 403) {
                this.queue.addItem(avatarRequest, this.githubTimeout, false);
                return;
              } else if (
                res.statusCode === 422 &&
                avatarRequest.commits.length > avatarRequest.attempts + 1 &&
                avatarRequest.attempts < 4
              ) {
                this.queue.addItem(avatarRequest, 0, true);
                return;
              } else if (res.statusCode >= 500) {
                this.githubTimeout = t + 600000;
                this.queue.addItem(avatarRequest, this.githubTimeout, false);
                return;
              }
              this.fetchFromGravatar(avatarRequest);
            })
          );
        }
      )
      .on('error', () => {
        this.githubTimeout = t + 300000;
        this.queue.addItem(avatarRequest, this.githubTimeout, false);
      });
  }
  fetchFromGitLab(avatarRequest) {
    let t = new Date().getTime();
    if (t < this.gitLabTimeout) {
      this.queue.addItem(avatarRequest, this.gitLabTimeout, false);
      this.fetchAvatarsInterval();
      return;
    }
    https
      .get(
        {
          hostname: 'gitlab.com',
          path: '/api/v4/users?search=' + avatarRequest.email,
          headers: {
            'User-Agent': 'vscode-ada-lightbulb',
            'Private-Token': 'w87U_3gAxWWaPtFgCcus'
          },
          agent: false,
          timeout: 15000
        },
        res => {
          let respBody = '';
          res.on('data', chunk => {
            respBody += chunk;
          });
          res.on('end', () =>
            __awaiter(this, void 0, void 0, function*() {
              if (res.headers['ratelimit-remaining'] === '0') {
                this.gitLabTimeout = parseInt(res.headers['ratelimit-reset']) * 1000;
              }
              if (res.statusCode === 200) {
                let users = JSON.parse(respBody);
                if (users.length > 0 && users[0].avatar_url) {
                  let img = yield this.downloadAvatarImage(avatarRequest.email, users[0].avatar_url);
                  if (img !== null) this.saveAvatar(avatarRequest.email, img, false);
                  return;
                }
              } else if (res.statusCode === 429) {
                this.queue.addItem(avatarRequest, this.gitLabTimeout, false);
                return;
              } else if (res.statusCode >= 500) {
                this.gitLabTimeout = t + 600000;
                this.queue.addItem(avatarRequest, this.gitLabTimeout, false);
                return;
              }
              this.fetchFromGravatar(avatarRequest);
            })
          );
        }
      )
      .on('error', () => {
        this.gitLabTimeout = t + 300000;
        this.queue.addItem(avatarRequest, this.gitLabTimeout, false);
      });
  }
  fetchFromGravatar(avatarRequest) {
    return __awaiter(this, void 0, void 0, function*() {
      let hash = crypto
        .createHash('md5')
        .update(avatarRequest.email)
        .digest('hex');
      let img = yield this.downloadAvatarImage(
          avatarRequest.email,
          'https://secure.gravatar.com/avatar/' + hash + '?s=54&d=404'
        ),
        identicon = false;
      if (img === null) {
        img = yield this.downloadAvatarImage(
          avatarRequest.email,
          'https://secure.gravatar.com/avatar/' + hash + '?s=54&d=identicon'
        );
        identicon = true;
      }
      if (img !== null) this.saveAvatar(avatarRequest.email, img, identicon);
    });
  }
  downloadAvatarImage(email, imageUrl) {
    return __awaiter(this, void 0, void 0, function*() {
      let hash = crypto
          .createHash('md5')
          .update(email)
          .digest('hex'),
        imgUrl = url.parse(imageUrl);
      return new Promise(resolve => {
        https
          .get(
            {
              hostname: imgUrl.hostname,
              path: imgUrl.path,
              headers: { 'User-Agent': 'vscode-ada-lightbulb' },
              agent: false,
              timeout: 15000
            },
            res => {
              let imageBufferArray = [];
              res.on('data', chunk => {
                imageBufferArray.push(chunk);
              });
              res.on('end', () => {
                if (res.statusCode === 200) {
                  let format = res.headers['content-type'].split('/')[1];
                  fs.writeFile(
                    this.avatarStorageFolder + '/' + hash + '.' + format,
                    Buffer.concat(imageBufferArray),
                    err => {
                      resolve(err ? null : hash + '.' + format);
                    }
                  );
                } else {
                  resolve(null);
                }
              });
            }
          )
          .on('error', () => {
            resolve(null);
          });
      });
    });
  }
  saveAvatar(email, image, identicon) {
    if (typeof this.avatars[email] === 'string') {
      if (!identicon || this.avatars[email].identicon) {
        this.avatars[email].image = image;
        this.avatars[email].identicon = identicon;
      }
      this.avatars[email].timestamp = new Date().getTime();
    } else {
      this.avatars[email] = {
        image: image,
        timestamp: new Date().getTime(),
        identicon: identicon
      };
    }
    this.extensionState.saveAvatar(email, this.avatars[email]);
    this.sendAvatarToWebView(email, () => {});
  }
  sendAvatarToWebView(email, onError) {
    if (this.view !== null) {
      fs.readFile(this.avatarStorageFolder + '/' + this.avatars[email].image, (err, data) => {
        if (err) {
          onError();
        } else if (this.view !== null) {
          this.view.sendMessage({
            command: 'fetchAvatar',
            email: email,
            image: 'data:image/' + this.avatars[email].image.split('.')[1] + ';base64,' + data.toString('base64')
          });
        }
      });
    }
  }
}
exports.AvatarManager = AvatarManager;
class AvatarRequestQueue {
  constructor(itemsAvailableCallback) {
    this.queue = [];
    this.itemsAvailableCallback = itemsAvailableCallback;
  }
  add(email, repo, commits, immediate) {
    let emailIndex = this.queue.findIndex(v => v.email === email && v.repo === repo);
    if (emailIndex > -1) {
      let l = commits.indexOf(this.queue[emailIndex].commits[this.queue[emailIndex].commits.length - 1]);
      if (l > -1 && l < commits.length - 1) {
        this.queue[emailIndex].commits.push(...commits.slice(l + 1));
      }
    } else {
      this.insertItem({
        email: email,
        repo: repo,
        commits: commits,
        checkAfter: immediate || this.queue.length === 0 ? 0 : this.queue[this.queue.length - 1].checkAfter + 1,
        attempts: 0
      });
    }
  }
  addItem(item, checkAfter, failedAttempt) {
    item.checkAfter = checkAfter;
    if (failedAttempt) item.attempts++;
    this.insertItem(item);
  }
  hasItems() {
    return this.queue.length > 0;
  }
  takeItem() {
    if (this.queue.length > 0 && this.queue[0].checkAfter < new Date().getTime()) return this.queue.shift();
    return null;
  }
  insertItem(item) {
    var l = 0,
      r = this.queue.length - 1,
      c,
      prevLength = this.queue.length;
    while (l <= r) {
      c = (l + r) >> 1;
      if (this.queue[c].checkAfter <= item.checkAfter) l = c + 1;
      else r = c - 1;
    }
    this.queue.splice(l, 0, item);
    if (prevLength === 0) this.itemsAvailableCallback();
  }
}
