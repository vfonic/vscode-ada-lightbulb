// @ts-nocheck
import CommitStatusCode from './CommitStatusCode';
import { svgIcons } from './html_utils';

class UncommittedFileListView {
  constructor(unstagedFileChanges, stagedFileChanges) {
    this.unstagedFileChanges = unstagedFileChanges || [];
    this.stagedFileChanges = stagedFileChanges || [];
  }

  render() {
    let html = '';

    html += '<div class="fileSection" data-section="unstaged">';
    html += '<div class="fileSectionHeader">Unstaged Changes (' + this.unstagedFileChanges.length + ')</div>';
    html += '<ul class="gitFolderContents">';
    this.unstagedFileChanges.forEach(gitFile => {
      html += this.renderFileItem(gitFile, 'unstaged');
    });
    html += '</ul></div>';

    html += '<div class="fileSection" data-section="staged">';
    html += '<div class="fileSectionHeader">Staged Changes (' + this.stagedFileChanges.length + ')</div>';
    html += '<ul class="gitFolderContents">';
    this.stagedFileChanges.forEach(gitFile => {
      html += this.renderFileItem(gitFile, 'staged');
    });
    html += '</ul></div>';

    return html;
  }

  renderFileItem(gitFile, section) {
    return (
      '<li class="gitFile" data-section="' +
      section +
      '" data-filepath="' +
      encodeURIComponent(gitFile.filePath) +
      '" data-newfilepath="' +
      encodeURIComponent(gitFile.newFilePath) +
      '" data-statuscode="' +
      gitFile.statusCode +
      '"><span class="gitFileIcon">' +
      svgIcons.file +
      '</span>' +
      (gitFile.statusCode === CommitStatusCode.RENAMED ? gitFile.newFilePath : gitFile.filePath) +
      '</li>'
    );
  }
}

export default UncommittedFileListView;
