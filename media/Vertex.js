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
