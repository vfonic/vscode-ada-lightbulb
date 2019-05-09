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
