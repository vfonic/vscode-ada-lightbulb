window.exports =
  window.exports ||
  class {
    set default(klass) {
      window[klass.constructor.name] = klass;
    }
  };
window.module = window.module || { exports: window.exports };

const arraysEqual = (a, b, equalElements) => {
  if (a.length !== b.length) {
    return false;
  }
  for (var i = 0; i < a.length; i++) {
    if (!equalElements(a[i], b[i])) {
      return false;
    }
  }
  return true;
};

const pad2 = i => {
  return i > 9 ? i : '0' + i;
};

const addListenerToClass = (className, event, eventListener) => {
  var elements = document.getElementsByClassName(className),
    i;
  for (i = 0; i < elements.length; i++) {
    elements[i].addEventListener(event, eventListener);
  }
};

const sendMessage = msg => {
  vscode.postMessage(msg);
};

const getVSCodeStyle = name => document.documentElement.style.getPropertyValue(name);

const hideDialogAndContextMenu = () => {
  const dialog = Dialog.getDialogElement();
  if (dialog.classList.contains('active')) {
    Dialog.hideDialog();
  }
  const contextMenu = ContextMenu.getContextMenuElement();
  if (contextMenu.classList.contains('active')) {
    ContextMenu.hideContextMenu();
  }
};

document.addEventListener('keyup', function(e) {
  if (e.key === 'Escape') {
    hideDialogAndContextMenu();
  }
});
