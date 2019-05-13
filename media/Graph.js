class Graph {
  constructor(id, config) {
    this.svgGroup = null;
    this.maxWidth = -1;
    this.vertices = [];
    this.edges = [];
    this.availableColours = [];
    this.config = config;

    const svgNamespace = 'http://www.w3.org/2000/svg';
    this.svg = document.createElementNS(svgNamespace, 'svg');
    this.setDimensions(0, 0);
    document.getElementById(id).appendChild(this.svg);
  }

  loadCommits(commits, commitHead, commitLookup) {
    this.vertices = [];
    this.edges = [];
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
    this.clear();

    var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.edges.forEach(edge => edge.draw(group, this.config));
    this.vertices.forEach(vertex => vertex.draw(group, this.config));
    this.svgGroup = group;
    this.svg.appendChild(group);

    this.setDimensions(this.getWidth(), this.getHeight());
  }

  clear() {
    emptyElement(this.svg);
    this.setDimensions(0, 0);
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

  setDimensions(width, height) {
    this.svg.setAttribute('width', width.toString());
    this.svg.setAttribute('height', height.toString());
  }

  determinePath(startAt) {
    var i = startAt;
    var vertex = this.vertices[i],
      parentVertex = this.vertices[i].getNextParent();
    var lastPoint = vertex.isNotOnEdge() ? vertex.getNextPoint() : vertex.getPoint(),
      curPoint;
    if (parentVertex !== null && vertex.isMerge() && !vertex.isNotOnEdge() && !parentVertex.isNotOnEdge()) {
      var foundPointToParent = false,
        parentEdge = parentVertex.getEdge();
      for (i = startAt + 1; i < this.vertices.length; i++) {
        curPoint = this.vertices[i].getPointConnectingTo(parentVertex, parentEdge);
        if (curPoint !== null) {
          foundPointToParent = true;
        } else {
          curPoint = this.vertices[i].getNextPoint();
        }
        parentEdge.addLine(
          lastPoint,
          curPoint,
          vertex.getIsCommitted(),
          !foundPointToParent && this.vertices[i] !== parentVertex ? lastPoint.x < curPoint.x : true
        );
        this.vertices[i].registerUnavailablePoint(curPoint.x, parentVertex, parentEdge);
        lastPoint = curPoint;
        if (foundPointToParent) {
          vertex.registerParentProcessed();
          break;
        }
      }
    } else {
      var edge = new Edge(this.getAvailableColour(startAt));
      vertex.addToEdge(edge, lastPoint.x);
      vertex.registerUnavailablePoint(lastPoint.x, vertex, edge);
      for (i = startAt + 1; i < this.vertices.length; i++) {
        curPoint =
          parentVertex === this.vertices[i] && !parentVertex.isNotOnEdge()
            ? this.vertices[i].getPoint()
            : this.vertices[i].getNextPoint();
        edge.addLine(lastPoint, curPoint, vertex.getIsCommitted(), lastPoint.x < curPoint.x);
        this.vertices[i].registerUnavailablePoint(curPoint.x, parentVertex, edge);
        lastPoint = curPoint;
        if (parentVertex === this.vertices[i]) {
          vertex.registerParentProcessed();
          var parentVertexOnEdge = !parentVertex.isNotOnEdge();
          parentVertex.addToEdge(edge, curPoint.x);
          vertex = parentVertex;
          parentVertex = vertex.getNextParent();
          if (parentVertexOnEdge) {
            break;
          }
        }
      }
      edge.setEnd(i);
      this.edges.push(edge);
      this.availableColours[edge.getColour()] = i;
    }
  }

  findStart() {
    for (var i = 0; i < this.vertices.length; i++) {
      if (this.vertices[i].getNextParent() !== null || this.vertices[i].isNotOnEdge()) {
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
