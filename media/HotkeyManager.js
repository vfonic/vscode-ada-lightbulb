class HotkeyManager {
  static get ARROW_UP() {
    return 38;
  }
  static get ARROW_DOWN() {
    return 40;
  }

  constructor(prevCommit, nextCommit, prevFile, nextFile) {
    this.prevCommit = prevCommit;
    this.nextCommit = nextCommit;
    this.prevFile = prevFile;
    this.nextFile = nextFile;
    this.focusedPane = 'commits';
    window.addEventListener('keydown', e => {
      if (e.keyCode === HotkeyManager.ARROW_UP) {
        e.preventDefault();
        if (this.focusedPane === 'files') {
          this.prevFile();
        } else {
          this.prevCommit();
        }
      }
    });
    window.addEventListener('keydown', e => {
      if (e.keyCode === HotkeyManager.ARROW_DOWN) {
        e.preventDefault();
        if (this.focusedPane === 'files') {
          this.nextFile();
        } else {
          this.nextCommit();
        }
      }
    });
  }

  setFocusedPane(pane) {
    this.focusedPane = pane;
  }
}
