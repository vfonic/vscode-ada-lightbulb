class ElementResizer {
  constructor(gitGraphView) {
    const colHeadersElem = document.getElementById('tableColHeaders');
    const cols = document.getElementsByClassName('tableColHeader');
    var columnWidths = gitGraphView.gitRepos[gitGraphView.currentRepo].columnWidths;
    let mouseX = -1;
    let col = -1;
    Array.from(cols).forEach((col, index) => {
      if (index > 0) {
        col.innerHTML += `<span class="resizeCol left" data-col="${index - 1}"></span>`;
      }
      if (index < cols.length - 1) {
        col.innerHTML += `<span class="resizeCol right" data-col="${index}"></span>`;
      }
    });
    if (columnWidths !== null) {
      makeTableFixedLayout();
    } else {
      gitGraphView.tableElem.className = 'autoLayout';
      gitGraphView.graph.limitMaxWidth(-1);
      cols[0].style.padding =
        '0 ' + Math.round((Math.max(gitGraphView.graph.getWidth() + 16, 64) - (cols[0].offsetWidth - 24)) / 2) + 'px';
    }
    addListenerToClass('resizeCol', 'mousedown', function(e) {
      col = parseInt(e.target.dataset.col);
      mouseX = e.clientX;
      if (columnWidths === null) {
        columnWidths = [
          cols[0].clientWidth - 24,
          cols[2].clientWidth - 24,
          cols[3].clientWidth - 24,
          cols[4].clientWidth - 24,
        ];
        makeTableFixedLayout();
      }
      colHeadersElem.classList.add('resizing');
    });
    colHeadersElem.addEventListener('mousemove', function(e) {
      if (col > -1 && columnWidths !== null) {
        var mouseEvent = e;
        var mouseDeltaX = mouseEvent.clientX - mouseX;
        switch (col) {
          case 0:
            if (columnWidths[0] + mouseDeltaX < 40) {
              mouseDeltaX = -columnWidths[0] + 40;
            }
            if (cols[1].clientWidth - mouseDeltaX < 64) {
              mouseDeltaX = cols[1].clientWidth - 64;
            }
            columnWidths[0] += mouseDeltaX;
            cols[0].style.width = columnWidths[0] + 'px';
            gitGraphView.graph.limitMaxWidth(columnWidths[0] + 16);
            break;
          case 1:
            if (cols[1].clientWidth + mouseDeltaX < 64) {
              mouseDeltaX = -cols[1].clientWidth + 64;
            }
            if (columnWidths[1] - mouseDeltaX < 40) {
              mouseDeltaX = columnWidths[1] - 40;
            }
            columnWidths[1] -= mouseDeltaX;
            cols[2].style.width = columnWidths[1] + 'px';
            break;
          default:
            if (columnWidths[col - 1] + mouseDeltaX < 40) {
              mouseDeltaX = -columnWidths[col - 1] + 40;
            }
            if (columnWidths[col] - mouseDeltaX < 40) {
              mouseDeltaX = columnWidths[col] - 40;
            }
            columnWidths[col - 1] += mouseDeltaX;
            columnWidths[col] -= mouseDeltaX;
            cols[col].style.width = columnWidths[col - 1] + 'px';
            cols[col + 1].style.width = columnWidths[col] + 'px';
        }
        mouseX = mouseEvent.clientX;
      }
    });
    colHeadersElem.addEventListener('mouseup', stopResizing);
    colHeadersElem.addEventListener('mouseleave', stopResizing);

    function stopResizing() {
      if (col > -1 && columnWidths !== null) {
        col = -1;
        mouseX = -1;
        colHeadersElem.classList.remove('resizing');
        gitGraphView.gitRepos[gitGraphView.currentRepo].columnWidths = columnWidths;
        sendMessage({
          command: 'saveRepoState',
          repo: gitGraphView.currentRepo,
          state: gitGraphView.gitRepos[gitGraphView.currentRepo],
        });
      }
    }

    function makeTableFixedLayout() {
      if (columnWidths !== null) {
        cols[0].style.width = columnWidths[0] + 'px';
        cols[0].style.padding = '';
        cols[2].style.width = columnWidths[1] + 'px';
        cols[3].style.width = columnWidths[2] + 'px';
        cols[4].style.width = columnWidths[3] + 'px';
        gitGraphView.tableElem.className = 'fixedLayout';
        gitGraphView.graph.limitMaxWidth(columnWidths[0] + 16);
      }
    }
  }
}
