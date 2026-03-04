// @ts-nocheck
import CommitStatusCode from './CommitStatusCode';
import { svgIcons } from './html_utils';

class CommitFileListView {
  constructor(gitFiles) {
    this.gitFiles = gitFiles;
  }

  render() {
    const { gitFiles } = this;
    let html = '<ul class="gitFolderContents">';
    gitFiles.forEach((gitFile, index) => {
      html +=
        '<li class="gitFile' +
        (index === 0 ? ' selected' : '') +
        '" data-filepath="' +
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

export default CommitFileListView;
