class GitFileTreeView {
  constructor(folder, gitFiles) {
    this.folder = folder;
    this.gitFiles = gitFiles;
  }

  render() {
    const { folder, gitFiles } = this;
    var html =
        (folder.name !== ''
          ? '<span class="gitFolder" data-folderpath="' +
            encodeURIComponent(folder.folderPath) +
            '"><span class="gitFolderIcon">' +
            (folder.open ? svgIcons.openFolder : svgIcons.closedFolder) +
            '</span><span class="gitFolderName">' +
            folder.name +
            '</span></span>'
          : '') +
        '<ul class="gitFolderContents' +
        (!folder.open ? ' hidden' : '') +
        '">',
      keys = Object.keys(folder.contents),
      i,
      gitFile,
      gitFolder;
    keys.sort(function(a, b) {
      return folder.contents[a].type === 'folder' && folder.contents[b].type === 'file'
        ? -1
        : folder.contents[a].type === 'file' && folder.contents[b].type === 'folder'
        ? 1
        : folder.contents[a].name < folder.contents[b].name
        ? -1
        : folder.contents[a].name > folder.contents[b].name
        ? 1
        : 0;
    });
    for (i = 0; i < keys.length; i++) {
      if (folder.contents[keys[i]].type === 'folder') {
        gitFolder = folder.contents[keys[i]];
        html +=
          '<li' +
          (!gitFolder.open ? ' class="closed"' : '') +
          '>' +
          new GitFileTreeView(gitFolder, gitFiles).render() +
          '</li>';
      } else {
        gitFile = gitFiles[folder.contents[keys[i]].index];
        html +=
          '<li class="gitFile ' +
          gitFile.type +
          (gitFile.additions !== null && gitFile.deletions !== null ? ' gitDiffPossible' : '') +
          '" data-oldfilepath="' +
          encodeURIComponent(gitFile.oldFilePath) +
          '" data-newfilepath="' +
          encodeURIComponent(gitFile.newFilePath) +
          '" data-type="' +
          gitFile.type +
          '"' +
          (gitFile.additions === null || gitFile.deletions === null
            ? ' title="This is a binary file, unable to view diff."'
            : '') +
          '><span class="gitFileIcon">' +
          svgIcons.file +
          '</span>' +
          folder.contents[keys[i]].name +
          (gitFile.type === 'R'
            ? ' <span class="gitFileRename" title="' +
              escapeHtml(gitFile.oldFilePath + ' was renamed to ' + gitFile.newFilePath) +
              '">R</span>'
            : '') +
          (gitFile.type !== 'A' && gitFile.type !== 'D' && gitFile.additions !== null && gitFile.deletions !== null
            ? '<span class="gitFileAddDel">(<span class="gitFileAdditions" title="' +
              gitFile.additions +
              ' addition' +
              (gitFile.additions !== 1 ? 's' : '') +
              '">+' +
              gitFile.additions +
              '</span>|<span class="gitFileDeletions" title="' +
              gitFile.deletions +
              ' deletion' +
              (gitFile.deletions !== 1 ? 's' : '') +
              '">-' +
              gitFile.deletions +
              '</span>)</span>'
            : '') +
          '</li>';
      }
    }
    return html + '</ul>';
  }
}
