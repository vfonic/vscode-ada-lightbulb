const CommitFileChange = require('./CommitFileChange').default;

class CommitDetailsProcessor {
  constructor(resolve) {
    this.resolve = resolve;
    this.call = this.call.bind(this);
  }

  call(results) {
    const commitDetails = results[0];
    results[1].forEach(line => {
      line = line.split('\t');
      if (line.length < 2) {
        return;
      }
      commitDetails.fileChanges.push(
        new CommitFileChange({
          filePath: line[1],
          newFilePath: line[line.length - 1],
          statusCode: line[0][0],
        })
      );
    });
    this.resolve(commitDetails);
  }
}
exports.default = CommitDetailsProcessor;
