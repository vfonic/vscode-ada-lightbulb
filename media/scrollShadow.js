class ScrollShadow {
  constructor() {
    this.elements = [document.getElementById('scrollShadow-top'), document.getElementById('scrollShadow-bottom')];
  }
  set className(value) {
    this.elements.forEach(element => (element.className = value));
  }
}

window.ScrollShadow = ScrollShadow;
