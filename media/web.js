'use strict';

(function() {
  'use strict';
  var vscode = acquireVsCodeApi();

  function arraysEqual(a, b, equalElements) {
    if (a.length !== b.length) {
      return false;
    }
    for (var i = 0; i < a.length; i++) {
      if (!equalElements(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  function pad2(i) {
    return i > 9 ? i : '0' + i;
  }

  function addListenerToClass(className, event, eventListener) {
    var elems = document.getElementsByClassName(className),
      i;
    for (i = 0; i < elems.length; i++) {
      elems[i].addEventListener(event, eventListener);
    }
  }

  function sendMessage(msg) {
    vscode.postMessage(msg);
  }

  function getVSCodeStyle(name) {
    return document.documentElement.style.getPropertyValue(name);
  }

  class Dropdown {
    constructor(id, showInfo, dropdownType, changeCallback) {
      var _this = this;
      this.options = [];
      this.selectedOption = 0;
      this.dropdownVisible = false;
      this.showInfo = showInfo;
      this.changeCallback = changeCallback;
      this.elem = document.getElementById(id);
      var filter = document.createElement('div');
      filter.className = 'dropdownFilter';
      this.filterInput = document.createElement('input');
      this.filterInput.className = 'dropdownFilterInput';
      this.filterInput.placeholder = 'Filter ' + dropdownType + '...';
      filter.appendChild(this.filterInput);
      this.menuElem = document.createElement('div');
      this.menuElem.className = 'dropdownMenu';
      this.menuElem.appendChild(filter);
      this.optionsElem = document.createElement('div');
      this.optionsElem.className = 'dropdownOptions';
      this.menuElem.appendChild(this.optionsElem);
      this.noResultsElem = document.createElement('div');
      this.noResultsElem.className = 'dropdownNoResults';
      this.noResultsElem.innerHTML = 'No results found.';
      this.menuElem.appendChild(this.noResultsElem);
      this.currentValueElem = document.createElement('div');
      this.currentValueElem.className = 'dropdownCurrentValue';
      this.elem.appendChild(this.currentValueElem);
      this.elem.appendChild(this.menuElem);
      document.addEventListener(
        'click',
        function(e) {
          if (!e.target) {
            return;
          }
          if (e.target === _this.currentValueElem) {
            _this.dropdownVisible = !_this.dropdownVisible;
            if (_this.dropdownVisible) {
              _this.filterInput.value = '';
              _this.filter();
            }
            _this.elem.classList.toggle('dropdownOpen');
            if (_this.dropdownVisible) {
              _this.filterInput.focus();
            }
          } else if (_this.dropdownVisible) {
            if (e.target.closest('.dropdown') !== _this.elem) {
              _this.close();
            } else {
              var option = e.target.closest('.dropdownOption');
              if (
                option !== null &&
                option.parentNode === _this.optionsElem &&
                typeof option.dataset.id !== 'undefined'
              ) {
                var selectedOption = parseInt(option.dataset.id);
                _this.close();
                if (_this.selectedOption !== selectedOption) {
                  _this.selectedOption = selectedOption;
                  _this.render();
                  _this.changeCallback(_this.options[_this.selectedOption].value);
                }
              }
            }
          }
        },
        true
      );
      document.addEventListener(
        'contextmenu',
        function() {
          return _this.close();
        },
        true
      );
      document.addEventListener(
        'keyup',
        function(e) {
          if (e.key === 'Escape') {
            _this.close();
          }
        },
        true
      );
      this.filterInput.addEventListener('keyup', function() {
        return _this.filter();
      });
    }

    setOptions(options, selected) {
      this.options = options;
      var selectedOption = 0;
      for (var i = 0; i < options.length; i++) {
        if (options[i].value === selected) {
          selectedOption = i;
        }
      }
      this.selectedOption = selectedOption;
      if (options.length <= 1) {
        this.close();
      }
      this.render();
    }

    refresh() {
      if (this.options.length > 0) {
        this.render();
      }
    }

    render() {
      this.elem.classList.add('loaded');
      this.currentValueElem.innerHTML = this.options[this.selectedOption].name;
      var html = '';
      for (var i = 0; i < this.options.length; i++) {
        html +=
          '<div class="dropdownOption' +
          (this.selectedOption === i ? ' selected' : '') +
          '" data-id="' +
          i +
          '">' +
          escapeHtml(this.options[i].name) +
          (this.showInfo
            ? '<div class="dropdownOptionInfo" title="' +
              escapeHtml(this.options[i].value) +
              '">' +
              svgIcons.info +
              '</div>'
            : '') +
          '</div>';
      }
      this.optionsElem.className = 'dropdownOptions' + (this.showInfo ? ' showInfo' : '');
      this.optionsElem.innerHTML = html;
      this.filterInput.style.display = 'none';
      this.noResultsElem.style.display = 'none';
      this.menuElem.style.cssText = 'opacity:0; display:block;';
      this.currentValueElem.style.width =
        Math.max(this.menuElem.offsetWidth + (this.showInfo && this.menuElem.offsetHeight < 272 ? 0 : 12), 130) + 'px';
      this.menuElem.style.cssText = 'right:0; overflow-y:auto; max-height:297px;';
      if (this.dropdownVisible) {
        this.filter();
      }
    }

    filter() {
      var val = this.filterInput.value.toLowerCase(),
        match,
        matches = false;
      for (var i = 0; i < this.options.length; i++) {
        match = this.options[i].name.toLowerCase().indexOf(val) > -1;
        this.optionsElem.children[i].style.display = match ? 'block' : 'none';
        if (match) {
          matches = true;
        }
      }
      this.filterInput.style.display = 'block';
      this.noResultsElem.style.display = matches ? 'none' : 'block';
    }

    close() {
      this.elem.classList.remove('dropdownOpen');
      this.dropdownVisible = false;
    }
  }

  class Branch {
    constructor(colour) {
      this.lines = [];
      this.end = 0;
      this.numUncommitted = 0;
      this.colour = colour;
    }

    addLine(p1, p2, isCommitted, lockedFirst) {
      this.lines.push({
        p1: p1,
        p2: p2,
        lockedFirst: lockedFirst,
      });
      if (isCommitted) {
        if (p2.y < this.numUncommitted) {
          this.numUncommitted = p2.y;
        }
      } else {
        this.numUncommitted++;
      }
    }

    getColour() {
      return this.colour;
    }

    getEnd() {
      return this.end;
    }

    setEnd(end) {
      this.end = end;
    }

    draw(svg, config) {
      var colour = config.graphColours[this.colour % config.graphColours.length],
        i,
        x1,
        y1,
        x2,
        y2,
        lines = [],
        curPath = '',
        curColour = '',
        d = config.grid.y * (config.graphStyle === 'angular' ? 0.38 : 0.8);
      for (i = 0; i < this.lines.length; i++) {
        x1 = this.lines[i].p1.x * config.grid.x + config.grid.offsetX;
        y1 = this.lines[i].p1.y * config.grid.y + config.grid.offsetY;
        x2 = this.lines[i].p2.x * config.grid.x + config.grid.offsetX;
        y2 = this.lines[i].p2.y * config.grid.y + config.grid.offsetY;
        lines.push({
          p1: {
            x: x1,
            y: y1,
          },
          p2: {
            x: x2,
            y: y2,
          },
          isCommitted: i >= this.numUncommitted,
          lockedFirst: this.lines[i].lockedFirst,
        });
      }
      i = 0;
      while (i < lines.length - 1) {
        if (
          lines[i].p1.x === lines[i].p2.x &&
          lines[i].p2.x === lines[i + 1].p1.x &&
          lines[i + 1].p1.x === lines[i + 1].p2.x &&
          lines[i].p2.y === lines[i + 1].p1.y &&
          lines[i].isCommitted === lines[i + 1].isCommitted
        ) {
          lines[i].p2.y = lines[i + 1].p2.y;
          lines.splice(i + 1, 1);
        } else {
          i++;
        }
      }
      for (i = 0; i < lines.length; i++) {
        x1 = lines[i].p1.x;
        y1 = lines[i].p1.y;
        x2 = lines[i].p2.x;
        y2 = lines[i].p2.y;
        if (curPath !== '' && i > 0 && lines[i].isCommitted !== lines[i - 1].isCommitted) {
          this.drawPath(svg, curPath, curColour);
          curPath = '';
          curColour = '';
        }
        if (curPath === '' || (i > 0 && (x1 !== lines[i - 1].p2.x || y1 !== lines[i - 1].p2.y))) {
          curPath += 'M' + x1.toFixed(0) + ',' + y1.toFixed(1);
        }
        if (curColour === '') {
          curColour = lines[i].isCommitted ? colour : '#808080';
        }
        if (x1 === x2) {
          curPath += 'L' + x2.toFixed(0) + ',' + y2.toFixed(1);
        } else {
          if (config.graphStyle === 'angular') {
            curPath +=
              'L' +
              (lines[i].lockedFirst
                ? x2.toFixed(0) + ',' + (y2 - d).toFixed(1)
                : x1.toFixed(0) + ',' + (y1 + d).toFixed(1)) +
              'L' +
              x2.toFixed(0) +
              ',' +
              y2.toFixed(1);
          } else {
            curPath +=
              'C' +
              x1.toFixed(0) +
              ',' +
              (y1 + d).toFixed(1) +
              ' ' +
              x2.toFixed(0) +
              ',' +
              (y2 - d).toFixed(1) +
              ' ' +
              x2.toFixed(0) +
              ',' +
              y2.toFixed(1);
          }
        }
      }
      this.drawPath(svg, curPath, curColour);
    }

    drawPath(svg, path, colour) {
      var line1 = document.createElementNS('http://www.w3.org/2000/svg', 'path'),
        line2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line1.setAttribute('class', 'shadow');
      line1.setAttribute('d', path);
      line2.setAttribute('class', 'line');
      line2.setAttribute('d', path);
      line2.setAttribute('stroke', colour);
      svg.appendChild(line1);
      svg.appendChild(line2);
    }
  }

  class Vertex {
    constructor(y) {
      this.x = 0;
      this.parents = [];
      this.nextParent = 0;
      this.onBranch = null;
      this.isCommitted = true;
      this.isCurrent = false;
      this.nextX = 0;
      this.connections = [];
      this.y = y;
    }

    addParent(vertex) {
      this.parents.push(vertex);
    }

    hasParents() {
      return this.parents.length > 0;
    }

    getNextParent() {
      if (this.nextParent < this.parents.length) {
        return this.parents[this.nextParent];
      }
      return null;
    }

    getLastParent() {
      if (this.nextParent < 1) {
        return null;
      }
      return this.parents[this.nextParent - 1];
    }

    registerParentProcessed() {
      this.nextParent++;
    }

    isMerge() {
      return this.parents.length > 1;
    }

    addToBranch(branch, x) {
      if (this.onBranch === null) {
        this.onBranch = branch;
        this.x = x;
      }
    }

    isNotOnBranch() {
      return this.onBranch === null;
    }

    isOnThisBranch(branch) {
      return this.onBranch === branch;
    }

    getBranch() {
      return this.onBranch;
    }

    getPoint() {
      return {
        x: this.x,
        y: this.y,
      };
    }

    getNextPoint() {
      return {
        x: this.nextX,
        y: this.y,
      };
    }

    getIsCommitted() {
      return this.isCommitted;
    }

    getPointConnectingTo(vertex, onBranch) {
      for (var i = 0; i < this.connections.length; i++) {
        if (this.connections[i].connectsTo === vertex && this.connections[i].onBranch === onBranch) {
          return {
            x: i,
            y: this.y,
          };
        }
      }
      return null;
    }

    registerUnavailablePoint(x, connectsToVertex, onBranch) {
      if (x === this.nextX) {
        this.nextX = x + 1;
        this.connections[x] = {
          connectsTo: connectsToVertex,
          onBranch: onBranch,
        };
      }
    }

    getColour() {
      return this.onBranch !== null ? this.onBranch.getColour() : 0;
    }

    setNotCommited() {
      this.isCommitted = false;
    }

    setCurrent() {
      this.isCurrent = true;
    }

    draw(svg, config) {
      if (this.onBranch === null) {
        return;
      }
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      var colour = this.isCommitted
        ? config.graphColours[this.onBranch.getColour() % config.graphColours.length]
        : '#808080';
      circle.setAttribute('cx', (this.x * config.grid.x + config.grid.offsetX).toString());
      circle.setAttribute('cy', (this.y * config.grid.y + config.grid.offsetY).toString());
      circle.setAttribute('r', '4');
      if (this.isCurrent) {
        circle.setAttribute('class', 'current');
        circle.setAttribute('stroke', colour);
      } else {
        circle.setAttribute('fill', colour);
      }
      svg.appendChild(circle);
    }
  }

  class Graph {
    constructor(id, config) {
      this.svgGroup = null;
      this.maxWidth = -1;
      this.vertices = [];
      this.branches = [];
      this.availableColours = [];
      this.config = config;
      var svgNamespace = 'http://www.w3.org/2000/svg';
      var defs = document.createElementNS(svgNamespace, 'defs'),
        linearGradient = document.createElementNS(svgNamespace, 'linearGradient'),
        mask = document.createElementNS(svgNamespace, 'mask');
      this.svg = document.createElementNS(svgNamespace, 'svg');
      this.svgMaskRect = document.createElementNS(svgNamespace, 'rect');
      this.svgGradientStop1 = document.createElementNS(svgNamespace, 'stop');
      this.svgGradientStop2 = document.createElementNS(svgNamespace, 'stop');
      linearGradient.setAttribute('id', 'GraphGradient');
      this.svgGradientStop1.setAttribute('stop-color', 'white');
      linearGradient.appendChild(this.svgGradientStop1);
      this.svgGradientStop2.setAttribute('stop-color', 'black');
      linearGradient.appendChild(this.svgGradientStop2);
      defs.appendChild(linearGradient);
      mask.setAttribute('id', 'GraphMask');
      this.svgMaskRect.setAttribute('fill', 'url(#GraphGradient)');
      mask.appendChild(this.svgMaskRect);
      defs.appendChild(mask);
      this.svg.appendChild(defs);
      this.setDimensions(0, 0);
      document.getElementById(id).appendChild(this.svg);
    }

    loadCommits(commits, commitHead, commitLookup) {
      this.vertices = [];
      this.branches = [];
      this.availableColours = [];
      var i, j;
      for (i = 0; i < commits.length; i++) {
        this.vertices.push(new Vertex(i));
      }
      for (i = 0; i < commits.length; i++) {
        for (j = 0; j < commits[i].parentHashes.length; j++) {
          if (typeof commitLookup[commits[i].parentHashes[j]] === 'number') {
            this.vertices[i].addParent(this.vertices[commitLookup[commits[i].parentHashes[j]]]);
          }
        }
      }
      if (commits.length > 0) {
        if (commits[0].hash === '*') {
          this.vertices[0].setCurrent();
          this.vertices[0].setNotCommited();
        } else if (commitHead !== null && typeof commitLookup[commitHead] === 'number') {
          this.vertices[commitLookup[commitHead]].setCurrent();
        }
      }
      while ((i = this.findStart()) !== -1) {
        this.determinePath(i);
      }
    }

    render() {
      var group = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
        i,
        width = this.getWidth();
      group.setAttribute('mask', 'url(#GraphMask)');
      for (i = 0; i < this.branches.length; i++) {
        this.branches[i].draw(group, this.config);
      }
      for (i = 0; i < this.vertices.length; i++) {
        this.vertices[i].draw(group, this.config);
      }
      if (this.svgGroup !== null) {
        this.svg.removeChild(this.svgGroup);
      }
      this.svg.appendChild(group);
      this.svgGroup = group;
      this.setDimensions(width, this.getHeight());
      this.applyMaxWidth(width);
    }

    clear() {
      if (this.svgGroup !== null) {
        this.svg.removeChild(this.svgGroup);
        this.svgGroup = null;
        this.setDimensions(0, 0);
      }
    }

    getWidth() {
      var x = 0,
        i,
        p;
      for (i = 0; i < this.vertices.length; i++) {
        p = this.vertices[i].getNextPoint();
        if (p.x > x) {
          x = p.x;
        }
      }
      return x * this.config.grid.x;
    }

    getHeight() {
      return this.vertices.length * this.config.grid.y + this.config.grid.offsetY - this.config.grid.y / 2;
    }

    getVertexColour(v) {
      return this.vertices[v].getColour() % this.config.graphColours.length;
    }

    limitMaxWidth(maxWidth) {
      this.maxWidth = maxWidth;
      this.applyMaxWidth(this.getWidth());
    }

    setDimensions(width, height) {
      this.svg.setAttribute('width', width.toString());
      this.svg.setAttribute('height', height.toString());
      this.svgMaskRect.setAttribute('width', width.toString());
      this.svgMaskRect.setAttribute('height', height.toString());
    }

    applyMaxWidth(width) {
      var offset1 = this.maxWidth > -1 ? (this.maxWidth - 12) / width : 1;
      var offset2 = this.maxWidth > -1 ? this.maxWidth / width : 1;
      this.svgGradientStop1.setAttribute('offset', offset1.toString());
      this.svgGradientStop2.setAttribute('offset', offset2.toString());
    }

    determinePath(startAt) {
      var i = startAt;
      var vertex = this.vertices[i],
        parentVertex = this.vertices[i].getNextParent();
      var lastPoint = vertex.isNotOnBranch() ? vertex.getNextPoint() : vertex.getPoint(),
        curPoint;
      if (parentVertex !== null && vertex.isMerge() && !vertex.isNotOnBranch() && !parentVertex.isNotOnBranch()) {
        var foundPointToParent = false,
          parentBranch = parentVertex.getBranch();
        for (i = startAt + 1; i < this.vertices.length; i++) {
          curPoint = this.vertices[i].getPointConnectingTo(parentVertex, parentBranch);
          if (curPoint !== null) {
            foundPointToParent = true;
          } else {
            curPoint = this.vertices[i].getNextPoint();
          }
          parentBranch.addLine(
            lastPoint,
            curPoint,
            vertex.getIsCommitted(),
            !foundPointToParent && this.vertices[i] !== parentVertex ? lastPoint.x < curPoint.x : true
          );
          this.vertices[i].registerUnavailablePoint(curPoint.x, parentVertex, parentBranch);
          lastPoint = curPoint;
          if (foundPointToParent) {
            vertex.registerParentProcessed();
            break;
          }
        }
      } else {
        var branch = new Branch(this.getAvailableColour(startAt));
        vertex.addToBranch(branch, lastPoint.x);
        vertex.registerUnavailablePoint(lastPoint.x, vertex, branch);
        for (i = startAt + 1; i < this.vertices.length; i++) {
          curPoint =
            parentVertex === this.vertices[i] && !parentVertex.isNotOnBranch()
              ? this.vertices[i].getPoint()
              : this.vertices[i].getNextPoint();
          branch.addLine(lastPoint, curPoint, vertex.getIsCommitted(), lastPoint.x < curPoint.x);
          this.vertices[i].registerUnavailablePoint(curPoint.x, parentVertex, branch);
          lastPoint = curPoint;
          if (parentVertex === this.vertices[i]) {
            vertex.registerParentProcessed();
            var parentVertexOnBranch = !parentVertex.isNotOnBranch();
            parentVertex.addToBranch(branch, curPoint.x);
            vertex = parentVertex;
            parentVertex = vertex.getNextParent();
            if (parentVertexOnBranch) {
              break;
            }
          }
        }
        branch.setEnd(i);
        this.branches.push(branch);
        this.availableColours[branch.getColour()] = i;
      }
    }

    findStart() {
      for (var i = 0; i < this.vertices.length; i++) {
        if (this.vertices[i].getNextParent() !== null || this.vertices[i].isNotOnBranch()) {
          return i;
        }
      }
      return -1;
    }

    getAvailableColour(startAt) {
      for (var i = 0; i < this.availableColours.length; i++) {
        if (startAt > this.availableColours[i]) {
          return i;
        }
      }
      this.availableColours.push(0);
      return this.availableColours.length - 1;
    }
  }

  class GitGraphView {
    constructor(repos, lastActiveRepo, config, prevState) {
      var _this = this;
      this.gitBranches = [];
      this.gitBranchHead = null;
      this.commits = [];
      this.commitHead = null;
      this.commitLookup = {};
      this.avatars = {};
      this.currentBranch = null;
      this.moreCommitsAvailable = false;
      this.showRemoteBranches = true;
      this.expandedCommit = null;
      this.loadBranchesCallback = null;
      this.loadCommitsCallback = null;
      this.gitRepos = repos;
      this.config = config;
      this.maxCommits = config.initialLoadCommits;
      this.graph = new Graph('commitGraph', this.config);
      this.tableElem = document.getElementById('commitTable');
      this.footerElem = document.getElementById('footer');
      this.repoDropdown = new Dropdown('repoSelect', true, 'Repos', function(value) {
        _this.currentRepo = value;
        _this.maxCommits = _this.config.initialLoadCommits;
        _this.expandedCommit = null;
        _this.currentBranch = null;
        _this.saveState();
        _this.refresh(true);
      });
      this.branchDropdown = new Dropdown('branchSelect', false, 'Branches', function(value) {
        _this.currentBranch = value;
        _this.maxCommits = _this.config.initialLoadCommits;
        _this.expandedCommit = null;
        _this.saveState();
        _this.renderShowLoading();
        _this.requestLoadCommits(true, function() {});
      });
      this.showRemoteBranchesElem = document.getElementById('showRemoteBranchesCheckbox');
      this.showRemoteBranchesElem.addEventListener('change', function() {
        _this.showRemoteBranches = _this.showRemoteBranchesElem.checked;
        _this.saveState();
        _this.refresh(true);
      });
      this.scrollShadowElem = document.getElementById('scrollShadow');
      document.getElementById('refreshBtn').addEventListener('click', function() {
        _this.refresh(true);
      });
      this.observeWindowSizeChanges();
      this.observeWebviewStyleChanges();
      this.observeWebviewScroll();
      this.renderShowLoading();
      if (prevState) {
        this.currentBranch = prevState.currentBranch;
        this.showRemoteBranches = prevState.showRemoteBranches;
        this.showRemoteBranchesElem.checked = this.showRemoteBranches;
        if (typeof this.gitRepos[prevState.currentRepo] !== 'undefined') {
          this.currentRepo = prevState.currentRepo;
          this.maxCommits = prevState.maxCommits;
          this.expandedCommit = prevState.expandedCommit;
          this.avatars = prevState.avatars;
          this.loadBranches(prevState.gitBranches, prevState.gitBranchHead, true, true);
          this.loadCommits(prevState.commits, prevState.commitHead, prevState.moreCommitsAvailable, true);
        }
      }
      this.loadRepos(this.gitRepos, lastActiveRepo);
      this.requestLoadBranchesAndCommits(false);
    }

    loadRepos(repos, lastActiveRepo) {
      this.gitRepos = repos;
      this.saveState();
      var repoPaths = Object.keys(repos),
        changedRepo = false;
      if (typeof repos[this.currentRepo] === 'undefined') {
        this.currentRepo =
          lastActiveRepo !== null && typeof repos[lastActiveRepo] !== 'undefined' ? lastActiveRepo : repoPaths[0];
        this.saveState();
        changedRepo = true;
      }
      var options = [],
        repoComps,
        i;
      for (i = 0; i < repoPaths.length; i++) {
        repoComps = repoPaths[i].split('/');
        options.push({
          name: repoComps[repoComps.length - 1],
          value: repoPaths[i],
        });
      }
      document.getElementById('repoControl').style.display = repoPaths.length > 1 ? 'inline' : 'none';
      this.repoDropdown.setOptions(options, this.currentRepo);
      if (changedRepo) {
        this.refresh(true);
      }
    }

    loadBranches(branchOptions, branchHead, hard, isRepo) {
      if (!isRepo) {
        this.triggerLoadBranchesCallback(false, isRepo);
        return;
      }
      if (
        !hard &&
        arraysEqual(this.gitBranches, branchOptions, function(a, b) {
          return a === b;
        }) &&
        this.gitBranchHead === branchHead
      ) {
        this.triggerLoadBranchesCallback(false, isRepo);
        return;
      }
      this.gitBranches = branchOptions;
      this.gitBranchHead = branchHead;
      if (
        this.currentBranch === null ||
        (this.currentBranch !== '' && this.gitBranches.indexOf(this.currentBranch) === -1)
      ) {
        this.currentBranch =
          this.config.showCurrentBranchByDefault && this.gitBranchHead !== null ? this.gitBranchHead : '';
      }
      this.saveState();
      var options = [
        {
          name: 'Show All',
          value: '',
        },
      ];
      for (var i = 0; i < this.gitBranches.length; i++) {
        options.push({
          name: this.gitBranches[i].indexOf('remotes/') === 0 ? this.gitBranches[i].substring(8) : this.gitBranches[i],
          value: this.gitBranches[i],
        });
      }
      this.branchDropdown.setOptions(options, this.currentBranch);
      this.triggerLoadBranchesCallback(true, isRepo);
    }

    triggerLoadBranchesCallback(changes, isRepo) {
      if (this.loadBranchesCallback !== null) {
        this.loadBranchesCallback(changes, isRepo);
        this.loadBranchesCallback = null;
      }
    }

    loadCommits(commits, commitHead, moreAvailable, hard) {
      if (
        !hard &&
        this.moreCommitsAvailable === moreAvailable &&
        this.commitHead === commitHead &&
        arraysEqual(this.commits, commits, function(a, b) {
          return (
            a.hash === b.hash &&
            arraysEqual(a.refs, b.refs, function(a, b) {
              return a.name === b.name && a.type === b.type;
            }) &&
            arraysEqual(a.parentHashes, b.parentHashes, function(a, b) {
              return a === b;
            })
          );
        })
      ) {
        if (this.commits.length > 0 && this.commits[0].hash === '*') {
          this.commits[0] = commits[0];
          this.saveState();
          this.renderUncommitedChanges();
        }
        this.triggerLoadCommitsCallback(false);
        return;
      }
      this.moreCommitsAvailable = moreAvailable;
      this.commits = commits;
      this.commitHead = commitHead;
      this.commitLookup = {};
      this.saveState();
      var i,
        expandedCommitVisible = false,
        avatarsNeeded = {};
      for (i = 0; i < this.commits.length; i++) {
        this.commitLookup[this.commits[i].hash] = i;
        if (this.expandedCommit !== null && this.expandedCommit.hash === this.commits[i].hash) {
          expandedCommitVisible = true;
        }
        if (
          this.config.fetchAvatars &&
          typeof this.avatars[this.commits[i].email] !== 'string' &&
          this.commits[i].email !== ''
        ) {
          if (typeof avatarsNeeded[this.commits[i].email] === 'undefined') {
            avatarsNeeded[this.commits[i].email] = [this.commits[i].hash];
          } else {
            avatarsNeeded[this.commits[i].email].push(this.commits[i].hash);
          }
        }
      }
      this.graph.loadCommits(this.commits, this.commitHead, this.commitLookup);
      if (this.expandedCommit !== null && !expandedCommitVisible) {
        this.expandedCommit = null;
        this.saveState();
      }
      this.render();
      this.triggerLoadCommitsCallback(true);
      this.fetchAvatars(avatarsNeeded);
    }

    triggerLoadCommitsCallback(changes) {
      if (this.loadCommitsCallback !== null) {
        this.loadCommitsCallback(changes);
        this.loadCommitsCallback = null;
      }
    }

    loadAvatar(email, image) {
      this.avatars[email] = image;
      this.saveState();
      var avatarsElems = document.getElementsByClassName('avatar'),
        escapedEmail = escapeHtml(email);
      for (var i = 0; i < avatarsElems.length; i++) {
        if (avatarsElems[i].dataset.email === escapedEmail) {
          avatarsElems[i].innerHTML = '<img class="avatarImg" src="' + image + '">';
        }
      }
    }

    refresh(hard) {
      if (hard) {
        if (this.expandedCommit !== null) {
          this.expandedCommit = null;
          this.saveState();
        }
        this.renderShowLoading();
      }
      this.requestLoadBranchesAndCommits(hard);
    }

    requestLoadBranches(hard, loadedCallback) {
      if (this.loadBranchesCallback !== null) {
        return;
      }
      this.loadBranchesCallback = loadedCallback;
      sendMessage({
        command: 'loadBranches',
        repo: this.currentRepo,
        showRemoteBranches: this.showRemoteBranches,
        hard: hard,
      });
    }

    requestLoadCommits(hard, loadedCallback) {
      if (this.loadCommitsCallback !== null) {
        return;
      }
      this.loadCommitsCallback = loadedCallback;
      sendMessage({
        command: 'loadCommits',
        repo: this.currentRepo,
        branchName: this.currentBranch !== null ? this.currentBranch : '',
        maxCommits: this.maxCommits,
        showRemoteBranches: this.showRemoteBranches,
        hard: hard,
      });
    }

    requestLoadBranchesAndCommits(hard) {
      var _this = this;
      this.requestLoadBranches(hard, function(branchChanges, isRepo) {
        if (isRepo) {
          _this.requestLoadCommits(hard, function(commitChanges) {
            if (!hard && (branchChanges || commitChanges)) {
              hideDialogAndContextMenu();
            }
          });
        } else {
          sendMessage({
            command: 'loadRepos',
            check: true,
          });
        }
      });
    }

    fetchAvatars(avatars) {
      var emails = Object.keys(avatars);
      for (var i = 0; i < emails.length; i++) {
        sendMessage({
          command: 'fetchAvatar',
          repo: this.currentRepo,
          email: emails[i],
          commits: avatars[emails[i]],
        });
      }
    }

    saveState() {
      vscode.setState({
        gitRepos: this.gitRepos,
        gitBranches: this.gitBranches,
        gitBranchHead: this.gitBranchHead,
        commits: this.commits,
        commitHead: this.commitHead,
        avatars: this.avatars,
        currentBranch: this.currentBranch,
        currentRepo: this.currentRepo,
        moreCommitsAvailable: this.moreCommitsAvailable,
        maxCommits: this.maxCommits,
        showRemoteBranches: this.showRemoteBranches,
        expandedCommit: this.expandedCommit,
      });
    }

    render() {
      this.renderTable();
      this.renderGraph();
    }

    renderGraph() {
      var colHeadersElem = document.getElementById('tableColHeaders');
      if (colHeadersElem === null) {
        return;
      }
      const headerHeight = colHeadersElem.clientHeight + 1;
      const expandedCommitElem = this.expandedCommit !== null ? document.getElementById('commitDetails') : null;
      this.config.grid.expandY =
        expandedCommitElem !== null ? expandedCommitElem.getBoundingClientRect().height : this.config.grid.expandY;
      this.config.grid.y =
        this.commits.length > 0
          ? (this.tableElem.children[0].clientHeight -
              headerHeight -
              (this.expandedCommit !== null ? this.config.grid.expandY : 0)) /
            this.commits.length
          : this.config.grid.y;
      this.config.grid.offsetY = headerHeight + this.config.grid.y / 2;
      this.graph.render();
    }

    renderTable() {
      var _this = this;
      var html = `
        <thead>
          <tr id="tableColHeaders">
            <th id="tableHeaderGraphCol" class="tableColHeader">Graph</th>
            <th class="tableColHeader">Description</th>
            <th class="tableColHeader">Date</th>
            <th class="tableColHeader">Author</th>
            <th class="tableColHeader">Commit</th>
          </tr>
        </thead>
        <tbody>`,
        i,
        currentHash = this.commits.length > 0 && this.commits[0].hash === '*' ? '*' : this.commitHead;
      for (i = 0; i < this.commits.length; i++) {
        var refs = '',
          message = escapeHtml(this.commits[i].message),
          date = getCommitDate(this.commits[i].date),
          j = void 0,
          refName = void 0,
          refActive = void 0,
          refHtml = void 0;
        for (j = 0; j < this.commits[i].refs.length; j++) {
          refName = escapeHtml(this.commits[i].refs[j].name);
          refActive = this.commits[i].refs[j].type === 'head' && this.commits[i].refs[j].name === this.gitBranchHead;
          refHtml =
            '<span class="gitRef ' +
            this.commits[i].refs[j].type +
            (refActive ? ' active' : '') +
            '" data-name="' +
            refName +
            '">' +
            (this.commits[i].refs[j].type === 'tag' ? svgIcons.tag : svgIcons.branch) +
            refName +
            '</span>';
          refs = refActive ? refHtml + refs : refs + refHtml;
        }
        html +=
          '<tr class="commit" data-hash="' +
          this.commits[i].hash +
          '"' +
          ' data-id="' +
          i +
          '" data-color="' +
          this.graph.getVertexColour(i) +
          '"><td></td><td>' +
          refs +
          (this.commits[i].hash === currentHash ? '<b>' + message + '</b>' : message) +
          '</td><td title="' +
          date.title +
          '">' +
          date.value +
          '</td><td title="' +
          escapeHtml(this.commits[i].author + ' <' + this.commits[i].email + '>') +
          '">' +
          (this.config.fetchAvatars
            ? '<span class="avatar" data-email="' +
              escapeHtml(this.commits[i].email) +
              '">' +
              (typeof this.avatars[this.commits[i].email] === 'string'
                ? '<img class="avatarImg" src="' + this.avatars[this.commits[i].email] + '">'
                : '') +
              '</span>'
            : '') +
          escapeHtml(this.commits[i].author) +
          '</td><td title="' +
          escapeHtml(this.commits[i].hash) +
          '">' +
          abbrevCommit(this.commits[i].hash) +
          '</td></tr>';
      }
      this.tableElem.innerHTML = '<table>' + html + '</tbody></table>';
      this.footerElem.innerHTML = this.moreCommitsAvailable
        ? '<div id="loadMoreCommitsBtn" class="roundedBtn">Load More Commits</div>'
        : '';
      this.makeTableResizable();
      if (this.moreCommitsAvailable) {
        document.getElementById('loadMoreCommitsBtn').addEventListener('click', function() {
          document.getElementById('loadMoreCommitsBtn').parentNode.innerHTML =
            '<h2 id="loadingHeader">' + svgIcons.loading + 'Loading ...</h2>';
          _this.maxCommits += _this.config.loadMoreCommits;
          _this.hideCommitDetails();
          _this.saveState();
          _this.requestLoadCommits(true, function() {});
        });
      }
      if (this.expandedCommit !== null) {
        var elem = null,
          elems = document.getElementsByClassName('commit');
        for (i = 0; i < elems.length; i++) {
          if (this.expandedCommit.hash === elems[i].dataset.hash) {
            elem = elems[i];
            break;
          }
        }
        if (elem === null) {
          this.expandedCommit = null;
          this.saveState();
        } else {
          this.expandedCommit.id = parseInt(elem.dataset.id);
          this.expandedCommit.srcElem = elem;
          this.saveState();
          if (this.expandedCommit.commitDetails !== null && this.expandedCommit.fileTree !== null) {
            this.showCommitDetails(this.expandedCommit.commitDetails, this.expandedCommit.fileTree);
          } else {
            this.loadCommitDetails(elem);
          }
        }
      }
      addListenerToClass('commit', 'contextmenu', function(e) {
        e.stopPropagation();
        var sourceElem = e.target.closest('.commit');
        var hash = sourceElem.dataset.hash;
        showContextMenu(
          e,
          [
            {
              title: 'Add Tag',
              onClick: function() {
                showFormDialog(
                  'Add tag to commit <b><i>' + abbrevCommit(hash) + '</i></b>:',
                  [
                    {
                      type: 'text-ref',
                      name: 'Name: ',
                      default: '',
                    },
                    {
                      type: 'select',
                      name: 'Type: ',
                      default: 'annotated',
                      options: [
                        {
                          name: 'Annotated',
                          value: 'annotated',
                        },
                        {
                          name: 'Lightweight',
                          value: 'lightweight',
                        },
                      ],
                    },
                    {
                      type: 'text',
                      name: 'Message: ',
                      default: '',
                      placeholder: 'Optional',
                    },
                  ],
                  'Add Tag',
                  function(values) {
                    sendMessage({
                      command: 'addTag',
                      repo: _this.currentRepo,
                      tagName: values[0],
                      commitHash: hash,
                      lightweight: values[1] === 'lightweight',
                      message: values[2],
                    });
                  },
                  sourceElem
                );
              },
            },
            {
              title: 'Create Branch',
              onClick: function() {
                showRefInputDialog(
                  'Enter the name of the branch you would like to create from commit <b><i>' +
                    abbrevCommit(hash) +
                    '</i></b>:',
                  '',
                  'Create Branch',
                  function(name) {
                    sendMessage({
                      command: 'createBranch',
                      repo: _this.currentRepo,
                      branchName: name,
                      commitHash: hash,
                    });
                  },
                  sourceElem
                );
              },
            },
            null,
            {
              title: 'Checkout',
              onClick: function() {
                showConfirmationDialog(
                  'Are you sure you want to checkout commit <b><i>' +
                    abbrevCommit(hash) +
                    "</i></b>? This will result in a 'detached HEAD' state.",
                  function() {
                    sendMessage({
                      command: 'checkoutCommit',
                      repo: _this.currentRepo,
                      commitHash: hash,
                    });
                  },
                  sourceElem
                );
              },
            },
            {
              title: 'Cherry Pick',
              onClick: function() {
                if (_this.commits[_this.commitLookup[hash]].parentHashes.length === 1) {
                  showConfirmationDialog(
                    'Are you sure you want to cherry pick commit <b><i>' + abbrevCommit(hash) + '</i></b>?',
                    function() {
                      sendMessage({
                        command: 'cherrypickCommit',
                        repo: _this.currentRepo,
                        commitHash: hash,
                        parentIndex: 0,
                      });
                    },
                    sourceElem
                  );
                } else {
                  var options = _this.commits[_this.commitLookup[hash]].parentHashes.map(function(hash, index) {
                    return {
                      name:
                        abbrevCommit(hash) +
                        (typeof _this.commitLookup[hash] === 'number'
                          ? ': ' + _this.commits[_this.commitLookup[hash]].message
                          : ''),
                      value: (index + 1).toString(),
                    };
                  });
                  showSelectDialog(
                    'Are you sure you want to cherry pick merge commit <b><i>' +
                      abbrevCommit(hash) +
                      '</i></b>? Choose the parent hash on the main branch, to cherry pick the commit relative to:',
                    '1',
                    options,
                    'Yes, cherry pick commit',
                    function(parentIndex) {
                      sendMessage({
                        command: 'cherrypickCommit',
                        repo: _this.currentRepo,
                        commitHash: hash,
                        parentIndex: parseInt(parentIndex),
                      });
                    },
                    sourceElem
                  );
                }
              },
            },
            {
              title: 'Revert',
              onClick: function() {
                if (_this.commits[_this.commitLookup[hash]].parentHashes.length === 1) {
                  showConfirmationDialog(
                    'Are you sure you want to revert commit <b><i>' + abbrevCommit(hash) + '</i></b>?',
                    function() {
                      sendMessage({
                        command: 'revertCommit',
                        repo: _this.currentRepo,
                        commitHash: hash,
                        parentIndex: 0,
                      });
                    },
                    sourceElem
                  );
                } else {
                  var options = _this.commits[_this.commitLookup[hash]].parentHashes.map(function(hash, index) {
                    return {
                      name:
                        abbrevCommit(hash) +
                        (typeof _this.commitLookup[hash] === 'number'
                          ? ': ' + _this.commits[_this.commitLookup[hash]].message
                          : ''),
                      value: (index + 1).toString(),
                    };
                  });
                  showSelectDialog(
                    'Are you sure you want to revert merge commit <b><i>' +
                      abbrevCommit(hash) +
                      '</i></b>? Choose the parent hash on the main branch, to revert the commit relative to:',
                    '1',
                    options,
                    'Yes, revert commit',
                    function(parentIndex) {
                      sendMessage({
                        command: 'revertCommit',
                        repo: _this.currentRepo,
                        commitHash: hash,
                        parentIndex: parseInt(parentIndex),
                      });
                    },
                    sourceElem
                  );
                }
              },
            },
            null,
            {
              title: 'Merge into current branch',
              onClick: function() {
                showCheckboxDialog(
                  'Are you sure you want to merge commit <b><i>' +
                    abbrevCommit(hash) +
                    '</i></b> into the current branch?',
                  'Create a new commit even if fast-forward is possible',
                  true,
                  'Yes, merge',
                  function(createNewCommit) {
                    sendMessage({
                      command: 'mergeCommit',
                      repo: _this.currentRepo,
                      commitHash: hash,
                      createNewCommit: createNewCommit,
                    });
                  },
                  null
                );
              },
            },
            {
              title: 'Reset current branch to this Commit',
              onClick: function() {
                showSelectDialog(
                  'Are you sure you want to reset the <b>current branch</b> to commit <b><i>' +
                    abbrevCommit(hash) +
                    '</i></b>?',
                  'mixed',
                  [
                    {
                      name: 'Soft - Keep all changes, but reset head',
                      value: 'soft',
                    },
                    {
                      name: 'Mixed - Keep working tree, but reset index',
                      value: 'mixed',
                    },
                    {
                      name: 'Hard - Discard all changes',
                      value: 'hard',
                    },
                  ],
                  'Yes, reset',
                  function(mode) {
                    sendMessage({
                      command: 'resetToCommit',
                      repo: _this.currentRepo,
                      commitHash: hash,
                      resetMode: mode,
                    });
                  },
                  sourceElem
                );
              },
            },
            null,
            {
              title: 'Copy Commit Hash to Clipboard',
              onClick: function() {
                sendMessage({
                  command: 'copyToClipboard',
                  type: 'Commit Hash',
                  data: hash,
                });
              },
            },
          ],
          sourceElem
        );
      });
      addListenerToClass('commit', 'click', function(e) {
        var sourceElem = e.target.closest('.commit');
        if (_this.expandedCommit !== null && _this.expandedCommit.hash === sourceElem.dataset.hash) {
          // _this.hideCommitDetails();
        } else {
          if (sourceElem.dataset.hash === '*') {
            _this.loadUncommittedChanges();
          } else {
            _this.loadCommitDetails(sourceElem);
          }
        }
      });
      addListenerToClass('gitRef', 'contextmenu', function(e) {
        e.stopPropagation();
        var sourceElem = e.target.closest('.gitRef');
        var refName = unescapeHtml(sourceElem.dataset.name),
          menu,
          copyType;
        console.log(sourceElem);
        console.log(refName);
        if (sourceElem.classList.contains('tag')) {
          menu = [
            {
              title: 'Delete Tag',
              onClick: function() {
                showConfirmationDialog(
                  'Are you sure you want to delete the tag <b><i>' + escapeHtml(refName) + '</i></b>?',
                  function() {
                    sendMessage({
                      command: 'deleteTag',
                      repo: _this.currentRepo,
                      tagName: refName,
                    });
                  },
                  null
                );
              },
            },
            {
              title: 'Push Tag',
              onClick: function() {
                showConfirmationDialog(
                  'Are you sure you want to push the tag <b><i>' + escapeHtml(refName) + '</i></b>?',
                  function() {
                    sendMessage({
                      command: 'pushTag',
                      repo: _this.currentRepo,
                      tagName: refName,
                    });
                    showActionRunningDialog('Pushing Tag');
                  },
                  null
                );
              },
            },
          ];
          copyType = 'Tag Name';
        } else {
          if (sourceElem.classList.contains('head')) {
            menu = [];
            if (_this.gitBranchHead !== refName) {
              menu.push({
                title: 'Checkout Branch',
                onClick: function() {
                  return _this.checkoutBranchAction(sourceElem, refName);
                },
              });
            }
            menu.push({
              title: 'Rename Branch',
              onClick: function() {
                showRefInputDialog(
                  'Enter the new name for branch <b><i>' + escapeHtml(refName) + '</i></b>:',
                  refName,
                  'Rename Branch',
                  function(newName) {
                    sendMessage({
                      command: 'renameBranch',
                      repo: _this.currentRepo,
                      oldName: refName,
                      newName: newName,
                    });
                  },
                  null
                );
              },
            });
            if (_this.gitBranchHead !== refName) {
              menu.push(
                {
                  title: 'Delete Branch',
                  onClick: function() {
                    showCheckboxDialog(
                      'Are you sure you want to delete the branch <b><i>' + escapeHtml(refName) + '</i></b>?',
                      'Force Delete',
                      false,
                      'Delete Branch',
                      function(forceDelete) {
                        sendMessage({
                          command: 'deleteBranch',
                          repo: _this.currentRepo,
                          branchName: refName,
                          forceDelete: forceDelete,
                        });
                      },
                      null
                    );
                  },
                },
                {
                  title: 'Merge into current branch',
                  onClick: function() {
                    showCheckboxDialog(
                      'Are you sure you want to merge branch <b><i>' +
                        escapeHtml(refName) +
                        '</i></b> into the current branch?',
                      'Create a new commit even if fast-forward is possible',
                      true,
                      'Yes, merge',
                      function(createNewCommit) {
                        sendMessage({
                          command: 'mergeBranch',
                          repo: _this.currentRepo,
                          branchName: refName,
                          createNewCommit: createNewCommit,
                        });
                      },
                      null
                    );
                  },
                }
              );
            }
          } else {
            menu = [
              {
                title: 'Checkout Branch',
                onClick: function() {
                  return _this.checkoutBranchAction(sourceElem, refName);
                },
              },
            ];
          }
          copyType = 'Branch Name';
        }
        menu.push(null, {
          title: 'Copy ' + copyType + ' to Clipboard',
          onClick: function() {
            sendMessage({
              command: 'copyToClipboard',
              type: copyType,
              data: refName,
            });
          },
        });
        showContextMenu(e, menu, sourceElem);
      });
      addListenerToClass('gitRef', 'dblclick', function(e) {
        e.stopPropagation();
        hideDialogAndContextMenu();
        var sourceElem = e.target.closest('.gitRef');
        _this.checkoutBranchAction(sourceElem, unescapeHtml(sourceElem.dataset.name));
      });
    }

    renderUncommitedChanges() {
      var date = getCommitDate(this.commits[0].date);
      document.getElementsByClassName('unsavedChanges')[0].innerHTML =
        '<td></td><td><b>' +
        escapeHtml(this.commits[0].message) +
        '</b></td><td title="' +
        date.title +
        '">' +
        date.value +
        '</td><td title="* <>">*</td><td title="*">*</td>';
    }

    renderShowLoading() {
      hideDialogAndContextMenu();
      this.graph.clear();
      this.tableElem.innerHTML = '<h2 id="loadingHeader">' + svgIcons.loading + 'Loading ...</h2>';
      this.footerElem.innerHTML = '';
    }

    checkoutBranchAction(sourceElem, refName) {
      var _this = this;
      if (sourceElem.classList.contains('head')) {
        sendMessage({
          command: 'checkoutBranch',
          repo: this.currentRepo,
          branchName: refName,
          remoteBranch: null,
        });
      } else if (sourceElem.classList.contains('remote')) {
        var refNameComps = refName.split('/');
        showRefInputDialog(
          'Enter the name of the new branch you would like to create when checking out <b><i>' +
            escapeHtml(sourceElem.dataset.name) +
            '</i></b>:',
          refNameComps[refNameComps.length - 1],
          'Checkout Branch',
          function(newBranch) {
            sendMessage({
              command: 'checkoutBranch',
              repo: _this.currentRepo,
              branchName: newBranch,
              remoteBranch: refName,
            });
          },
          null
        );
      }
    }

    makeTableResizable() {
      var _this = this;
      var colHeadersElem = document.getElementById('tableColHeaders'),
        cols = document.getElementsByClassName('tableColHeader');
      var columnWidths = this.gitRepos[this.currentRepo].columnWidths,
        mouseX = -1,
        col = -1,
        that = this;
      for (var i = 0; i < cols.length; i++) {
        cols[i].innerHTML +=
          (i > 0 ? '<span class="resizeCol left" data-col="' + (i - 1) + '"></span>' : '') +
          (i < cols.length - 1 ? '<span class="resizeCol right" data-col="' + i + '"></span>' : '');
      }
      if (columnWidths !== null) {
        makeTableFixedLayout();
      } else {
        this.tableElem.className = 'autoLayout';
        this.graph.limitMaxWidth(-1);
        cols[0].style.padding =
          '0 ' + Math.round((Math.max(this.graph.getWidth() + 16, 64) - (cols[0].offsetWidth - 24)) / 2) + 'px';
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
              _this.graph.limitMaxWidth(columnWidths[0] + 16);
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
          that.gitRepos[that.currentRepo].columnWidths = columnWidths;
          sendMessage({
            command: 'saveRepoState',
            repo: that.currentRepo,
            state: that.gitRepos[that.currentRepo],
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
          that.tableElem.className = 'fixedLayout';
          that.graph.limitMaxWidth(columnWidths[0] + 16);
        }
      }
    }

    observeWindowSizeChanges() {
      var _this = this;
      var windowWidth = window.outerWidth,
        windowHeight = window.outerHeight;
      window.addEventListener('resize', function() {
        if (windowWidth === window.outerWidth && windowHeight === window.outerHeight) {
          _this.renderGraph();
        } else {
          windowWidth = window.outerWidth;
          windowHeight = window.outerHeight;
        }
      });
    }

    observeWebviewStyleChanges() {
      var _this = this;
      var fontFamily = getVSCodeStyle('--vscode-editor-font-family');
      new MutationObserver(function() {
        var ff = getVSCodeStyle('--vscode-editor-font-family');
        if (ff !== fontFamily) {
          fontFamily = ff;
          _this.repoDropdown.refresh();
          _this.branchDropdown.refresh();
        }
      }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style'],
      });
    }

    observeWebviewScroll() {
      var _this = this;
      var active = window.scrollY > 0;
      this.scrollShadowElem.className = active ? 'active' : '';
      document.addEventListener('scroll', function() {
        if (active !== window.scrollY > 0) {
          active = window.scrollY > 0;
          _this.scrollShadowElem.className = active ? 'active' : '';
        }
      });
    }

    loadUncommittedChanges() {
      console.log(JSON.stringify(this.commits[0])); //const unsavedChanges = this.getGitUnsavedChanges(repo);
    }

    loadCommitDetails(sourceElem) {
      this.hideCommitDetails();
      this.expandedCommit = {
        id: parseInt(sourceElem.dataset.id),
        hash: sourceElem.dataset.hash,
        commitDetails: null,
        fileTree: null,
      };
      this.saveState();
      sendMessage({
        command: 'commitDetails',
        repo: this.currentRepo,
        commitHash: sourceElem.dataset.hash,
      });
    }

    hideCommitDetails() {
      if (this.expandedCommit !== null) {
        var elem = document.getElementById('commitDetails');
        emptyElement(elem);
        this.expandedCommit = null;
        this.saveState();
        this.renderGraph();
      }
    }

    showCommitDetails(commitDetails, fileTree) {
      const commitView = new CommitView(commitDetails, fileTree, this.expandedCommit, this.avatars);
      var elem = document.getElementById('commitDetails');
      emptyElement(elem);
      this.saveState();

      elem.innerHTML = commitView.render();
      console.log(commitView.render());

      // let html = '<div><div id="commitDetailsSummary">';
      // html +=
      //   '<span class="commitDetailsSummaryTop' +
      //   (typeof this.avatars[commitDetails.email] === 'string' ? ' withAvatar' : '') +
      //   '">';
      // html += '<span class="commitDetailsSummaryTopRow"><span class="commitDetailsSummaryKeyValues">';
      // html += '<b>Commit: </b>' + escapeHtml(commitDetails.hash) + '<br>';
      // html += '<b>Parents: </b>' + commitDetails.parents.join(', ') + '<br>';
      // html +=
      //   '<b>Author: </b>' + escapeHtml(commitDetails.author) + ' &lt;' + escapeHtml(commitDetails.email) + '&gt;<br>';
      // html += '<b>Date: </b>' + new Date(commitDetails.date * 1e3).toString() + '<br>';
      // html += '<b>Committer: </b>' + escapeHtml(commitDetails.committer) + '</span>';
      // if (typeof this.avatars[commitDetails.email] === 'string') {
      //   html += '<span class="commitDetailsSummaryAvatar"><img src="' + this.avatars[commitDetails.email] + '"></span>';
      // }
      // html += '</span></span><br><br>';
      // html += escapeHtml(commitDetails.body).replace(/\n/g, '<br>') + '</div>';
      // html += '<div id="commitDetailsFiles">' + new GitFileTreeView(fileTree, commitDetails.fileChanges).render() + '</div>';
      // html += '<div id="commitDetailsClose">' + svgIcons.close + '</div>';
      // html += '</div>';
      // elem.innerHTML = html;
      // console.log(html);

      this.renderGraph();

      // var _this = this;
      // document.getElementById('commitDetailsClose').addEventListener('click', function() {
      //   _this.hideCommitDetails();
      // });
      // addListenerToClass('gitFolder', 'click', function(e) {
      //   var sourceElem = e.target.closest('.gitFolder');
      //   var parent = sourceElem.parentElement;
      //   parent.classList.toggle('closed');
      //   var isOpen = !parent.classList.contains('closed');
      //   parent.children[0].children[0].innerHTML = isOpen ? svgIcons.openFolder : svgIcons.closedFolder;
      //   parent.children[1].classList.toggle('hidden');
      //   alterGitFileTree(_this.expandedCommit.fileTree, decodeURIComponent(sourceElem.dataset.folderpath), isOpen);
      //   _this.saveState();
      // });
      // addListenerToClass('gitFile', 'click', function(e) {
      //   var sourceElem = e.target.closest('.gitFile');
      //   if (_this.expandedCommit === null || !sourceElem.classList.contains('gitDiffPossible')) {
      //     return;
      //   }
      //   sendMessage({
      //     command: 'viewDiff',
      //     repo: _this.currentRepo,
      //     commitHash: _this.expandedCommit.hash,
      //     oldFilePath: decodeURIComponent(sourceElem.dataset.oldfilepath),
      //     newFilePath: decodeURIComponent(sourceElem.dataset.newfilepath),
      //     type: sourceElem.dataset.type,
      //   });
      // });
    }
  }

  var contextMenu = document.getElementById('contextMenu'),
    contextMenuSource = null;
  var dialog = document.getElementById('dialog'),
    dialogBacking = document.getElementById('dialogBacking'),
    dialogMenuSource = null;
  var gitGraph = new GitGraphView(
    viewState.repos,
    viewState.lastActiveRepo,
    {
      autoCenterCommitDetailsView: viewState.autoCenterCommitDetailsView,
      fetchAvatars: viewState.fetchAvatars,
      graphColours: viewState.graphColours,
      graphStyle: viewState.graphStyle,
      grid: {
        x: 16,
        y: 24,
        offsetX: 8,
        offsetY: 12,
        expandY: 250,
      },
      initialLoadCommits: viewState.initialLoadCommits,
      loadMoreCommits: viewState.loadMoreCommits,
      showCurrentBranchByDefault: viewState.showCurrentBranchByDefault,
    },
    vscode.getState()
  );
  window.addEventListener('message', function(event) {
    var msg = event.data;
    switch (msg.command) {
      case 'addTag':
        refreshGraphOrDisplayError(msg.status, 'Unable to Add Tag');
        break;

      case 'checkoutBranch':
        refreshGraphOrDisplayError(msg.status, 'Unable to Checkout Branch');
        break;

      case 'checkoutCommit':
        refreshGraphOrDisplayError(msg.status, 'Unable to Checkout Commit');
        break;

      case 'cherrypickCommit':
        refreshGraphOrDisplayError(msg.status, 'Unable to Cherry Pick Commit');
        break;

      case 'commitDetails':
        if (msg.commitDetails === null) {
          gitGraph.hideCommitDetails();
          showErrorDialog('Unable to load commit details', null, null);
        } else {
          gitGraph.showCommitDetails(msg.commitDetails, generateGitFileTree(msg.commitDetails.fileChanges));
        }
        break;

      case 'copyToClipboard':
        if (msg.success === false) {
          showErrorDialog('Unable to Copy ' + msg.type + ' to Clipboard', null, null);
        }
        break;

      case 'createBranch':
        refreshGraphOrDisplayError(msg.status, 'Unable to Create Branch');
        break;

      case 'deleteBranch':
        refreshGraphOrDisplayError(msg.status, 'Unable to Delete Branch');
        break;

      case 'deleteTag':
        refreshGraphOrDisplayError(msg.status, 'Unable to Delete Tag');
        break;

      case 'fetchAvatar':
        gitGraph.loadAvatar(msg.email, msg.image);
        break;

      case 'loadBranches':
        gitGraph.loadBranches(msg.branches, msg.head, msg.hard, msg.isRepo);
        break;

      case 'loadCommits':
        gitGraph.loadCommits(msg.commits, msg.head, msg.moreCommitsAvailable, msg.hard);
        break;

      case 'loadRepos':
        gitGraph.loadRepos(msg.repos, msg.lastActiveRepo);
        break;

      case 'mergeBranch':
        refreshGraphOrDisplayError(msg.status, 'Unable to Merge Branch');
        break;

      case 'mergeCommit':
        refreshGraphOrDisplayError(msg.status, 'Unable to Merge Commit');
        break;

      case 'pushTag':
        refreshGraphOrDisplayError(msg.status, 'Unable to Push Tag');
        break;

      case 'renameBranch':
        refreshGraphOrDisplayError(msg.status, 'Unable to Rename Branch');
        break;

      case 'refresh':
        gitGraph.refresh(false);
        break;

      case 'resetToCommit':
        refreshGraphOrDisplayError(msg.status, 'Unable to Reset to Commit');
        break;

      case 'revertCommit':
        refreshGraphOrDisplayError(msg.status, 'Unable to Revert Commit');
        break;

      case 'viewDiff':
        if (msg.success === false) {
          showErrorDialog('Unable to view diff of file', null, null);
        }
        break;
    }
  });

  function refreshGraphOrDisplayError(status, errorMessage) {
    if (status === null) {
      gitGraph.refresh(true);
    } else {
      showErrorDialog(errorMessage, status, null);
    }
  }

  function getCommitDate(dateVal) {
    var date = new Date(dateVal * 1e3),
      value;
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dateStr = date.getDate() + ' ' + MONTHS[date.getMonth()] + ' ' + date.getFullYear();
    var timeStr = pad2(date.getHours()) + ':' + pad2(date.getMinutes());
    switch (viewState.dateFormat) {
      case 'Date Only':
        value = dateStr;
        break;

      case 'Relative':
        var diff = Math.round(new Date().getTime() / 1e3) - dateVal,
          unit = void 0;
        if (diff < 60) {
          unit = 'second';
        } else if (diff < 3600) {
          unit = 'minute';
          diff /= 60;
        } else if (diff < 86400) {
          unit = 'hour';
          diff /= 3600;
        } else if (diff < 604800) {
          unit = 'day';
          diff /= 86400;
        } else if (diff < 2629800) {
          unit = 'week';
          diff /= 604800;
        } else if (diff < 31557600) {
          unit = 'month';
          diff /= 2629800;
        } else {
          unit = 'year';
          diff /= 31557600;
        }
        diff = Math.round(diff);
        value = diff + ' ' + unit + (diff !== 1 ? 's' : '') + ' ago';
        break;

      default:
        value = dateStr + ' ' + timeStr;
    }
    return {
      title: dateStr + ' ' + timeStr,
      value: value,
    };
  }

  function generateGitFileTree(gitFiles) {
    var contents = {},
      i,
      j,
      path,
      cur;
    var files = {
      type: 'folder',
      name: '',
      folderPath: '',
      contents: contents,
      open: true,
    };
    for (i = 0; i < gitFiles.length; i++) {
      cur = files;
      path = gitFiles[i].newFilePath.split('/');
      for (j = 0; j < path.length; j++) {
        if (j < path.length - 1) {
          if (typeof cur.contents[path[j]] === 'undefined') {
            contents = {};
            cur.contents[path[j]] = {
              type: 'folder',
              name: path[j],
              folderPath: path.slice(0, j + 1).join('/'),
              contents: contents,
              open: true,
            };
          }
          cur = cur.contents[path[j]];
        } else {
          cur.contents[path[j]] = {
            type: 'file',
            name: path[j],
            index: i,
          };
        }
      }
    }
    return files;
  }

  function alterGitFileTree(folder, folderPath, open) {
    var path = folderPath.split('/'),
      i,
      cur = folder;
    for (i = 0; i < path.length; i++) {
      if (typeof cur.contents[path[i]] !== 'undefined') {
        cur = cur.contents[path[i]];
        if (i === path.length - 1) {
          cur.open = open;
          return;
        }
      } else {
        return;
      }
    }
  }

  function abbrevCommit(commitHash) {
    return commitHash.substring(0, 8);
  }

  function showContextMenu(e, items, sourceElem) {
    var html = '',
      i,
      event = e;
    const ELLIPSIS = '&#8230;';
    for (i = 0; i < items.length; i++) {
      html +=
        items[i] !== null
          ? '<li class="contextMenuItem" data-index="' + i + '">' + items[i].title + ELLIPSIS + '</li>'
          : '<li class="contextMenuDivider"></li>';
    }
    hideContextMenuListener();
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
      hideContextMenu();
      items[parseInt(e.target.dataset.index)].onClick();
    });
    contextMenuSource = sourceElem;
    contextMenuSource.classList.add('contextMenuActive');
  }

  function hideContextMenu() {
    contextMenu.className = '';
    contextMenu.innerHTML = '';
    contextMenu.style.left = '0px';
    contextMenu.style.top = '0px';
    if (contextMenuSource !== null) {
      contextMenuSource.classList.remove('contextMenuActive');
      contextMenuSource = null;
    }
  }

  var DIALOG_FORM_ID = 'formDialogForm';

  function showConfirmationDialog(message, confirmed, sourceElem) {
    showDialog(
      message,
      'Yes',
      'No',
      function() {
        hideDialog();
        confirmed();
      },
      sourceElem
    );
  }

  function showRefInputDialog(message, defaultValue, actionName, actioned, sourceElem) {
    showFormDialog(
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

  function showCheckboxDialog(message, checkboxLabel, checkboxValue, actionName, actioned, sourceElem) {
    showFormDialog(
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

  function showSelectDialog(message, defaultValue, options, actionName, actioned, sourceElem) {
    showFormDialog(
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

  function showFormDialog(message, inputs, actionName, actioned, sourceElem) {
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
    showDialog(
      html,
      actionName,
      'Cancel',
      function() {
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
        hideDialog();
        actioned(values);
      },
      sourceElem
    );
    if (textRefInput > -1) {
      var dialogInput_1 = document.getElementById('dialogInput' + textRefInput),
        dialogAction_1 = document.getElementById('dialogAction');
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

  function showErrorDialog(message, reason, sourceElem) {
    showDialog(
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

  function showActionRunningDialog(command) {
    showDialog('<span id="actionRunning">' + svgIcons.loading + command + ' ...</span>', null, 'Dismiss', null, null);
  }

  function showDialog(html, actionName, dismissName, actioned, sourceElem) {
    dialogBacking.className = 'active';
    dialog.className = 'active';
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
    document.getElementById('dialogDismiss').addEventListener('click', hideDialog);
    dialogMenuSource = sourceElem;
    if (dialogMenuSource !== null) {
      dialogMenuSource.classList.add('dialogActive');
    }
  }

  function hideDialog() {
    dialogBacking.className = '';
    dialog.className = '';
    dialog.innerHTML = '';
    if (dialogMenuSource !== null) {
      dialogMenuSource.classList.remove('dialogActive');
      dialogMenuSource = null;
    }
  }

  function hideDialogAndContextMenu() {
    if (dialog.classList.contains('active')) {
      hideDialog();
    }
    if (contextMenu.classList.contains('active')) {
      hideContextMenu();
    }
  }

  document.addEventListener('keyup', function(e) {
    if (e.key === 'Escape') {
      hideDialogAndContextMenu();
    }
  });
  document.addEventListener('click', hideContextMenuListener);
  document.addEventListener('contextmenu', hideContextMenuListener);
  document.addEventListener('mouseleave', hideContextMenuListener);

  function hideContextMenuListener() {
    if (contextMenu.classList.contains('active')) {
      hideContextMenu();
    }
  }
})();
