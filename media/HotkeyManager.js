class HotkeyManager {
  static get ARROW_UP() {
    return 38;
  }
  static get ARROW_DOWN() {
    return 40;
  }

  constructor(prevCommit, nextCommit) {
    this.prevCommit = prevCommit;
    this.nextCommit = nextCommit;
    window.addEventListener('keydown', e => {
      if (e.keyCode === HotkeyManager.ARROW_UP) {
        e.preventDefault();
        this.prevCommit();
      }
    });
    window.addEventListener('keydown', e => {
      if (e.keyCode === HotkeyManager.ARROW_DOWN) {
        e.preventDefault();
        this.nextCommit();
      }
    });
  }
}
