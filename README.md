# Ada Lightbulb extension for Visual Studio Code

View a git graph of your repository, and easily perform Git actions from the graph. Configurable to look the way you want!

![Despicable Me Lightbulb](https://github.com/vfonic/vscode-ada-lightbulb/raw/master/resources/Lightbolb.gif)

## Features

- Graph View:
  - Display:
    - Local & Remote Branches
    - Local Refs: Heads, Tags & Remotes
    - Local Uncommitted Changes
  - View commit details and file changes by clicking on a commit
    - View the Visual Studio Code Diff of a file change by clicking on it in the commit details view
  - Perform Git Actions (available by right clicking on a commit / branch / tag):
    - Create, Checkout, Rename, Delete & Merge branches
    - Add, Delete & Push tags
    - Checkout, Cherry Pick, Merge & Revert commits
    - Reset current branch to commit
    - Copy commit hashes, tag names & branch names to the clipboard
- "Ada Lightbulb: View Graph" launch command in the Command Palette
- "Ada Lightbulb" launch button in the Status Bar

## Extension Settings

This extension contributes the following settings:

- `ada-lightbulb.autoCenterCommitDetailsView`: Automatically center the commit details view when it is opened.
- `ada-lightbulb.dateFormat`: Specifies the date format to be used in the date column of the graph.
- `ada-lightbulb.dateType`: Specifies the date type to be displayed throughout Ada Lightbulb, either the author or commit date.
- `ada-lightbulb.fetchAvatars`: Fetch avatars of commit authors and committers. Default: false (disabled)
- `ada-lightbulb.graphColours`: Specifies the colours used on the graph.
- `ada-lightbulb.graphStyle`: Specifies the style of the graph.
- `ada-lightbulb.initialLoadCommits`: Specifies the number of commits to initially load.
- `ada-lightbulb.maxDepthOfRepoSearch`: Specifies the maximum depth of subfolders to search when discovering repositories in the workspace. Default: 0 (don't search subfolders)
- `ada-lightbulb.loadMoreCommits`: Specifies the number of commits to load when the "Load More Commits" button is pressed (only shown when more commits are available).
- `ada-lightbulb.showCurrentBranchByDefault`: Show the current branch by default when Ada Lightbulb is opened. Default: false (show all branches)
- `ada-lightbulb.showStatusBarItem`: Show a Status Bar item which opens Ada Lightbulb when clicked.
- `ada-lightbulb.showUncommittedChanges`: Show uncommitted changes (set to false to decrease load time on large repositories).
- `ada-lightbulb.tabIconColourTheme`: Specifies the colour theme of the icon displayed on the Ada Lightbulb tab.

This extension consumes the following settings:

- `git.path`: Specifies the path of a portable Git installation.

More information on each setting, including detailed descriptions, default values and types is available [here](https://github.com/mhutchie/vscode-ada-lightbulb/wiki/Extension-Settings).

## Extension Commands

This extension contributes the following commands:

- `ada-lightbulb.view`: Ada Lightbulb: View Graph
- `ada-lightbulb.clearAvatarCache`: Ada Lightbulb: Clear Avatar Cache

## Release Notes

Detailed Release Notes are available [here](CHANGELOG.md).

## Visual Studio Marketplace

This extension is available on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=vfonic.ada-lightbulb) for Visual Studio Code.

## TODO

- [ ] Rethink config options (for now)
- [ ] Publish to VS Code Marketplace
