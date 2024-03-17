// @ts-nocheck
import vscode from 'vscode';

class DiffDocProvider {
  constructor(dataSource) {
    this.onDidChangeEventEmitter = new vscode.EventEmitter();
    this.docs = new Map();
    this.dataSource = dataSource;
    this.subscriptions = vscode.workspace.onDidCloseTextDocument(doc => this.docs.delete(doc.uri.toString()));
  }

  dispose() {
    this.subscriptions.dispose();
    this.docs.clear();
    this.onDidChangeEventEmitter.dispose();
  }

  get onDidChange() {
    return this.onDidChangeEventEmitter.event;
  }

  provideTextDocumentContent(uri) {
    const document = this.docs.get(uri.toString());
    if (document) {
      return document.value;
    }
    const request = decodeDiffDocUri(uri);
    return this.dataSource.getCommitFile(request.repo, request.commit, request.filePath).then(data => {
      const document = new DiffDocument(data);
      this.docs.set(uri.toString(), document);
      return document.value;
    });
  }
}

DiffDocProvider.scheme = 'ada-lightbulb';
export default DiffDocProvider;

class DiffDocument {
  constructor(body) {
    this.body = body;
  }

  get value() {
    return this.body;
  }
}

function encodeDiffDocUri(repo, path, commit) {
  return vscode.Uri.parse(
    DiffDocProvider.scheme + ':' + path + '?commit=' + encodeURIComponent(commit) + '&repo=' + encodeURIComponent(repo)
  );
}

export { encodeDiffDocUri };

function decodeDiffDocUri(uri) {
  const queryArgs = decodeUriQueryArgs(uri.query);
  return { filePath: uri.path, commit: queryArgs.commit, repo: queryArgs.repo };
}

export { decodeDiffDocUri };

function decodeUriQueryArgs(query) {
  const queryComps = query.split('&');
  const queryArgs = {};
  for (let i = 0; i < queryComps.length; i++) {
    const pair = queryComps[i].split('=');
    queryArgs[pair[0]] = decodeURIComponent(pair[1]);
  }
  return queryArgs;
}
