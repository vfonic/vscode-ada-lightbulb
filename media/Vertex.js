class Vertex {
  constructor(y) {
    this.x = 0;
    this.parents = [];
    this.nextParent = 0;
    this.onEdge = null;
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

  addToEdge(edge, x) {
    if (this.onEdge == null) {
      this.onEdge = edge;
      this.x = x;
    }
  }

  isNotOnEdge() {
    return this.onEdge == null;
  }

  isOnThisEdge(edge) {
    return this.onEdge === edge;
  }

  getEdge() {
    return this.onEdge;
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

  getPointConnectingTo(vertex, onEdge) {
    for (var i = 0; i < this.connections.length; i++) {
      if (this.connections[i].connectsTo === vertex && this.connections[i].onEdge === onEdge) {
        return {
          x: i,
          y: this.y,
        };
      }
    }
    return null;
  }

  registerUnavailablePoint(x, connectsToVertex, onEdge) {
    if (x === this.nextX) {
      this.nextX = x + 1;
      this.connections[x] = {
        connectsTo: connectsToVertex,
        onEdge: onEdge,
      };
    }
  }

  getColor() {
    return this.onEdge != null ? this.onEdge.getColor() : 0;
  }

  setNotCommited() {
    this.isCommitted = false;
  }

  setCurrent() {
    this.isCurrent = true;
  }

  draw(svg, config) {
    if (this.onEdge == null) {
      return;
    }
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    var color = this.isCommitted ? config.graphColors[this.onEdge.getColor() % config.graphColors.length] : '#808080';
    circle.setAttribute('cx', (this.x * config.grid.x + config.grid.offsetX).toString());
    circle.setAttribute('cy', (this.y * config.grid.y + config.grid.offsetY + 1).toString());
    circle.setAttribute('r', '4');
    if (this.isCurrent) {
      circle.setAttribute('class', 'current');
      circle.setAttribute('stroke', color);
    } else {
      circle.setAttribute('fill', color);
    }
    svg.appendChild(circle);
  }
}
