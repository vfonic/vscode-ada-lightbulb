class CommitFileChange {
  static get REQUIRED_KEYS() {
    return ['filePath', 'newFilePath', 'statusCode'];
  }

  constructor(data) {
    CommitFileChange.REQUIRED_KEYS.forEach(key => {
      if (data[key] == null) {
        throw new Error(`Missing required key for CommitFileChange: ${key}`);
      }
    });
    Object.assign(this, {}, data);
  }
}

exports.default = CommitFileChange;
