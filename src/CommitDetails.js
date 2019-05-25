class CommitDetails {
  static get REQUIRED_KEYS() {
    return ['hash', 'parents', 'author', 'email', 'date', 'committer', 'body', 'fileChanges'];
  }

  constructor(data) {
    CommitDetails.REQUIRED_KEYS.forEach(key => {
      if (data[key] == null) {
        throw new Error(`Missing required key for CommitDetails: ${key}`);
      }
    });
    Object.assign(this, {}, data);
  }
}

exports.default = CommitDetails;
