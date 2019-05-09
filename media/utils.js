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
  var elems = document.getElementsByClassName(className),
    i;
  for (i = 0; i < elems.length; i++) {
    elems[i].addEventListener(event, eventListener);
  }
};

const sendMessage = msg => {
  vscode.postMessage(msg);
};

const getVSCodeStyle = name => document.documentElement.style.getPropertyValue(name);

// var contextMenu = document.getElementById('contextMenu');
// var dialog = document.getElementById('dialog');
// var dialogBacking = document.getElementById('dialogBacking');

const hideDialogAndContextMenu = () => {
  if (dialog.classList.contains('active')) {
    hideDialog();
  }
  if (contextMenu.classList.contains('active')) {
    hideContextMenu();
  }
};

document.addEventListener('keyup', function(e) {
  if (e.key === 'Escape') {
    hideDialogAndContextMenu();
  }
});
