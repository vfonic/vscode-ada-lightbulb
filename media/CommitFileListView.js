class CommitFileListView {
  constructor(gitFiles) {
    this.gitFiles = gitFiles;
  }

  render() {
    const { gitFiles } = this;
    var html = '<ul class="gitFolderContents">';
    gitFiles.forEach(gitFile => {
      html +=
        '<li class="gitFile" data-filepath="' +
        encodeURIComponent(gitFile.filePath) +
        '" data-newfilepath="' +
        encodeURIComponent(gitFile.newFilePath) +
        '" data-statuscode="' +
        gitFile.statusCode +
        '"' +
        '><span class="gitFileIcon">' +
        svgIcons.file +
        '</span>' +
        (gitFile.statusCode === CommitStatusCode.RENAMED ? gitFile.newFilePath : gitFile.filePath) +
        '</li>';
    });
    return html + '</ul>';
  }
}
