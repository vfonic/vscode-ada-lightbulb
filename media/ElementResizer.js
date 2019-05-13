class ElementResizer {
  static get MIN_WIDTH_HEIGHT() {
    return 64;
  }

  constructor(container, resizeClassName, onResizeStart, onResize, onResizeEnd) {
    this.stopResizing = this.stopResizing.bind(this);
    this.resize = this.resize.bind(this);
    this.onResizeEnd = onResizeEnd;
    this.onResize = onResize;

    this.isResizing = false;
    this.container = container;

    addListenerToClass(resizeClassName, 'mousedown', mouseEvent => {
      this.isResizing = true;
      this.container.classList.add('resizing');
      this.container.addEventListener('mousemove', this.resize);
      this.container.addEventListener('mouseup', this.stopResizing);
      this.container.addEventListener('mouseleave', this.stopResizing);
      onResizeStart(mouseEvent);
    });
  }

  stopResizing() {
    this.isResizing = false;
    this.container.removeEventListener('mousemove', this.resize);
    this.container.removeEventListener('mouseup', this.stopResizing);
    this.container.removeEventListener('mouseleave', this.stopResizing);
    this.container.classList.remove('resizing');
    this.onResizeEnd();
  }

  resize(mouseEvent) {
    if (!this.isResizing) {
      return;
    }
    this.onResize(mouseEvent);
  }
}
