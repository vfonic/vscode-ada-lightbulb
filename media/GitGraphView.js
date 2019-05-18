class GitGraphView {
  constructor(repos, lastActiveRepo, config, prevState) {
    var _this = this;
    this.gitBranches = [];
    this.gitBranchHead = null;
    this.commits = [];
    this.commitHead = null;
    this.commitLookup = {};
    this.avatars = {};
    this.currentBranch = null;
    this.moreCommitsAvailable = false;
    this.showRemoteBranches = true;
    this.expandedCommit = null;
    this.loadBranchesCallback = null;
    this.loadCommitsCallback = null;
    this.gitRepos = repos;
    this.config = config;
    this.maxCommits = config.initialLoadCommits;
    this.graph = new Graph('commitGraph', this.config);
    this.tableElem = document.getElementById('commitTable');
    this.footerElem = document.getElementById('footer');
    this.repoDropdown = new Dropdown('repoSelect', true, 'Repos', function(value) {
      _this.currentRepo = value;
      _this.maxCommits = _this.config.initialLoadCommits;
      _this.expandedCommit = null;
      _this.currentBranch = null;
      _this.saveState();
      _this.refresh(true);
    });
    this.branchDropdown = new Dropdown('branchSelect', false, 'Branches', function(value) {
      _this.currentBranch = value;
      _this.maxCommits = _this.config.initialLoadCommits;
      _this.expandedCommit = null;
      _this.saveState();
      _this.renderShowLoading();
      _this.requestLoadCommits(true, function() {});
    });
    this.showRemoteBranchesElem = document.getElementById('showRemoteBranchesCheckbox');
    this.showRemoteBranchesElem.addEventListener('change', function() {
      _this.showRemoteBranches = _this.showRemoteBranchesElem.checked;
      _this.saveState();
      _this.refresh(true);
    });
    this.scrollShadowElem = new ScrollShadow();
    document.getElementById('refreshBtn').addEventListener('click', function() {
      _this.refresh(true);
    });
    this.observeWindowSizeChanges();
    this.observeWebviewStyleChanges();
    this.observeWebviewScroll();
    this.renderShowLoading();
    if (prevState) {
      this.currentBranch = prevState.currentBranch;
      this.showRemoteBranches = prevState.showRemoteBranches;
      this.showRemoteBranchesElem.checked = this.showRemoteBranches;
      if (typeof this.gitRepos[prevState.currentRepo] !== 'undefined') {
        this.currentRepo = prevState.currentRepo;
        this.maxCommits = prevState.maxCommits;
        this.expandedCommit = prevState.expandedCommit;
        this.avatars = prevState.avatars;
        this.loadBranches(prevState.gitBranches, prevState.gitBranchHead, true, true);
        this.loadCommits(prevState.commits, prevState.commitHead, prevState.moreCommitsAvailable, true);
      }
    }
    this.loadRepos(this.gitRepos, lastActiveRepo);
    this.requestLoadBranchesAndCommits(false);
  }

  static getCommitDate(dateVal) {
    var date = new Date(dateVal * 1e3),
      value;
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dateStr = date.getDate() + ' ' + MONTHS[date.getMonth()] + ' ' + date.getFullYear();
    var timeStr = pad2(date.getHours()) + ':' + pad2(date.getMinutes());
    switch (viewState.dateFormat) {
      case 'Date Only':
        value = dateStr;
        break;

      case 'Relative':
        var diff = Math.round(new Date().getTime() / 1e3) - dateVal,
          unit = void 0;
        if (diff < 60) {
          unit = 'second';
        } else if (diff < 3600) {
          unit = 'minute';
          diff /= 60;
        } else if (diff < 86400) {
          unit = 'hour';
          diff /= 3600;
        } else if (diff < 604800) {
          unit = 'day';
          diff /= 86400;
        } else if (diff < 2629800) {
          unit = 'week';
          diff /= 604800;
        } else if (diff < 31557600) {
          unit = 'month';
          diff /= 2629800;
        } else {
          unit = 'year';
          diff /= 31557600;
        }
        diff = Math.round(diff);
        value = diff + ' ' + unit + (diff !== 1 ? 's' : '') + ' ago';
        break;

      default:
        value = dateStr + ' ' + timeStr;
    }
    return {
      title: dateStr + ' ' + timeStr,
      value: value,
    };
  }

  loadRepos(repos, lastActiveRepo) {
    this.gitRepos = repos;
    this.saveState();
    var repoPaths = Object.keys(repos),
      changedRepo = false;
    if (typeof repos[this.currentRepo] === 'undefined') {
      this.currentRepo = lastActiveRepo != null && repos[lastActiveRepo] ? lastActiveRepo : repoPaths[0];
      this.saveState();
      changedRepo = true;
    }
    var options = [],
      repoComps,
      i;
    for (i = 0; i < repoPaths.length; i++) {
      repoComps = repoPaths[i].split('/');
      options.push({
        name: repoComps[repoComps.length - 1],
        value: repoPaths[i],
      });
    }
    document.getElementById('repoControl').style.display = repoPaths.length > 1 ? 'inline' : 'none';
    this.repoDropdown.setOptions(options, this.currentRepo);
    if (changedRepo) {
      this.refresh(true);
    }
  }

  loadBranches(branchOptions, branchHead, hard, isRepo) {
    if (!isRepo) {
      this.triggerLoadBranchesCallback(false, isRepo);
      return;
    }
    if (
      !hard &&
      arraysEqual(this.gitBranches, branchOptions, function(a, b) {
        return a === b;
      }) &&
      this.gitBranchHead === branchHead
    ) {
      this.triggerLoadBranchesCallback(false, isRepo);
      return;
    }
    this.gitBranches = branchOptions;
    this.gitBranchHead = branchHead;
    if (
      this.currentBranch == null ||
      (this.currentBranch !== '' && this.gitBranches.indexOf(this.currentBranch) === -1)
    ) {
      this.currentBranch =
        this.config.showCurrentBranchByDefault && this.gitBranchHead != null ? this.gitBranchHead : '';
    }
    this.saveState();
    var options = [
      {
        name: 'Show All',
        value: '',
      },
    ];
    for (var i = 0; i < this.gitBranches.length; i++) {
      options.push({
        name: this.gitBranches[i].indexOf('remotes/') === 0 ? this.gitBranches[i].substring(8) : this.gitBranches[i],
        value: this.gitBranches[i],
      });
    }
    this.branchDropdown.setOptions(options, this.currentBranch);
    this.triggerLoadBranchesCallback(true, isRepo);
  }

  triggerLoadBranchesCallback(changes, isRepo) {
    if (this.loadBranchesCallback != null) {
      this.loadBranchesCallback(changes, isRepo);
      this.loadBranchesCallback = null;
    }
  }

  loadCommits(commits, commitHead, moreAvailable, hard) {
    if (
      !hard &&
      this.moreCommitsAvailable === moreAvailable &&
      this.commitHead === commitHead &&
      arraysEqual(this.commits, commits, function(a, b) {
        return (
          a.hash === b.hash &&
          arraysEqual(a.refs, b.refs, function(a, b) {
            return a.name === b.name && a.type === b.type;
          }) &&
          arraysEqual(a.parentHashes, b.parentHashes, function(a, b) {
            return a === b;
          })
        );
      })
    ) {
      if (this.commits.length > 0 && this.commits[0].hash === '*') {
        this.commits[0] = commits[0];
        this.saveState();
        this.renderUncommitedChanges();
      }
      this.triggerLoadCommitsCallback(false);
      return;
    }
    this.moreCommitsAvailable = moreAvailable;
    this.commits = commits;
    this.commitHead = commitHead;
    this.commitLookup = {};
    this.saveState();
    var i,
      expandedCommitVisible = false,
      avatarsNeeded = {};
    for (i = 0; i < this.commits.length; i++) {
      this.commitLookup[this.commits[i].hash] = i;
      if (this.expandedCommit != null && this.expandedCommit.hash === this.commits[i].hash) {
        expandedCommitVisible = true;
      }
      if (
        this.config.fetchAvatars &&
        typeof this.avatars[this.commits[i].email] !== 'string' &&
        this.commits[i].email !== ''
      ) {
        if (typeof avatarsNeeded[this.commits[i].email] === 'undefined') {
          avatarsNeeded[this.commits[i].email] = [this.commits[i].hash];
        } else {
          avatarsNeeded[this.commits[i].email].push(this.commits[i].hash);
        }
      }
    }
    this.graph.loadCommits(this.commits, this.commitHead, this.commitLookup);
    if (this.expandedCommit != null && !expandedCommitVisible) {
      this.expandedCommit = null;
      this.saveState();
    }
    this.render();
    this.triggerLoadCommitsCallback(true);
    this.fetchAvatars(avatarsNeeded);
  }

  triggerLoadCommitsCallback(changes) {
    if (this.loadCommitsCallback != null) {
      this.loadCommitsCallback(changes);
      this.loadCommitsCallback = null;
    }
  }

  loadAvatar(email, image) {
    this.avatars[email] = image;
    this.saveState();
    var avatarsElems = document.getElementsByClassName('avatar'),
      escapedEmail = escapeHtml(email);
    for (var i = 0; i < avatarsElems.length; i++) {
      if (avatarsElems[i].dataset.email === escapedEmail) {
        avatarsElems[i].innerHTML = '<img class="avatarImg" src="' + image + '">';
      }
    }
  }

  refresh(hard) {
    if (hard) {
      if (this.expandedCommit != null) {
        this.expandedCommit = null;
        this.saveState();
      }
      this.renderShowLoading();
    }
    this.requestLoadBranchesAndCommits(hard);
  }

  requestLoadBranches(hard, loadedCallback) {
    if (this.loadBranchesCallback != null) {
      return;
    }
    this.loadBranchesCallback = loadedCallback;
    sendMessage({
      command: 'loadBranches',
      repo: this.currentRepo,
      showRemoteBranches: this.showRemoteBranches,
      hard: hard,
    });
  }

  requestLoadCommits(hard, loadedCallback) {
    if (this.loadCommitsCallback != null) {
      return;
    }
    this.loadCommitsCallback = loadedCallback;
    sendMessage({
      command: 'loadCommits',
      repo: this.currentRepo,
      branchName: this.currentBranch != null ? this.currentBranch : '',
      maxCommits: this.maxCommits,
      showRemoteBranches: this.showRemoteBranches,
      hard: hard,
    });
  }

  requestLoadBranchesAndCommits(hard) {
    var _this = this;
    this.requestLoadBranches(hard, function(branchChanges, isRepo) {
      if (isRepo) {
        _this.requestLoadCommits(hard, function(commitChanges) {
          if (!hard && (branchChanges || commitChanges)) {
            ContextMenu.hideDialogAndContextMenu();
          }
        });
      } else {
        sendMessage({
          command: 'loadRepos',
          check: true,
        });
      }
    });
  }

  fetchAvatars(avatars) {
    var emails = Object.keys(avatars);
    for (var i = 0; i < emails.length; i++) {
      sendMessage({
        command: 'fetchAvatar',
        repo: this.currentRepo,
        email: emails[i],
        commits: avatars[emails[i]],
      });
    }
  }

  saveState() {
    vscode.setState({
      gitRepos: this.gitRepos,
      gitBranches: this.gitBranches,
      gitBranchHead: this.gitBranchHead,
      commits: this.commits,
      commitHead: this.commitHead,
      avatars: this.avatars,
      currentBranch: this.currentBranch,
      currentRepo: this.currentRepo,
      moreCommitsAvailable: this.moreCommitsAvailable,
      maxCommits: this.maxCommits,
      showRemoteBranches: this.showRemoteBranches,
      expandedCommit: this.expandedCommit,
    });
  }

  render() {
    this.renderTable();
    this.renderGraph();
  }

  renderGraph() {
    var colHeadersElem = document.getElementById('tableColHeaders');
    if (colHeadersElem == null) {
      return;
    }
    const headerHeight = colHeadersElem.clientHeight + 1;
    this.config.grid.offsetY = headerHeight + this.config.grid.y / 2;
    this.graph.render();
  }

  renderTable() {
    var _this = this;
    var html = `
        <thead>
          <tr id="tableColHeaders">
            <th id="tableHeaderGraphCol" class="tableColHeader">Graph</th>
            <th class="tableColHeader">Description</th>
            <th class="tableColHeader">Date</th>
            <th class="tableColHeader">Author</th>
            <th class="tableColHeader">Commit</th>
          </tr>
        </thead>
        <tbody>`,
      i,
      currentHash = this.commits.length > 0 && this.commits[0].hash === '*' ? '*' : this.commitHead;
    for (i = 0; i < this.commits.length; i++) {
      var refs = '',
        message = escapeHtml(this.commits[i].message),
        date = GitGraphView.getCommitDate(this.commits[i].date),
        j = void 0,
        refName = void 0,
        refActive = void 0,
        refHtml = void 0;
      for (j = 0; j < this.commits[i].refs.length; j++) {
        refName = escapeHtml(this.commits[i].refs[j].name);
        refActive = this.commits[i].refs[j].type === 'head' && this.commits[i].refs[j].name === this.gitBranchHead;
        refHtml =
          '<span class="gitRef ' +
          this.commits[i].refs[j].type +
          (refActive ? ' active' : '') +
          '" data-name="' +
          refName +
          '">' +
          (this.commits[i].refs[j].type === 'tag' ? svgIcons.tag : svgIcons.branch) +
          refName +
          '</span>';
        refs = refActive ? refHtml + refs : refs + refHtml;
      }
      html +=
        '<tr class="commit" data-hash="' +
        this.commits[i].hash +
        '"' +
        ' data-id="' +
        i +
        '" data-color="' +
        this.graph.getVertexColor(i) +
        '"><td></td><td>' +
        refs +
        (this.commits[i].hash === currentHash ? '<b>' + message + '</b>' : message) +
        '</td><td title="' +
        date.title +
        '">' +
        date.value +
        '</td><td title="' +
        escapeHtml(this.commits[i].author + ' <' + this.commits[i].email + '>') +
        '">' +
        (this.config.fetchAvatars
          ? '<span class="avatar" data-email="' +
            escapeHtml(this.commits[i].email) +
            '">' +
            (typeof this.avatars[this.commits[i].email] === 'string'
              ? '<img class="avatarImg" src="' + this.avatars[this.commits[i].email] + '">'
              : '') +
            '</span>'
          : '') +
        escapeHtml(this.commits[i].author) +
        '</td><td title="' +
        escapeHtml(this.commits[i].hash) +
        '">' +
        abbrevCommit(this.commits[i].hash) +
        '</td></tr>';
    }
    this.tableElem.innerHTML = '<table>' + html + '</tbody></table>';
    this.footerElem.innerHTML = this.moreCommitsAvailable
      ? '<div id="loadMoreCommitsBtn" class="roundedBtn">Load More Commits</div>'
      : '';

    this.initElementResizer();

    if (this.moreCommitsAvailable) {
      document.getElementById('loadMoreCommitsBtn').addEventListener('click', function() {
        document.getElementById('loadMoreCommitsBtn').parentNode.innerHTML =
          '<h2 id="loadingHeader">' + svgIcons.loading + 'Loading ...</h2>';
        _this.maxCommits += _this.config.loadMoreCommits;
        _this.hideCommitDetails();
        _this.saveState();
        _this.requestLoadCommits(true, function() {});
      });
    }
    if (this.expandedCommit != null) {
      var elem = null,
        elems = document.getElementsByClassName('commit');
      for (i = 0; i < elems.length; i++) {
        if (this.expandedCommit.hash === elems[i].dataset.hash) {
          elem = elems[i];
          break;
        }
      }
      if (elem == null) {
        this.expandedCommit = null;
        this.saveState();
      } else {
        this.expandedCommit.id = parseInt(elem.dataset.id);
        this.expandedCommit.srcElem = elem;
        this.saveState();
        if (this.expandedCommit.commitDetails != null && this.expandedCommit.fileTree != null) {
          this.showCommitDetails(this.expandedCommit.commitDetails, this.expandedCommit.fileTree);
        } else {
          this.loadCommitDetails(elem);
        }
      }
    }

    addListenerToClass('commit', 'contextmenu', function(e) {
      e.stopPropagation();
      var sourceElem = e.target.closest('.commit');
      var hash = sourceElem.dataset.hash;
      ContextMenu.showContextMenu(
        e,
        [
          {
            title: 'Add Tag',
            onClick: function() {
              Dialog.showFormDialog(
                'Add tag to commit <b><i>' + abbrevCommit(hash) + '</i></b>:',
                [
                  {
                    type: 'text-ref',
                    name: 'Name: ',
                    default: '',
                  },
                  {
                    type: 'select',
                    name: 'Type: ',
                    default: 'annotated',
                    options: [
                      {
                        name: 'Annotated',
                        value: 'annotated',
                      },
                      {
                        name: 'Lightweight',
                        value: 'lightweight',
                      },
                    ],
                  },
                  {
                    type: 'text',
                    name: 'Message: ',
                    default: '',
                    placeholder: 'Optional',
                  },
                ],
                'Add Tag',
                function(values) {
                  sendMessage({
                    command: 'addTag',
                    repo: _this.currentRepo,
                    tagName: values[0],
                    commitHash: hash,
                    lightweight: values[1] === 'lightweight',
                    message: values[2],
                  });
                },
                sourceElem
              );
            },
          },
          {
            title: 'Create Branch',
            onClick: function() {
              Dialog.showRefInputDialog(
                'Enter the name of the branch you would like to create from commit <b><i>' +
                  abbrevCommit(hash) +
                  '</i></b>:',
                '',
                'Create Branch',
                function(name) {
                  sendMessage({
                    command: 'createBranch',
                    repo: _this.currentRepo,
                    branchName: name,
                    commitHash: hash,
                  });
                },
                sourceElem
              );
            },
          },
          null,
          {
            title: 'Checkout',
            onClick: function() {
              Dialog.showConfirmationDialog(
                'Are you sure you want to checkout commit <b><i>' +
                  abbrevCommit(hash) +
                  "</i></b>? This will result in a 'detached HEAD' state.",
                function() {
                  sendMessage({
                    command: 'checkoutCommit',
                    repo: _this.currentRepo,
                    commitHash: hash,
                  });
                },
                sourceElem
              );
            },
          },
          {
            title: 'Cherry Pick',
            onClick: function() {
              if (_this.commits[_this.commitLookup[hash]].parentHashes.length === 1) {
                Dialog.showConfirmationDialog(
                  'Are you sure you want to cherry pick commit <b><i>' + abbrevCommit(hash) + '</i></b>?',
                  function() {
                    sendMessage({
                      command: 'cherrypickCommit',
                      repo: _this.currentRepo,
                      commitHash: hash,
                      parentIndex: 0,
                    });
                  },
                  sourceElem
                );
              } else {
                var options = _this.commits[_this.commitLookup[hash]].parentHashes.map(function(hash, index) {
                  return {
                    name:
                      abbrevCommit(hash) +
                      (typeof _this.commitLookup[hash] === 'number'
                        ? ': ' + _this.commits[_this.commitLookup[hash]].message
                        : ''),
                    value: (index + 1).toString(),
                  };
                });
                Dialog.showSelectDialog(
                  'Are you sure you want to cherry pick merge commit <b><i>' +
                    abbrevCommit(hash) +
                    '</i></b>? Choose the parent hash on the main branch, to cherry pick the commit relative to:',
                  '1',
                  options,
                  'Yes, cherry pick commit',
                  function(parentIndex) {
                    sendMessage({
                      command: 'cherrypickCommit',
                      repo: _this.currentRepo,
                      commitHash: hash,
                      parentIndex: parseInt(parentIndex),
                    });
                  },
                  sourceElem
                );
              }
            },
          },
          {
            title: 'Revert',
            onClick: function() {
              if (_this.commits[_this.commitLookup[hash]].parentHashes.length === 1) {
                Dialog.showConfirmationDialog(
                  'Are you sure you want to revert commit <b><i>' + abbrevCommit(hash) + '</i></b>?',
                  function() {
                    sendMessage({
                      command: 'revertCommit',
                      repo: _this.currentRepo,
                      commitHash: hash,
                      parentIndex: 0,
                    });
                  },
                  sourceElem
                );
              } else {
                var options = _this.commits[_this.commitLookup[hash]].parentHashes.map(function(hash, index) {
                  return {
                    name:
                      abbrevCommit(hash) +
                      (typeof _this.commitLookup[hash] === 'number'
                        ? ': ' + _this.commits[_this.commitLookup[hash]].message
                        : ''),
                    value: (index + 1).toString(),
                  };
                });
                Dialog.showSelectDialog(
                  'Are you sure you want to revert merge commit <b><i>' +
                    abbrevCommit(hash) +
                    '</i></b>? Choose the parent hash on the main branch, to revert the commit relative to:',
                  '1',
                  options,
                  'Yes, revert commit',
                  function(parentIndex) {
                    sendMessage({
                      command: 'revertCommit',
                      repo: _this.currentRepo,
                      commitHash: hash,
                      parentIndex: parseInt(parentIndex),
                    });
                  },
                  sourceElem
                );
              }
            },
          },
          null,
          {
            title: 'Merge into current branch',
            onClick: function() {
              Dialog.showCheckboxDialog(
                'Are you sure you want to merge commit <b><i>' +
                  abbrevCommit(hash) +
                  '</i></b> into the current branch?',
                'Create a new commit even if fast-forward is possible',
                true,
                'Yes, merge',
                function(createNewCommit) {
                  sendMessage({
                    command: 'mergeCommit',
                    repo: _this.currentRepo,
                    commitHash: hash,
                    createNewCommit: createNewCommit,
                  });
                },
                null
              );
            },
          },
          {
            title: 'Reset current branch to this Commit',
            onClick: function() {
              Dialog.showSelectDialog(
                'Are you sure you want to reset the <b>current branch</b> to commit <b><i>' +
                  abbrevCommit(hash) +
                  '</i></b>?',
                'mixed',
                [
                  {
                    name: 'Soft - Keep all changes, but reset head',
                    value: 'soft',
                  },
                  {
                    name: 'Mixed - Keep working tree, but reset index',
                    value: 'mixed',
                  },
                  {
                    name: 'Hard - Discard all changes',
                    value: 'hard',
                  },
                ],
                'Yes, reset',
                function(mode) {
                  sendMessage({
                    command: 'resetToCommit',
                    repo: _this.currentRepo,
                    commitHash: hash,
                    resetMode: mode,
                  });
                },
                sourceElem
              );
            },
          },
          null,
          {
            title: 'Copy Commit Hash to Clipboard',
            onClick: function() {
              sendMessage({
                command: 'copyToClipboard',
                type: 'Commit Hash',
                data: hash,
              });
            },
          },
        ],
        sourceElem
      );
    });

    addListenerToClass('commit', 'click', function(e) {
      var sourceElem = e.target.closest('.commit');
      _this.loadCommitDetails(sourceElem);
    });

    addListenerToClass('gitRef', 'contextmenu', function(e) {
      e.stopPropagation();
      var sourceElem = e.target.closest('.gitRef');
      var refName = unescapeHtml(sourceElem.dataset.name),
        menu,
        copyType;
      console.log(sourceElem);
      console.log(refName);
      if (sourceElem.classList.contains('tag')) {
        menu = [
          {
            title: 'Delete Tag',
            onClick: function() {
              Dialog.showConfirmationDialog(
                'Are you sure you want to delete the tag <b><i>' + escapeHtml(refName) + '</i></b>?',
                function() {
                  sendMessage({
                    command: 'deleteTag',
                    repo: _this.currentRepo,
                    tagName: refName,
                  });
                },
                null
              );
            },
          },
          {
            title: 'Push Tag',
            onClick: function() {
              Dialog.showConfirmationDialog(
                'Are you sure you want to push the tag <b><i>' + escapeHtml(refName) + '</i></b>?',
                function() {
                  sendMessage({
                    command: 'pushTag',
                    repo: _this.currentRepo,
                    tagName: refName,
                  });
                  Dialog.showActionRunningDialog('Pushing Tag');
                },
                null
              );
            },
          },
        ];
        copyType = 'Tag Name';
      } else {
        if (sourceElem.classList.contains('head')) {
          menu = [];
          if (_this.gitBranchHead !== refName) {
            menu.push({
              title: 'Checkout Branch',
              onClick: function() {
                return _this.checkoutBranchAction(sourceElem, refName);
              },
            });
          }
          menu.push({
            title: 'Rename Branch',
            onClick: function() {
              Dialog.showRefInputDialog(
                'Enter the new name for branch <b><i>' + escapeHtml(refName) + '</i></b>:',
                refName,
                'Rename Branch',
                function(newName) {
                  sendMessage({
                    command: 'renameBranch',
                    repo: _this.currentRepo,
                    oldName: refName,
                    newName: newName,
                  });
                },
                null
              );
            },
          });
          if (_this.gitBranchHead !== refName) {
            menu.push(
              {
                title: 'Delete Branch',
                onClick: function() {
                  Dialog.showCheckboxDialog(
                    'Are you sure you want to delete the branch <b><i>' + escapeHtml(refName) + '</i></b>?',
                    'Force Delete',
                    false,
                    'Delete Branch',
                    function(forceDelete) {
                      sendMessage({
                        command: 'deleteBranch',
                        repo: _this.currentRepo,
                        branchName: refName,
                        forceDelete: forceDelete,
                      });
                    },
                    null
                  );
                },
              },
              {
                title: 'Merge into current branch',
                onClick: function() {
                  Dialog.showCheckboxDialog(
                    'Are you sure you want to merge branch <b><i>' +
                      escapeHtml(refName) +
                      '</i></b> into the current branch?',
                    'Create a new commit even if fast-forward is possible',
                    true,
                    'Yes, merge',
                    function(createNewCommit) {
                      sendMessage({
                        command: 'mergeBranch',
                        repo: _this.currentRepo,
                        branchName: refName,
                        createNewCommit: createNewCommit,
                      });
                    },
                    null
                  );
                },
              }
            );
          }
        } else {
          menu = [
            {
              title: 'Checkout Branch',
              onClick: function() {
                return _this.checkoutBranchAction(sourceElem, refName);
              },
            },
          ];
        }
        copyType = 'Branch Name';
      }
      menu.push(null, {
        title: 'Copy ' + copyType + ' to Clipboard',
        onClick: function() {
          sendMessage({
            command: 'copyToClipboard',
            type: copyType,
            data: refName,
          });
        },
      });
      ContextMenu.showContextMenu(e, menu, sourceElem);
    });

    addListenerToClass('gitRef', 'dblclick', function(e) {
      e.stopPropagation();
      hideDialogAndContextMenu();
      var sourceElem = e.target.closest('.gitRef');
      _this.checkoutBranchAction(sourceElem, unescapeHtml(sourceElem.dataset.name));
    });
  }

  initElementResizer() {
    const trElement = document.getElementById('tableColHeaders');
    const thElements = document.getElementsByClassName('tableColHeader');
    const resizeClassName = 'resizeCol';

    let columnWidths = this.gitRepos[this.currentRepo].columnWidths;

    if (columnWidths == null) {
      this.tableElem.className = 'autoLayout';
      thElements[0].style.padding =
        '0 ' +
        Math.round(
          (Math.max(this.graph.getWidth() + 16, ElementResizer.MIN_WIDTH_HEIGHT) - (thElements[0].offsetWidth - 24)) / 2
        ) +
        'px';
      columnWidths = [
        thElements[0].clientWidth - 24,
        thElements[2].clientWidth - 24,
        thElements[3].clientWidth - 24,
        thElements[4].clientWidth - 24,
      ];
    }

    Array.from(thElements).forEach((col, index) => {
      if (index > 0) {
        col.innerHTML += `<span class="${resizeClassName} before" data-col="${index - 1}"></span>`;
        col.innerHTML += `<span class="${resizeClassName} after" data-col="${index - 1}"></span>`;
      }
    });

    // make table fixed layout
    thElements[0].style.width = columnWidths[0] + 'px';
    thElements[0].style.padding = '';
    thElements[2].style.width = columnWidths[1] + 'px';
    thElements[3].style.width = columnWidths[2] + 'px';
    thElements[4].style.width = columnWidths[3] + 'px';
    this.tableElem.className = 'fixedLayout';

    let columnBeingEdited;
    let mouseX;
    const onResizeStart = mouseEvent => {
      mouseX = mouseEvent.clientX;
      columnBeingEdited = parseInt(mouseEvent.target.dataset.col);
    };

    const onResize = mouseEvent => {
      let mouseDeltaX = mouseEvent.clientX - mouseX;
      switch (columnBeingEdited) {
        case 0:
          if (columnWidths[0] + mouseDeltaX < 40) {
            mouseDeltaX = -columnWidths[0] + 40;
          }
          if (thElements[1].clientWidth - mouseDeltaX < ElementResizer.MIN_WIDTH_HEIGHT) {
            mouseDeltaX = thElements[1].clientWidth - ElementResizer.MIN_WIDTH_HEIGHT;
          }
          columnWidths[0] += mouseDeltaX;
          thElements[0].style.width = columnWidths[0] + 'px';
          break;
        case 1:
          if (thElements[1].clientWidth + mouseDeltaX < ElementResizer.MIN_WIDTH_HEIGHT) {
            mouseDeltaX = -thElements[1].clientWidth + ElementResizer.MIN_WIDTH_HEIGHT;
          }
          if (columnWidths[1] - mouseDeltaX < 40) {
            mouseDeltaX = columnWidths[1] - 40;
          }
          columnWidths[1] -= mouseDeltaX;
          thElements[2].style.width = columnWidths[1] + 'px';
          break;
        default:
          if (columnWidths[columnBeingEdited - 1] + mouseDeltaX < 40) {
            mouseDeltaX = -columnWidths[columnBeingEdited - 1] + 40;
          }
          if (columnWidths[columnBeingEdited] - mouseDeltaX < 40) {
            mouseDeltaX = columnWidths[columnBeingEdited] - 40;
          }
          columnWidths[columnBeingEdited - 1] += mouseDeltaX;
          columnWidths[columnBeingEdited] -= mouseDeltaX;
          thElements[columnBeingEdited].style.width = columnWidths[columnBeingEdited - 1] + 'px';
          thElements[columnBeingEdited + 1].style.width = columnWidths[columnBeingEdited] + 'px';
      }
      mouseX = mouseEvent.clientX;
    };

    const onResizeEnd = () => {
      columnBeingEdited = -1;
      this.gitRepos[this.currentRepo].columnWidths = columnWidths;
      sendMessage({
        command: 'saveRepoState',
        repo: this.currentRepo,
        state: this.gitRepos[this.currentRepo],
      });
    };

    new ElementResizer(trElement, resizeClassName, onResizeStart, onResize, onResizeEnd);
  }

  renderUncommitedChanges() {
    var date = GitGraphView.getCommitDate(this.commits[0].date);
    document.getElementsByClassName('unsavedChanges')[0].innerHTML =
      '<td></td><td><b>' +
      escapeHtml(this.commits[0].message) +
      '</b></td><td title="' +
      date.title +
      '">' +
      date.value +
      '</td><td title="* <>">*</td><td title="*">*</td>';
  }

  renderShowLoading() {
    hideDialogAndContextMenu();
    this.graph.clear();
    this.tableElem.innerHTML = '<h2 id="loadingHeader">' + svgIcons.loading + 'Loading ...</h2>';
    this.footerElem.innerHTML = '';
  }

  checkoutBranchAction(sourceElem, refName) {
    var _this = this;
    if (sourceElem.classList.contains('head')) {
      sendMessage({
        command: 'checkoutBranch',
        repo: this.currentRepo,
        branchName: refName,
        remoteBranch: null,
      });
    } else if (sourceElem.classList.contains('remote')) {
      var refNameComps = refName.split('/');
      Dialog.showRefInputDialog(
        'Enter the name of the new branch you would like to create when checking out <b><i>' +
          escapeHtml(sourceElem.dataset.name) +
          '</i></b>:',
        refNameComps[refNameComps.length - 1],
        'Checkout Branch',
        function(newBranch) {
          sendMessage({
            command: 'checkoutBranch',
            repo: _this.currentRepo,
            branchName: newBranch,
            remoteBranch: refName,
          });
        },
        null
      );
    }
  }

  observeWindowSizeChanges() {
    var _this = this;
    var windowWidth = window.outerWidth,
      windowHeight = window.outerHeight;
    window.addEventListener('resize', function() {
      if (windowWidth === window.outerWidth && windowHeight === window.outerHeight) {
        _this.renderGraph();
      } else {
        windowWidth = window.outerWidth;
        windowHeight = window.outerHeight;
      }
    });
  }

  observeWebviewStyleChanges() {
    var _this = this;
    var fontFamily = getVSCodeStyle('--vscode-editor-font-family');
    new MutationObserver(function() {
      var ff = getVSCodeStyle('--vscode-editor-font-family');
      if (ff !== fontFamily) {
        fontFamily = ff;
        _this.repoDropdown.refresh();
        _this.branchDropdown.refresh();
      }
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
  }

  observeWebviewScroll() {
    var _this = this;
    var active = window.scrollY > 0;
    this.scrollShadowElem.className = active ? 'active' : '';
    document.addEventListener('scroll', function() {
      if (active !== window.scrollY > 0) {
        active = window.scrollY > 0;
        _this.scrollShadowElem.className = active ? 'active' : '';
      }
    });
  }

  loadCommitDetails(sourceElem) {
    this.expandedCommit = {
      id: parseInt(sourceElem.dataset.id),
      hash: sourceElem.dataset.hash,
      commitDetails: null,
      fileTree: null,
    };
    this.saveState();
    sendMessage({
      command: 'commitDetails',
      repo: this.currentRepo,
      commitHash: sourceElem.dataset.hash,
    });
  }

  hideCommitDetails() {
    if (this.expandedCommit != null) {
      var elem = document.getElementById('commitDetails');
      emptyElement(elem);
      this.expandedCommit = null;
      this.saveState();
    }
  }

  showCommitDetails(commitDetails, fileTree) {
    var commitDetailsEl = document.getElementById('commitDetails');
    new CommitView(
      commitDetailsEl,
      commitDetails,
      fileTree,
      this.expandedCommit,
      this.avatars,
      this.gitRepos,
      this.currentRepo
    ).render();
    this.saveState();

    var _this = this;
    // TODO: remove
    // document.getElementById('commitDetailsClose').addEventListener('click', function() {
    //   _this.hideCommitDetails();
    // });
    // TODO: remove
    addListenerToClass('gitFolder', 'click', function(e) {
      function alterGitFileTree(folder, folderPath, open) {
        var path = folderPath.split('/'),
          i,
          cur = folder;
        for (i = 0; i < path.length; i++) {
          if (typeof cur.contents[path[i]] !== 'undefined') {
            cur = cur.contents[path[i]];
            if (i === path.length - 1) {
              cur.open = open;
              return;
            }
          } else {
            return;
          }
        }
      }
      var sourceElem = e.target.closest('.gitFolder');
      var parent = sourceElem.parentElement;
      parent.classList.toggle('closed');
      var isOpen = !parent.classList.contains('closed');
      parent.children[0].children[0].innerHTML = isOpen ? svgIcons.openFolder : svgIcons.closedFolder;
      parent.children[1].classList.toggle('hidden');
      alterGitFileTree(_this.expandedCommit.fileTree, decodeURIComponent(sourceElem.dataset.folderpath), isOpen);
      _this.saveState();
    });

    addListenerToClass('gitFile', 'click', function(e) {
      var sourceElem = e.target.closest('.gitFile');
      if (_this.expandedCommit == null || !sourceElem.classList.contains('gitDiffPossible')) {
        return;
      }
      sendMessage({
        command: 'viewDiff',
        repo: _this.currentRepo,
        commitHash: _this.expandedCommit.hash,
        oldFilePath: decodeURIComponent(sourceElem.dataset.oldfilepath),
        newFilePath: decodeURIComponent(sourceElem.dataset.newfilepath),
        type: sourceElem.dataset.type,
      });
    });
  }
}
