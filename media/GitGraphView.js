class GitGraphView {
  constructor(repos, lastActiveRepo, config) {
    this.gitBranches = [];
    this.commits = [];
    this.commitLookup = {};
    this.gitRepos = repos;
    this.config = config;
    this.maxCommits = 75;
    this.graph = new Graph('commitGraph', this.config);
    this.tableElem = document.getElementById('commitTable');
    this.footerElem = document.getElementById('footer');
    this.scrollShadowElem = new ScrollShadow();
    this.observeWindowSizeChanges();
    this.observeWebviewScroll();
    this.renderShowLoading();
    this.loadRepos(this.gitRepos, lastActiveRepo);
    this.requestLoadBranchesAndCommits(false);
    this.selectPreviousCommit = this.selectPreviousCommit.bind(this);
    this.selectNextCommit = this.selectNextCommit.bind(this);
    new HotkeyManager(this.selectPreviousCommit, this.selectNextCommit);
  }

  selectPreviousCommit() {
    const commitIndex = this.expandedCommit ? this.expandedCommit.id : -1;
    this.loadCommitDetails(Math.max(commitIndex - 1, 0));
  }
  selectNextCommit() {
    const commitIndex = this.expandedCommit ? this.expandedCommit.id : -1;
    this.loadCommitDetails(Math.min(commitIndex + 1, this.commits.length - 1));
  }

  static getCommitDate(dateVal) {
    var date = new Date(dateVal * 1e3),
      value;
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dateStr = date.getDate() + ' ' + MONTHS[date.getMonth()] + ' ' + date.getFullYear();
    var timeStr = pad2(date.getHours()) + ':' + pad2(date.getMinutes());
    value = dateStr + ' ' + timeStr;
    return { title: value, value };
  }

  loadRepos(repos, lastActiveRepo) {
    this.gitRepos = repos;
    if (repos[this.currentRepo] == null) {
      const repoPaths = Object.keys(repos);
      this.currentRepo = lastActiveRepo != null && repos[lastActiveRepo] ? lastActiveRepo : repoPaths[0];
      this.refresh(true);
    }
  }

  loadBranches(branchOptions, branchHead, hard, isRepo) {
    if (!isRepo) {
      this.triggerLoadBranchesCallback(false, isRepo);
      return;
    }
    if (!hard && arraysEqual(this.gitBranches, branchOptions, (a, b) => a === b) && this.gitBranchHead === branchHead) {
      this.triggerLoadBranchesCallback(false, isRepo);
      return;
    }
    this.gitBranches = branchOptions;
    this.gitBranchHead = branchHead;
    if (!this.currentBranch || this.gitBranches.indexOf(this.currentBranch) === -1) {
      this.currentBranch = '';
    }
    this.triggerLoadBranchesCallback(true, isRepo);
  }

  triggerLoadBranchesCallback(changes, isRepo) {
    if (this.loadBranchesCallback != null) {
      this.loadBranchesCallback(changes, isRepo);
      this.loadBranchesCallback = null;
    }
  }

  loadCommits(commits, commitHead, moreAvailable, hard) {
    if (!hard && this.moreCommitsAvailable === moreAvailable && this.commitHead === commitHead) {
      this.triggerLoadCommitsCallback(false);
      return;
    }
    this.moreCommitsAvailable = moreAvailable;
    this.commits = commits;
    this.commitHead = commitHead;
    this.commitLookup = {};
    this.commits.forEach((commit, i) => (this.commitLookup[commit.hash] = i));
    this.graph.loadCommits(this.commits, this.commitHead, this.commitLookup);
    this.render();
    this.triggerLoadCommitsCallback(true);
  }

  triggerLoadCommitsCallback(changes) {
    if (this.loadCommitsCallback != null) {
      this.loadCommitsCallback(changes);
      this.loadCommitsCallback = null;
    }
  }

  refresh(hard) {
    if (hard) {
      if (this.expandedCommit != null) {
        this.expandedCommit = null;
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
      hard: hard,
    });
  }

  requestLoadBranchesAndCommits(hard) {
    this.requestLoadBranches(hard, (branchChanges, isRepo) => {
      if (isRepo) {
        this.requestLoadCommits(hard, commitChanges => {
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

  saveState() {
    vscode.setState({
      gitRepos: this.gitRepos,
      gitBranches: this.gitBranches,
      gitBranchHead: this.gitBranchHead,
      commits: this.commits,
      commitHead: this.commitHead,
      currentBranch: this.currentBranch,
      currentRepo: this.currentRepo,
      moreCommitsAvailable: this.moreCommitsAvailable,
      maxCommits: this.maxCommits,
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
      currentHash = this.commits.length > 0 && this.commits[0].hash === '*' ? '*' : this.commitHead;
    this.commits.forEach((commit, i) => {
      var refs = '',
        message = escapeHtml(commit.message),
        date = GitGraphView.getCommitDate(commit.date),
        j = void 0,
        refName = void 0,
        refActive = void 0,
        refHtml = void 0;
      commit.refs.forEach(ref => {
        refName = escapeHtml(ref.name);
        refActive = ref.type === 'head' && ref.name === this.gitBranchHead;
        refHtml =
          '<span class="gitRef ' +
          ref.type +
          (refActive ? ' active' : '') +
          '" data-name="' +
          refName +
          '">' +
          (ref.type === 'tag' ? svgIcons.tag : svgIcons.branch) +
          refName +
          '</span>';
        refs = refActive ? refHtml + refs : refs + refHtml;
      });
      html +=
        '<tr class="commit" data-hash="' +
        commit.hash +
        '"' +
        ' data-id="' +
        i +
        '" data-color="' +
        this.graph.getVertexColor(i) +
        '"><td></td><td>' +
        refs +
        (commit.hash === currentHash ? '<b>' + message + '</b>' : message) +
        '</td><td title="' +
        date.title +
        '">' +
        date.value +
        '</td><td title="' +
        escapeHtml(commit.author + ' <' + commit.email + '>') +
        '">' +
        escapeHtml(commit.author) +
        '</td><td title="' +
        escapeHtml(commit.hash) +
        '">' +
        abbrevCommit(commit.hash) +
        '</td></tr>';
    });
    this.tableElem.innerHTML = '<table>' + html + '</tbody></table>';
    this.footerElem.innerHTML = this.moreCommitsAvailable
      ? '<div id="loadMoreCommitsBtn" class="roundedBtn">Load More Commits</div>'
      : '';

    this.initElementResizer();

    if (this.moreCommitsAvailable) {
      document.getElementById('loadMoreCommitsBtn').addEventListener('click', () => {
        document.getElementById('loadMoreCommitsBtn').parentNode.innerHTML =
          '<h2 id="loadingHeader">' + svgIcons.loading + 'Loading ...</h2>';
        this.maxCommits += 75;
        this.requestLoadCommits(true, () => {});
      });
    }

    addListenerToClass('commit', 'contextmenu', e => {
      e.stopPropagation();
      var sourceElem = e.target.closest('.commit');
      var hash = sourceElem.dataset.hash;
      ContextMenu.showContextMenu(
        e,
        [
          {
            title: 'Add Tag',
            onClick: () => {
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
                values => {
                  sendMessage({
                    command: 'addTag',
                    repo: this.currentRepo,
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
            onClick: () => {
              Dialog.showRefInputDialog(
                'Enter the name of the branch you would like to create from commit <b><i>' +
                  abbrevCommit(hash) +
                  '</i></b>:',
                '',
                'Create Branch',
                name => {
                  sendMessage({
                    command: 'createBranch',
                    repo: this.currentRepo,
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
            onClick: () => {
              Dialog.showConfirmationDialog(
                'Are you sure you want to checkout commit <b><i>' +
                  abbrevCommit(hash) +
                  "</i></b>? This will result in a 'detached HEAD' state.",
                () => {
                  sendMessage({
                    command: 'checkoutCommit',
                    repo: this.currentRepo,
                    commitHash: hash,
                  });
                },
                sourceElem
              );
            },
          },
          {
            title: 'Cherry Pick',
            onClick: () => {
              if (this.commits[this.commitLookup[hash]].parentHashes.length === 1) {
                Dialog.showConfirmationDialog(
                  'Are you sure you want to cherry pick commit <b><i>' + abbrevCommit(hash) + '</i></b>?',
                  () => {
                    sendMessage({
                      command: 'cherrypickCommit',
                      repo: this.currentRepo,
                      commitHash: hash,
                      parentIndex: 0,
                    });
                  },
                  sourceElem
                );
              } else {
                var options = this.commits[this.commitLookup[hash]].parentHashes.map((hash, index) => {
                  return {
                    name:
                      abbrevCommit(hash) +
                      (typeof this.commitLookup[hash] === 'number'
                        ? ': ' + this.commits[this.commitLookup[hash]].message
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
                  parentIndex => {
                    sendMessage({
                      command: 'cherrypickCommit',
                      repo: this.currentRepo,
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
            onClick: () => {
              if (this.commits[this.commitLookup[hash]].parentHashes.length === 1) {
                Dialog.showConfirmationDialog(
                  'Are you sure you want to revert commit <b><i>' + abbrevCommit(hash) + '</i></b>?',
                  () => {
                    sendMessage({
                      command: 'revertCommit',
                      repo: this.currentRepo,
                      commitHash: hash,
                      parentIndex: 0,
                    });
                  },
                  sourceElem
                );
              } else {
                var options = this.commits[this.commitLookup[hash]].parentHashes.map((hash, index) => {
                  return {
                    name:
                      abbrevCommit(hash) +
                      (typeof this.commitLookup[hash] === 'number'
                        ? ': ' + this.commits[this.commitLookup[hash]].message
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
                  parentIndex => {
                    sendMessage({
                      command: 'revertCommit',
                      repo: this.currentRepo,
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
            onClick: () => {
              Dialog.showCheckboxDialog(
                'Are you sure you want to merge commit <b><i>' +
                  abbrevCommit(hash) +
                  '</i></b> into the current branch?',
                'Create a new commit even if fast-forward is possible',
                true,
                'Yes, merge',
                createNewCommit => {
                  sendMessage({
                    command: 'mergeCommit',
                    repo: this.currentRepo,
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
            onClick: () => {
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
                mode => {
                  sendMessage({
                    command: 'resetToCommit',
                    repo: this.currentRepo,
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
            onClick: () => {
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

    addListenerToClass('commit', 'click', e => {
      var sourceElem = e.target.closest('.commit');
      this.loadCommitDetails(sourceElem.dataset.id);
    });

    addListenerToClass('gitRef', 'contextmenu', e => {
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
            onClick: () => {
              Dialog.showConfirmationDialog(
                'Are you sure you want to delete the tag <b><i>' + escapeHtml(refName) + '</i></b>?',
                () => {
                  sendMessage({
                    command: 'deleteTag',
                    repo: this.currentRepo,
                    tagName: refName,
                  });
                },
                null
              );
            },
          },
          {
            title: 'Push Tag',
            onClick: () => {
              Dialog.showConfirmationDialog(
                'Are you sure you want to push the tag <b><i>' + escapeHtml(refName) + '</i></b>?',
                () => {
                  sendMessage({
                    command: 'pushTag',
                    repo: this.currentRepo,
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
          if (this.gitBranchHead !== refName) {
            menu.push({
              title: 'Checkout Branch',
              onClick: () => {
                return this.checkoutBranchAction(sourceElem, refName);
              },
            });
          }
          menu.push({
            title: 'Rename Branch',
            onClick: () => {
              Dialog.showRefInputDialog(
                'Enter the new name for branch <b><i>' + escapeHtml(refName) + '</i></b>:',
                refName,
                'Rename Branch',
                newName => {
                  sendMessage({
                    command: 'renameBranch',
                    repo: this.currentRepo,
                    oldName: refName,
                    newName: newName,
                  });
                },
                null
              );
            },
          });
          if (this.gitBranchHead !== refName) {
            menu.push(
              {
                title: 'Delete Branch',
                onClick: () => {
                  Dialog.showCheckboxDialog(
                    'Are you sure you want to delete the branch <b><i>' + escapeHtml(refName) + '</i></b>?',
                    'Force Delete',
                    false,
                    'Delete Branch',
                    forceDelete => {
                      sendMessage({
                        command: 'deleteBranch',
                        repo: this.currentRepo,
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
                onClick: () => {
                  Dialog.showCheckboxDialog(
                    'Are you sure you want to merge branch <b><i>' +
                      escapeHtml(refName) +
                      '</i></b> into the current branch?',
                    'Create a new commit even if fast-forward is possible',
                    true,
                    'Yes, merge',
                    createNewCommit => {
                      sendMessage({
                        command: 'mergeBranch',
                        repo: this.currentRepo,
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
              onClick: () => {
                return this.checkoutBranchAction(sourceElem, refName);
              },
            },
          ];
        }
        copyType = 'Branch Name';
      }
      menu.push(null, {
        title: 'Copy ' + copyType + ' to Clipboard',
        onClick: () => {
          sendMessage({
            command: 'copyToClipboard',
            type: copyType,
            data: refName,
          });
        },
      });
      ContextMenu.showContextMenu(e, menu, sourceElem);
    });

    addListenerToClass('gitRef', 'dblclick', e => {
      e.stopPropagation();
      hideDialogAndContextMenu();
      var sourceElem = e.target.closest('.gitRef');
      this.checkoutBranchAction(sourceElem, unescapeHtml(sourceElem.dataset.name));
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

  renderShowLoading() {
    hideDialogAndContextMenu();
    this.graph.clear();
    this.tableElem.innerHTML = '<h2 id="loadingHeader">' + svgIcons.loading + 'Loading ...</h2>';
    this.footerElem.innerHTML = '';
  }

  checkoutBranchAction(sourceElem, refName) {
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
        newBranch => {
          sendMessage({
            command: 'checkoutBranch',
            repo: this.currentRepo,
            branchName: newBranch,
            remoteBranch: refName,
          });
        },
        null
      );
    }
  }

  observeWindowSizeChanges() {
    var windowWidth = window.outerWidth,
      windowHeight = window.outerHeight;
    window.addEventListener('resize', () => {
      if (windowWidth === window.outerWidth && windowHeight === window.outerHeight) {
        this.renderGraph();
      } else {
        windowWidth = window.outerWidth;
        windowHeight = window.outerHeight;
      }
    });
  }

  observeWebviewScroll() {
    var active = window.scrollY > 0;
    this.scrollShadowElem.className = active ? 'active' : '';
    document.addEventListener('scroll', () => {
      if (active !== window.scrollY > 0) {
        active = window.scrollY > 0;
        this.scrollShadowElem.className = active ? 'active' : '';
      }
    });
  }

  loadCommitDetails(commitIndex) {
    const commitData = document.querySelector('.commit[data-id="' + commitIndex + '"]').dataset;
    this.expandedCommit = {
      id: parseInt(commitData.id),
      hash: commitData.hash,
      commitDetails: null,
    };
    sendMessage({
      command: 'commitDetails',
      repo: this.currentRepo,
      commitHash: commitData.hash,
    });
  }

  showCommitDetails() {
    new CommitView(this.expandedCommit, this.gitRepos[this.currentRepo], this.currentRepo).render();

    addListenerToClass('gitFile', 'click', e => {
      var sourceElem = e.target.closest('.gitFile');
      if (!sourceElem.classList.contains('gitDiffPossible')) {
        return;
      }
      sendMessage({
        command: 'viewDiff',
        repo: this.currentRepo,
        commitHash: this.expandedCommit.hash,
        filePath: decodeURIComponent(sourceElem.dataset.filepath),
        newFilePath: decodeURIComponent(sourceElem.dataset.newfilepath),
        statusCode: sourceElem.dataset.statuscode,
      });
    });
  }

  get commitDetails() {
    return this._commitDetails;
  }
  set commitDetails(value) {
    this._expandedCommit.commitDetails = value;
    this.saveState();
  }
  get commitHead() {
    return this._commitHead;
  }
  set commitHead(value) {
    this._commitHead = value;
    this.saveState();
  }
  get commitLookup() {
    return this._commitLookup;
  }
  set commitLookup(value) {
    this._commitLookup = value;
    this.saveState();
  }
  get commits() {
    return this._commits;
  }
  set commits(value) {
    this._commits = value;
    this.saveState();
  }
  get currentBranch() {
    return this._currentBranch;
  }
  set currentBranch(value) {
    this._currentBranch = value;
    this.saveState();
  }
  get currentRepo() {
    return this._currentRepo;
  }
  set currentRepo(value) {
    this._currentRepo = value;
    this.saveState();
  }
  get expandedCommit() {
    return this._expandedCommit;
  }
  set expandedCommit(value) {
    this._expandedCommit = value;
    this.saveState();
  }
  get gitBranches() {
    return this._gitBranches;
  }
  set gitBranches(value) {
    this._gitBranches = value;
    this.saveState();
  }
  get gitBranchHead() {
    return this._gitBranchHead;
  }
  set gitBranchHead(value) {
    this._gitBranchHead = value;
    this.saveState();
  }
  get gitRepos() {
    return this._gitRepos;
  }
  set gitRepos(value) {
    this._gitRepos = value;
    this.saveState();
  }
  get maxCommits() {
    return this._maxCommits;
  }
  set maxCommits(value) {
    this._maxCommits = value;
    this.saveState();
  }
  get moreCommitsAvailable() {
    return this._moreCommitsAvailable;
  }
  set moreCommitsAvailable(value) {
    this._moreCommitsAvailable = value;
    this.saveState();
  }
}
