window.vscode = acquireVsCodeApi();

(function() {
  var contextMenuSource = null;
  var dialogMenuSource = null;
  var graphViewConfig = {
    autoCenterCommitDetailsView: viewState.autoCenterCommitDetailsView,
    fetchAvatars: viewState.fetchAvatars,
    graphColours: viewState.graphColours,
    graphStyle: viewState.graphStyle,
    grid: {
      x: 16,
      y: 24,
      offsetX: 8,
      offsetY: 12,
      expandY: 250,
    },
    initialLoadCommits: viewState.initialLoadCommits,
    loadMoreCommits: viewState.loadMoreCommits,
    showCurrentBranchByDefault: viewState.showCurrentBranchByDefault,
  };
  var gitGraph = new GitGraphView(viewState.repos, viewState.lastActiveRepo, graphViewConfig, vscode.getState());
  window.addEventListener('message', function(event) {
    var msg = event.data;
    switch (msg.command) {
      case 'addTag':
        refreshGraphOrDisplayError(msg.status, 'Unable to Add Tag');
        break;
      case 'checkoutBranch':
        refreshGraphOrDisplayError(msg.status, 'Unable to Checkout Branch');
        break;
      case 'checkoutCommit':
        refreshGraphOrDisplayError(msg.status, 'Unable to Checkout Commit');
        break;
      case 'cherrypickCommit':
        refreshGraphOrDisplayError(msg.status, 'Unable to Cherry Pick Commit');
        break;
      case 'commitDetails':
        if (msg.commitDetails === null) {
          gitGraph.hideCommitDetails();
          showErrorDialog('Unable to load commit details', null, null);
        } else {
          gitGraph.showCommitDetails(msg.commitDetails, generateGitFileTree(msg.commitDetails.fileChanges));
        }
        break;
      case 'copyToClipboard':
        if (msg.success === false) {
          showErrorDialog('Unable to Copy ' + msg.type + ' to Clipboard', null, null);
        }
        break;
      case 'createBranch':
        refreshGraphOrDisplayError(msg.status, 'Unable to Create Branch');
        break;
      case 'deleteBranch':
        refreshGraphOrDisplayError(msg.status, 'Unable to Delete Branch');
        break;
      case 'deleteTag':
        refreshGraphOrDisplayError(msg.status, 'Unable to Delete Tag');
        break;
      case 'fetchAvatar':
        gitGraph.loadAvatar(msg.email, msg.image);
        break;
      case 'loadBranches':
        gitGraph.loadBranches(msg.branches, msg.head, msg.hard, msg.isRepo);
        break;
      case 'loadCommits':
        gitGraph.loadCommits(msg.commits, msg.head, msg.moreCommitsAvailable, msg.hard);
        break;
      case 'loadRepos':
        gitGraph.loadRepos(msg.repos, msg.lastActiveRepo);
        break;
      case 'mergeBranch':
        refreshGraphOrDisplayError(msg.status, 'Unable to Merge Branch');
        break;
      case 'mergeCommit':
        refreshGraphOrDisplayError(msg.status, 'Unable to Merge Commit');
        break;
      case 'pushTag':
        refreshGraphOrDisplayError(msg.status, 'Unable to Push Tag');
        break;
      case 'renameBranch':
        refreshGraphOrDisplayError(msg.status, 'Unable to Rename Branch');
        break;
      case 'refresh':
        gitGraph.refresh(false);
        break;
      case 'resetToCommit':
        refreshGraphOrDisplayError(msg.status, 'Unable to Reset to Commit');
        break;
      case 'revertCommit':
        refreshGraphOrDisplayError(msg.status, 'Unable to Revert Commit');
        break;
      case 'viewDiff':
        if (msg.success === false) {
          showErrorDialog('Unable to view diff of file', null, null);
        }
        break;
    }
  });

  function refreshGraphOrDisplayError(status, errorMessage) {
    if (status === null) {
      gitGraph.refresh(true);
    } else {
      showErrorDialog(errorMessage, status, null);
    }
  }

  function generateGitFileTree(gitFiles) {
    const files = { type: 'folder', name: '', folderPath: '', contents: {}, open: true };
    gitFiles.forEach((gitFile, i) => {
      let cur = files;
      const newFilePaths = gitFile.newFilePath.split('/');
      newFilePaths.forEach((newFilePath, j) => {
        if (j < newFilePaths.length - 1) {
          if (typeof cur.contents[newFilePath] === 'undefined') {
            cur.contents[newFilePath] = {
              type: 'folder',
              name: newFilePath,
              folderPath: newFilePaths.slice(0, j + 1).join('/'),
              contents: {},
              open: true,
            };
          }
          cur = cur.contents[newFilePath];
        } else {
          cur.contents[newFilePath] = { type: 'file', name: newFilePath, index: i };
        }
      });
    });
    return files;
  }

  function showContextMenu(e, items, sourceElem) {
    var html = '',
      i,
      event = e;
    const ELLIPSIS = '&#8230;';
    for (i = 0; i < items.length; i++) {
      html +=
        items[i] !== null
          ? '<li class="contextMenuItem" data-index="' + i + '">' + items[i].title + ELLIPSIS + '</li>'
          : '<li class="contextMenuDivider"></li>';
    }
    hideContextMenuListener();
    contextMenu.style.opacity = '0';
    contextMenu.className = 'active';
    contextMenu.innerHTML = html;
    var bounds = contextMenu.getBoundingClientRect();
    contextMenu.style.left =
      (event.pageX - window.pageXOffset + bounds.width < window.innerWidth
        ? event.pageX - 2
        : event.pageX - bounds.width + 2) + 'px';
    contextMenu.style.top =
      (event.pageY - window.pageYOffset + bounds.height < window.innerHeight
        ? event.pageY - 2
        : event.pageY - bounds.height + 2) + 'px';
    contextMenu.style.opacity = '1';
    addListenerToClass('contextMenuItem', 'click', function(e) {
      e.stopPropagation();
      hideContextMenu();
      items[parseInt(e.target.dataset.index)].onClick();
    });
    contextMenuSource = sourceElem;
    contextMenuSource.classList.add('contextMenuActive');
  }

  function hideContextMenu() {
    contextMenu.className = '';
    contextMenu.innerHTML = '';
    contextMenu.style.left = '0px';
    contextMenu.style.top = '0px';
    if (contextMenuSource !== null) {
      contextMenuSource.classList.remove('contextMenuActive');
      contextMenuSource = null;
    }
  }

  var DIALOG_FORM_ID = 'formDialogForm';

  function showConfirmationDialog(message, confirmed, sourceElem) {
    showDialog(
      message,
      'Yes',
      'No',
      function() {
        hideDialog();
        confirmed();
      },
      sourceElem
    );
  }

  function showRefInputDialog(message, defaultValue, actionName, actioned, sourceElem) {
    showFormDialog(
      message,
      [
        {
          type: 'text-ref',
          name: '',
          default: defaultValue,
        },
      ],
      actionName,
      function(values) {
        return actioned(values[0]);
      },
      sourceElem
    );
  }

  function showCheckboxDialog(message, checkboxLabel, checkboxValue, actionName, actioned, sourceElem) {
    showFormDialog(
      message,
      [
        {
          type: 'checkbox',
          name: checkboxLabel,
          value: checkboxValue,
        },
      ],
      actionName,
      function(values) {
        return actioned(values[0] === 'checked');
      },
      sourceElem
    );
  }

  function showSelectDialog(message, defaultValue, options, actionName, actioned, sourceElem) {
    showFormDialog(
      message,
      [
        {
          type: 'select',
          name: '',
          options: options,
          default: defaultValue,
        },
      ],
      actionName,
      function(values) {
        return actioned(values[0]);
      },
      sourceElem
    );
  }

  function showFormDialog(message, inputs, actionName, actioned, sourceElem) {
    var textRefInput = -1,
      multiElementForm = inputs.length > 1;
    var html = message + '<br><table class="dialogForm ' + (multiElementForm ? 'multi' : 'single') + '">';
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      html += '<tr>' + (multiElementForm ? '<td>' + input.name + '</td>' : '') + '<td>';
      if (input.type === 'select') {
        html += '<select form="' + DIALOG_FORM_ID + '" id="dialogInput' + i + '">';
        for (var j = 0; j < input.options.length; j++) {
          html +=
            '<option value="' +
            input.options[j].value +
            '"' +
            (input.options[j].value === input.default ? ' selected' : '') +
            '>' +
            input.options[j].name +
            '</option>';
        }
        html += '</select>';
      } else if (input.type === 'checkbox') {
        html +=
          '<span class="dialogFormCheckbox"><label><input form="' +
          DIALOG_FORM_ID +
          '" id="dialogInput' +
          i +
          '" type="checkbox"' +
          (input.value ? ' checked' : '') +
          '/>' +
          (multiElementForm ? '' : input.name) +
          '</label></span>';
      } else {
        html +=
          '<input form="' +
          DIALOG_FORM_ID +
          '" id="dialogInput' +
          i +
          '" type="text" value="' +
          input.default +
          '"' +
          (input.type === 'text' && input.placeholder !== null ? ' placeholder="' + input.placeholder + '"' : '') +
          '/>';
        if (input.type === 'text-ref') {
          textRefInput = i;
        }
      }
      html += '</td></tr>';
    }
    html += '</table>';
    showDialog(
      html,
      actionName,
      'Cancel',
      function() {
        if (dialog.className === 'active noInput' || dialog.className === 'active inputInvalid') {
          return;
        }
        var values = [];
        for (var i = 0; i < inputs.length; i++) {
          var input = inputs[i],
            elem = document.getElementById('dialogInput' + i);
          if (input.type === 'select') {
            values.push(elem.value);
          } else if (input.type === 'checkbox') {
            values.push(elem.checked ? 'checked' : 'unchecked');
          } else {
            values.push(elem.value);
          }
        }
        hideDialog();
        actioned(values);
      },
      sourceElem
    );
    if (textRefInput > -1) {
      var dialogInput_1 = document.getElementById('dialogInput' + textRefInput),
        dialogAction_1 = document.getElementById('dialogAction');
      if (dialogInput_1.value === '') {
        dialog.className = 'active noInput';
      }
      dialogInput_1.focus();
      dialogInput_1.addEventListener('keyup', function() {
        const REF_INVALID_MATCHER = /^[-\/].*|[\\" ><~^:?*[]|\.\.|\/\/|\/\.|@{|[.\/]$|\.lock$|^@$/g;
        var noInput = dialogInput_1.value === '',
          invalidInput = dialogInput_1.value.match(REF_INVALID_MATCHER) !== null;
        var newClassName = 'active' + (noInput ? ' noInput' : invalidInput ? ' inputInvalid' : '');
        if (dialog.className !== newClassName) {
          dialog.className = newClassName;
          dialogAction_1.title = invalidInput
            ? 'Unable to ' + actionName + ', one or more invalid characters entered.'
            : '';
        }
      });
    }
  }

  function showErrorDialog(message, reason, sourceElem) {
    showDialog(
      svgIcons.alert +
        'Error: ' +
        message +
        (reason !== null
          ? '<br><span class="errorReason">' +
            escapeHtml(reason)
              .split('\n')
              .join('<br>') +
            '</span>'
          : ''),
      null,
      'Dismiss',
      null,
      sourceElem
    );
  }

  function showActionRunningDialog(command) {
    showDialog('<span id="actionRunning">' + svgIcons.loading + command + ' ...</span>', null, 'Dismiss', null, null);
  }

  function showDialog(html, actionName, dismissName, actioned, sourceElem) {
    dialogBacking.className = 'active';
    dialog.className = 'active';
    dialog.innerHTML =
      html +
      '<br>' +
      (actionName !== null ? '<div id="dialogAction" class="roundedBtn">' + actionName + '</div>' : '') +
      '<div id="dialogDismiss" class="roundedBtn">' +
      dismissName +
      '</div>';
    var formEl = document.createElement('form');
    formEl.id = DIALOG_FORM_ID;
    dialog.appendChild(formEl);
    if (actionName !== null && actioned !== null) {
      formEl.addEventListener('submit', actioned);
      document.getElementById('dialogAction').addEventListener('click', actioned);
    }
    document.getElementById('dialogDismiss').addEventListener('click', hideDialog);
    dialogMenuSource = sourceElem;
    if (dialogMenuSource !== null) {
      dialogMenuSource.classList.add('dialogActive');
    }
  }

  function hideDialog() {
    dialogBacking.className = '';
    dialog.className = '';
    dialog.innerHTML = '';
    if (dialogMenuSource !== null) {
      dialogMenuSource.classList.remove('dialogActive');
      dialogMenuSource = null;
    }
  }

  document.addEventListener('click', hideContextMenuListener);
  document.addEventListener('contextmenu', hideContextMenuListener);
  document.addEventListener('mouseleave', hideContextMenuListener);

  function hideContextMenuListener() {
    if (contextMenu.classList.contains('active')) {
      hideContextMenu();
    }
  }
})();
