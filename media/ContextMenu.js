class ContextMenu {
  constructor() {
    document.addEventListener('click', ContextMenu.hideContextMenuListener);
    document.addEventListener('contextmenu', ContextMenu.hideContextMenuListener);
    document.addEventListener('mouseleave', ContextMenu.hideContextMenuListener);
  }

  static getContextMenuElement() {
    return document.getElementById('contextMenu');
  }

  static hideContextMenuListener() {
    const contextMenu = ContextMenu.getContextMenuElement();
    if (contextMenu.classList.contains('active')) {
      ContextMenu.hideContextMenu();
    }
  }

  static hideContextMenu() {
    const contextMenu = ContextMenu.getContextMenuElement();
    contextMenu.className = '';
    contextMenu.innerHTML = '';
    contextMenu.style.left = '0px';
    contextMenu.style.top = '0px';
    if (this.contextMenuSource != null) {
      this.contextMenuSource.classList.remove('contextMenuActive');
      this.contextMenuSource = null;
    }
  }

  static showContextMenu(e, items, sourceElem) {
    const contextMenu = ContextMenu.getContextMenuElement();
    var html = '',
      i,
      event = e;
    const ELLIPSIS = '&#8230;';
    for (i = 0; i < items.length; i++) {
      html +=
        items[i] != null
          ? '<li class="contextMenuItem" data-index="' + i + '">' + items[i].title + ELLIPSIS + '</li>'
          : '<li class="contextMenuDivider"></li>';
    }
    ContextMenu.hideContextMenuListener();
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
      ContextMenu.hideContextMenu();
      items[parseInt(e.target.dataset.index)].onClick();
    });
    this.contextMenuSource = sourceElem;
    this.contextMenuSource.classList.add('contextMenuActive');
  }
}
