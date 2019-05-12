# Ada Lightbulb extension for Visual Studio Code

View a git graph of your repository, and easily perform Git actions from the graph.

<p><img src="https://github.com/vfonic/vscode-ada-lightbulb/raw/master/resources/Lightbolb.gif" height="300px"></p>

## Demo

![Demo](resources/demo.gif)

## Install

You can install this extension from [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=vfonic.ada-lightbulb) for Visual Studio Code.

## Features

- Graph View:
  - Display:
    - Local & Remote Branches
    - Local Refs: Heads, Tags & Remotes
    - Local Uncommitted Changes
  - View commit details and file changes by clicking on a commit
    - View the diff of a file change by clicking on it in the commit details view
  - Perform Git Actions (available by right clicking on a commit / branch / tag):
    - Create, Checkout, Rename, Delete & Merge branches
    - Add, Delete & Push tags
    - Checkout, Cherry Pick, Merge & Revert commits
    - Reset current branch to commit
    - Copy commit hashes, tag names & branch names to the clipboard
- "Ada Lightbulb: Open Graph" launch command in the Command Palette
- "Ada Lightbulb" launch button in the Status Bar

## Extension Commands

This extension contributes the following command:

- `ada-lightbulb.view`: Ada Lightbulb: Open Graph

## Release Notes

Detailed Release Notes are available in the [CHANGELOG](CHANGELOG.md).

## Contributing

If you found a problem, or have a feature request, please open an [issue](https://github.com/vfonic/vscode-ada-lightbulb/issues) about it.

## License

MIT
