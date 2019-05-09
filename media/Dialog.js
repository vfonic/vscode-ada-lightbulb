const DIALOG_FORM_ID = 'formDialogForm';

class Dialog {
  static getDialogElement() {
    return document.getElementById('dialog');
  }
  static getDialogBackingElement() {
    return document.getElementById('dialogBacking');
  }

  static showConfirmationDialog(message, confirmed, sourceElem) {
    Dialog.showDialog(
      message,
      'Yes',
      'No',
      function() {
        Dialog.hideDialog();
        confirmed();
      },
      sourceElem
    );
  }

  static showRefInputDialog(message, defaultValue, actionName, actioned, sourceElem) {
    Dialog.showFormDialog(
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

  static showCheckboxDialog(message, checkboxLabel, checkboxValue, actionName, actioned, sourceElem) {
    Dialog.showFormDialog(
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

  static showSelectDialog(message, defaultValue, options, actionName, actioned, sourceElem) {
    Dialog.showFormDialog(
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

  static showFormDialog(message, inputs, actionName, actioned, sourceElem) {
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
    Dialog.showDialog(
      html,
      actionName,
      'Cancel',
      function() {
        const dialog = Dialog.getDialogElement();
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
        Dialog.hideDialog();
        actioned(values);
      },
      sourceElem
    );
    if (textRefInput > -1) {
      var dialogInput_1 = document.getElementById('dialogInput' + textRefInput),
        dialogAction_1 = document.getElementById('dialogAction');
      const dialog = Dialog.getDialogElement();
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

  static showErrorDialog(message, reason, sourceElem) {
    Dialog.showDialog(
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

  static showActionRunningDialog(command) {
    Dialog.showDialog(
      '<span id="actionRunning">' + svgIcons.loading + command + ' ...</span>',
      null,
      'Dismiss',
      null,
      null
    );
  }

  static showDialog(html, actionName, dismissName, actioned, sourceElem) {
    const dialog = Dialog.getDialogElement();
    const dialogBacking = Dialog.getDialogBackingElement();
    dialog.className = 'active';
    dialogBacking.className = 'active';
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
    document.getElementById('dialogDismiss').addEventListener('click', Dialog.hideDialog);
    this.dialogMenuSource = sourceElem;
    if (this.dialogMenuSource !== null) {
      this.dialogMenuSource.classList.add('dialogActive');
    }
  }

  static hideDialog() {
    const dialog = Dialog.getDialogElement();
    const dialogBacking = Dialog.getDialogBackingElement();
    dialog.className = '';
    dialogBacking.className = '';
    dialog.innerHTML = '';
    if (this.dialogMenuSource !== null) {
      this.dialogMenuSource.classList.remove('dialogActive');
      this.dialogMenuSource = null;
    }
  }
}
