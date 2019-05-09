window.exports = class {
  set default(klass) {
    window[klass.constructor.name] = klass;
  }
};
window.acquireVsCodeApi = () => {
  let prevState = null;
  return {
    getState: () => prevState,
    setState: state => (prevState = state),
    postMessage: msg => {
      window.postMessage(postMessageData[msg.command]);
    },
  };
};
window.viewState = {
  assetLoader: {
    extensionPath: '/Users/viktor/Developer/JavaScript/ada-lightbulb',
    getUri: (...pathComps) => ({ with: () => [viewState.assetLoader.extensionPath, ...pathComps].join('/') }),
  },
  autoCenterCommitDetailsView: true,
  dateFormat: 'Date & Time',
  fetchAvatars: false,
  graphColours: [
    '#0085d9',
    '#d9008f',
    '#00d90a',
    '#d98500',
    '#a300d9',
    '#ff0000',
    '#00d9cc',
    '#e138e8',
    '#85d900',
    '#dc5b23',
    '#6f24d6',
    '#ffcc00',
  ],
  graphStyle: 'rounded',
  initialLoadCommits: 300,
  lastActiveRepo: '/Users/viktor/Developer/JavaScript/ada-lightbulb',
  loadMoreCommits: 100,
  repos: { '/Users/viktor/Developer/JavaScript/ada-lightbulb': { columnWidths: [168, 154, 101, 51] } },
  showCurrentBranchByDefault: false,
};
window.postMessageData = {
  loadBranches: {
    command: 'loadBranches',
    branches: ['master', 'tests', 'remotes/origin/master', 'remotes/origin/tests'],
    head: 'master',
    hard: true,
    isRepo: true,
  },
  loadCommits: {
    command: 'loadCommits',
    commits: [
      {
        hash: '*',
        parentHashes: ['709bb1ecfeef102dd7560b256907aa7ca7d64f07'],
        author: '*',
        email: '',
        date: 1557419152,
        message: 'Uncommitted Changes (6)',
        refs: [],
      },
      {
        hash: '709bb1ecfeef102dd7560b256907aa7ca7d64f07',
        parentHashes: ['dd9b3bbc5723ec24747b69484712c31e0f036ba0'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557418953,
        message: 'Convert `let` to `const`',
        refs: [{ hash: '709bb1ecfeef102dd7560b256907aa7ca7d64f07', name: 'master', type: 'head' }],
      },
      {
        hash: 'dd9b3bbc5723ec24747b69484712c31e0f036ba0',
        parentHashes: ['20a923e28ff75d0c65c45448b3821d897e3d74b8'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557418845,
        message: 'Formatting; Convert functions to ES classes',
        refs: [],
      },
      {
        hash: '20a923e28ff75d0c65c45448b3821d897e3d74b8',
        parentHashes: ['a079a9602534ffbdcf8276abb476c3384557a2ed'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557418299,
        message: 'Yetagainfixeslintprettierconfig',
        refs: [],
      },
      {
        hash: 'a079a9602534ffbdcf8276abb476c3384557a2ed',
        parentHashes: ['a0523d8118348085f50972505ecae99ef5eedc1c'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557343361,
        message: 'Eslint: Sort rules alphabetically',
        refs: [],
      },
      {
        hash: 'a0523d8118348085f50972505ecae99ef5eedc1c',
        parentHashes: ['c7329db83a5d376a7d48d791ae6ccc49fba3ea2c'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557413540,
        message: 'Rename `WebviewGenerator` => `WebviewHtmlGenerator`',
        refs: [{ hash: 'a0523d8118348085f50972505ecae99ef5eedc1c', name: 'origin/master', type: 'remote' }],
      },
      {
        hash: 'c7329db83a5d376a7d48d791ae6ccc49fba3ea2c',
        parentHashes: ['6b185a9903d1eda6649553497f8532424b582106'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557413526,
        message: 'Introduce CSS variables',
        refs: [],
      },
      {
        hash: '6b185a9903d1eda6649553497f8532424b582106',
        parentHashes: ['b49aa237bd292e08e8a962718467b7adeae076ec'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557410192,
        message: 'Add stylelint',
        refs: [],
      },
      {
        hash: 'b49aa237bd292e08e8a962718467b7adeae076ec',
        parentHashes: ['49647b100da371296d453de3ca6908280e0179c4'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557408750,
        message: 'Update eslint config',
        refs: [],
      },
      {
        hash: '49647b100da371296d453de3ca6908280e0179c4',
        parentHashes: ['ff7014160506ffcaf134830cad2f7236087c963f'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557403275,
        message: 'Extract Webview code to WebviewGenerator class; Extract asset loading to AssetLoader class',
        refs: [],
      },
      {
        hash: 'ff7014160506ffcaf134830cad2f7236087c963f',
        parentHashes: ['9d89bfc42530a81cea36fbc75d629794bb8f3d8f'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557398059,
        message: 'Make RepoFileWatcher default export',
        refs: [],
      },
      {
        hash: '9d89bfc42530a81cea36fbc75d629794bb8f3d8f',
        parentHashes: ['c94cac4b8864946f0fe27dece1e215fd72e90e5a'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557397133,
        message: 'Turn configuration settings fetching to getters',
        refs: [],
      },
      {
        hash: 'c94cac4b8864946f0fe27dece1e215fd72e90e5a',
        parentHashes: ['3a710ad7b53f0b9d8b421f61509005befbeb857f'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557396907,
        message: 'Use Configuration as a singleton',
        refs: [],
      },
      {
        hash: '3a710ad7b53f0b9d8b421f61509005befbeb857f',
        parentHashes: ['c8bba9670e1c3f4f64c4ebbf17f31b30ee12e8bd'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557396479,
        message: 'WIP: Webview test view',
        refs: [],
      },
      {
        hash: 'c8bba9670e1c3f4f64c4ebbf17f31b30ee12e8bd',
        parentHashes: ['c334f6cc66ffd8d1479dbedc980533571bf834ea'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557396472,
        message: 'WIP: Move expanded commit',
        refs: [],
      },
      {
        hash: 'c334f6cc66ffd8d1479dbedc980533571bf834ea',
        parentHashes: ['2dbfcbdf51667ba4e35d9ef6e59dab00156f82ae'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557396404,
        message: 'Remove typescript packages',
        refs: [],
      },
      {
        hash: '2dbfcbdf51667ba4e35d9ef6e59dab00156f82ae',
        parentHashes: ['4c052a4e047a328f86cf14bce9aee1cd3db6ed9e'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557396247,
        message: 'Add prettier',
        refs: [],
      },
      {
        hash: '4c052a4e047a328f86cf14bce9aee1cd3db6ed9e',
        parentHashes: ['fdd2ad9d0c8675847c6606eec6bbf0e5ff61f4f6'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557395642,
        message: 'Add more TODOs :D',
        refs: [],
      },
      {
        hash: 'fdd2ad9d0c8675847c6606eec6bbf0e5ff61f4f6',
        parentHashes: ['f68fb640048a3682681f1ecbfe2b221f17fac645'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557343361,
        message: 'WIP: Add index.html test file',
        refs: [],
      },
      {
        hash: 'f68fb640048a3682681f1ecbfe2b221f17fac645',
        parentHashes: ['ff5878f8ebc0ff054cddcaa0d19168731a62972f'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557351381,
        message: 'Make current branch branch icon white',
        refs: [],
      },
      {
        hash: 'ff5878f8ebc0ff054cddcaa0d19168731a62972f',
        parentHashes: ['600c1a819571859f94e977d601404862e7ed2697'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557351365,
        message: 'Add "Register as a source control provider" to TODO',
        refs: [],
      },
      {
        hash: '600c1a819571859f94e977d601404862e7ed2697',
        parentHashes: ['81f98dcf0d638d86b6b6752e2a0462d1c9edf7f8'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557351335,
        message: 'Fix configuration',
        refs: [],
      },
      {
        hash: '56565a2404a60163712e80eafa62466d088b8de7',
        parentHashes: ['36a5299b00da658219d74959d00a0c17caade82e'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557351335,
        message: 'Fix configuration',
        refs: [{ hash: '56565a2404a60163712e80eafa62466d088b8de7', name: 'tests', type: 'head' }],
      },
      {
        hash: '36a5299b00da658219d74959d00a0c17caade82e',
        parentHashes: ['81f98dcf0d638d86b6b6752e2a0462d1c9edf7f8'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557343361,
        message: 'WIP: Add index.html test file',
        refs: [{ hash: '36a5299b00da658219d74959d00a0c17caade82e', name: 'origin/tests', type: 'remote' }],
      },
      {
        hash: '81f98dcf0d638d86b6b6752e2a0462d1c9edf7f8',
        parentHashes: ['699d460fc439927d4cc9f00ea165e59bceaeb595'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557342710,
        message: 'Add more TODOs',
        refs: [],
      },
      {
        hash: '699d460fc439927d4cc9f00ea165e59bceaeb595',
        parentHashes: ['1fa8d2a916089499ef8e631d80a2d1b302282084'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557342683,
        message: 'Update extension category',
        refs: [],
      },
      {
        hash: '1fa8d2a916089499ef8e631d80a2d1b302282084',
        parentHashes: ['3efd785cc96b8d7d732336b87dae8344d18aecb1'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557341148,
        message: 'Add TODO section',
        refs: [],
      },
      {
        hash: '3efd785cc96b8d7d732336b87dae8344d18aecb1',
        parentHashes: ['9c909c47ad815e6afcfae840a779a72c5e004d28'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557340910,
        message: 'Add Lightbolb.gif',
        refs: [],
      },
      {
        hash: '9c909c47ad815e6afcfae840a779a72c5e004d28',
        parentHashes: ['7b02beddf401420bc79f84cb7a21167d89f6ff24'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557340898,
        message: 'Changelog',
        refs: [],
      },
      {
        hash: '7b02beddf401420bc79f84cb7a21167d89f6ff24',
        parentHashes: ['744451ff6ff8c8ed46b63aea31474c1a50086e03'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557210669,
        message: 'Make table header sticky',
        refs: [],
      },
      {
        hash: '744451ff6ff8c8ed46b63aea31474c1a50086e03',
        parentHashes: ['aa2e633bc30e10df6a40a985ee1a4dc0796ce02c'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557203900,
        message: 'Changelog:',
        refs: [],
      },
      {
        hash: 'aa2e633bc30e10df6a40a985ee1a4dc0796ce02c',
        parentHashes: ['4bc4219c85d606c453f16f85655344c47f53fe21'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557171615,
        message: 'v1',
        refs: [],
      },
      {
        hash: '4bc4219c85d606c453f16f85655344c47f53fe21',
        parentHashes: ['b17e6e2514a0117186be34cde7bfeb1a38adc000'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557165033,
        message: 'Load the whole codebase',
        refs: [],
      },
      {
        hash: 'b17e6e2514a0117186be34cde7bfeb1a38adc000',
        parentHashes: ['ef438beaf6859eec97a4b9dfbacbc358fc260c1d'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557164761,
        message: 'Add git view action',
        refs: [],
      },
      {
        hash: 'ef438beaf6859eec97a4b9dfbacbc358fc260c1d',
        parentHashes: ['9975010c0dc4855ec335aa4b72d5ce76828f1e9f'],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557164030,
        message: 'Working version',
        refs: [],
      },
      {
        hash: '9975010c0dc4855ec335aa4b72d5ce76828f1e9f',
        parentHashes: [''],
        author: 'Viktor Fonic',
        email: 'viktor.fonic@gmail.com',
        date: 1557162751,
        message: 'Initial commit',
        refs: [],
      },
    ],
    head: '709bb1ecfeef102dd7560b256907aa7ca7d64f07',
    moreCommitsAvailable: false,
    hard: true,
  },
  commitDetails: {
    command: 'commitDetails',
    commitDetails: {
      hash: '9d89bfc42530a81cea36fbc75d629794bb8f3d8f',
      parents: ['c94cac4b8864946f0fe27dece1e215fd72e90e5a'],
      author: 'Viktor Fonic',
      email: 'viktor.fonic@gmail.com',
      date: 1557397133,
      committer: 'Viktor Fonic',
      body: 'Turn configuration settings fetching to getters',
      fileChanges: [
        { oldFilePath: 'src/config.js', newFilePath: 'src/config.js', type: 'M', additions: 14, deletions: 14 },
        { oldFilePath: 'src/dataSource.js', newFilePath: 'src/dataSource.js', type: 'M', additions: 4, deletions: 6 },
        {
          oldFilePath: 'src/gitGraphView.js',
          newFilePath: 'src/gitGraphView.js',
          type: 'M',
          additions: 10,
          deletions: 10,
        },
        { oldFilePath: 'src/repoManager.js', newFilePath: 'src/repoManager.js', type: 'M', additions: 3, deletions: 3 },
        {
          oldFilePath: 'src/statusBarItem.js',
          newFilePath: 'src/statusBarItem.js',
          type: 'M',
          additions: 2,
          deletions: 2,
        },
      ],
    },
  },
};