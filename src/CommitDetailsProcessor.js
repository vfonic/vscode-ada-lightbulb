const utils_1 = require('./utils');

class CommitDetailsProcessor {
  constructor(resolve) {
    this.resolve = resolve;
    this.call = this.call.bind(this);
  }

  call(results) {
    const details = results[0];
    const fileLookup = {};
    for (let i = 0; i < results[1].length - 1; i++) {
      let line = results[1][i].split('\t');
      if (line.length < 2) {
        break;
      }
      let oldFilePath = utils_1.getPathFromStr(line[1]),
        newFilePath = utils_1.getPathFromStr(line[line.length - 1]);
      fileLookup[newFilePath] = details.fileChanges.length;
      details.fileChanges.push({
        oldFilePath: oldFilePath,
        newFilePath: newFilePath,
        type: line[0][0],
        additions: null,
        deletions: null,
      });
    }
    for (let i = 0; i < results[2].length - 1; i++) {
      let line = results[2][i].split('\t');
      if (line.length !== 3) {
        break;
      }
      let fileName = line[2].replace(/(.*){.* => (.*)}/, '$1$2').replace(/.* => (.*)/, '$1');
      if (typeof fileLookup[fileName] === 'number') {
        details.fileChanges[fileLookup[fileName]].additions = parseInt(line[0]);
        details.fileChanges[fileLookup[fileName]].deletions = parseInt(line[1]);
      }
    }
    this.resolve(details);
  }
}
exports.default = CommitDetailsProcessor;
