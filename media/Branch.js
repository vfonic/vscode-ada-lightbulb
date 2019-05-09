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
