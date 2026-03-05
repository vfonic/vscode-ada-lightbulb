class HotkeyManager {
  static get ARROW_UP() {
    return 38;
  }
  static get ARROW_DOWN() {
    return 40;
  }
  static get TAB() {
    return 9;
  }
  static get ENTER() {
    return 13;
  }

  constructor(prevCommit, nextCommit, prevFile, nextFile, enterFile, selectAllFiles) {
    this.prevCommit = prevCommit;
    this.nextCommit = nextCommit;
    this.prevFile = prevFile;
    this.nextFile = nextFile;
    this.enterFile = enterFile;
    this.selectAllFiles = selectAllFiles;
    this.focusedPane = 'commits';
    this.focusedSection = null;
    this.onSectionChange = null;
    window.addEventListener('keydown', e => {
      if (e.keyCode === HotkeyManager.ARROW_UP) {
        e.preventDefault();
        if (this.focusedPane === 'files') {
          this.prevFile(e.shiftKey);
        } else {
          this.prevCommit();
        }
      } else if (e.keyCode === HotkeyManager.ARROW_DOWN) {
        e.preventDefault();
        if (this.focusedPane === 'files') {
          this.nextFile(e.shiftKey);
        } else {
          this.nextCommit();
        }
      } else if (e.keyCode === 65 && (e.metaKey || e.ctrlKey) && this.focusedPane === 'files') {
        e.preventDefault();
        e.stopPropagation();
        HotkeyManager.clearTextSelection();
        if (this.selectAllFiles) this.selectAllFiles();
      } else if (e.keyCode === HotkeyManager.TAB && this.focusedPane === 'files' && this.focusedSection !== null) {
        e.preventDefault();
        if (e.shiftKey && this.focusedSection === 'staged') {
          this.focusedSection = 'unstaged';
          if (this.onSectionChange) this.onSectionChange('unstaged');
        } else if (!e.shiftKey && this.focusedSection === 'unstaged') {
          this.focusedSection = 'staged';
          if (this.onSectionChange) this.onSectionChange('staged');
        }
      } else if (e.keyCode === HotkeyManager.ENTER && this.focusedPane === 'files' && this.focusedSection !== null) {
        e.preventDefault();
        if (this.enterFile) this.enterFile();
      }
    });
  }

  static clearTextSelection() {
    window.getSelection().removeAllRanges();
    var clearCount = 0;
    var clearTimer = setInterval(() => {
      window.getSelection().removeAllRanges();
      if (++clearCount >= 20) clearInterval(clearTimer);
    }, 0);
  }

  setFocusedPane(pane) {
    this.focusedPane = pane;
  }
}
