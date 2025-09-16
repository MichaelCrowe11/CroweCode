import type { languages, editor } from 'monaco-editor';

// Crowe Language Definition
export const croweLanguageConfig: languages.IMonarchLanguage = {
  // Set defaultToken to invalid to see what you do not tokenize yet
  defaultToken: 'invalid',

  keywords: [
    'abstract', 'agent', 'async', 'await', 'break', 'case', 'catch', 'class',
    'const', 'continue', 'default', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'from', 'function', 'if', 'implements', 'import',
    'in', 'instanceof', 'interface', 'let', 'new', 'null', 'package', 'private',
    'protected', 'public', 'return', 'static', 'super', 'switch', 'this', 'throw',
    'true', 'try', 'typeof', 'undefined', 'var', 'void', 'while', 'with', 'yield',

    // Crowe-specific keywords
    'agent', 'pipeline', 'neural', 'tensor', 'matrix', 'vector', 'compute',
    'parallel', 'concurrent', 'async', 'stream', 'flow', 'transform', 'reduce',
    'map', 'filter', 'aggregate', 'collect', 'emit', 'subscribe', 'publish',
    'trade', 'order', 'position', 'portfolio', 'risk', 'strategy', 'signal',
    'indicator', 'candle', 'tick', 'market', 'exchange', 'asset', 'security',
    'quantum', 'entangle', 'superposition', 'collapse', 'observe', 'measure',
    'neural_network', 'deep_learn', 'gradient', 'backprop', 'forward',
    'mushroom', 'mycelium', 'spore', 'fruiting', 'colony', 'growth'
  ],

  typeKeywords: [
    'boolean', 'double', 'byte', 'int', 'short', 'char', 'void', 'long', 'float',
    'string', 'number', 'object', 'any', 'unknown', 'never',

    // Crowe-specific types
    'Agent', 'Pipeline', 'Tensor', 'Matrix', 'Vector', 'Stream', 'Signal',
    'Order', 'Position', 'Portfolio', 'Strategy', 'Indicator', 'Market',
    'QuantumState', 'Entanglement', 'Observable', 'NeuralNet', 'Layer',
    'Mushroom', 'MyceliumNetwork', 'Spore', 'Colony'
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
    '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
    '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
    '%=', '<<=', '>>=', '>>>='
  ],

  // Common regular expressions
  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  // Define several comment formats
  tokenizer: {
    root: [
      // Identifiers and keywords
      [/[a-z_$][\w$]*/, {
        cases: {
          '@typeKeywords': 'keyword.type',
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],
      [/[A-Z][\w\$]*/, 'type.identifier'],

      // Whitespace
      { include: '@whitespace' },

      // Delimiters and operators
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],

      // Numbers
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/\d+/, 'number'],

      // Delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-terminated string
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // Characters
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
      [/'/, 'string.invalid'],

      // Annotations/Decorators (Crowe-specific)
      [/@[a-zA-Z_]\w*/, 'annotation'],

      // Neural network operators (Crowe-specific)
      [/->/, 'operator.neural'],
      [/=>/, 'operator.transform'],
      [/~>/, 'operator.flow'],
      [/<~/, 'operator.feedback'],
      [/\|\|/, 'operator.parallel'],
      [/&&/, 'operator.sequential'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      ["\\*/", 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],
  },

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
};

// Crowe Language Configuration
export const croweLanguageConfiguration: languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string', 'comment'] }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  folding: {
    markers: {
      start: new RegExp('^\\s*//\\s*#?region\\b'),
      end: new RegExp('^\\s*//\\s*#?endregion\\b')
    }
  }
};

// Crowe Language Completion Provider
export const croweCompletionProvider: languages.CompletionItemProvider = {
  provideCompletionItems: (model, position) => {
    const suggestions: languages.CompletionItem[] = [
      // Agent patterns
      {
        label: 'agent',
        kind: languages.CompletionItemKind.Keyword,
        insertText: 'agent ${1:AgentName} {\n\t${2:// Agent implementation}\n}',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a new autonomous agent'
      },
      {
        label: 'pipeline',
        kind: languages.CompletionItemKind.Keyword,
        insertText: 'pipeline ${1:PipelineName} {\n\t${2:// Pipeline stages}\n}',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create a data processing pipeline'
      },
      {
        label: 'neural_network',
        kind: languages.CompletionItemKind.Keyword,
        insertText: 'neural_network ${1:NetworkName} {\n\tlayers: [\n\t\t${2:// Define layers}\n\t]\n}',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a neural network architecture'
      },

      // Trading patterns
      {
        label: 'strategy',
        kind: languages.CompletionItemKind.Keyword,
        insertText: 'strategy ${1:StrategyName} {\n\tsignals: {\n\t\t${2:// Define trading signals}\n\t}\n}',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create a trading strategy'
      },
      {
        label: 'order',
        kind: languages.CompletionItemKind.Function,
        insertText: 'order(${1:symbol}, ${2:quantity}, ${3:price})',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Place a trading order'
      },

      // Quantum computing patterns
      {
        label: 'quantum_state',
        kind: languages.CompletionItemKind.Class,
        insertText: 'quantum_state ${1:StateName} = |${2:0}>',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a quantum state'
      },
      {
        label: 'entangle',
        kind: languages.CompletionItemKind.Function,
        insertText: 'entangle(${1:qubit1}, ${2:qubit2})',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create quantum entanglement between qubits'
      },

      // Mushroom/Mycelium patterns
      {
        label: 'mycelium_network',
        kind: languages.CompletionItemKind.Class,
        insertText: 'mycelium_network ${1:NetworkName} {\n\tnodes: [\n\t\t${2:// Define nodes}\n\t]\n}',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create a distributed mycelium network'
      },
      {
        label: 'spore',
        kind: languages.CompletionItemKind.Function,
        insertText: 'spore.${1:method}(${2:parameters})',
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Interact with spore lifecycle'
      }
    ];

    return { suggestions };
  }
};

// Hover provider for Crowe language
export const croweHoverProvider: languages.HoverProvider = {
  provideHover: (model, position) => {
    const word = model.getWordAtPosition(position);
    if (!word) return;

    const croweDocumentation: { [key: string]: string } = {
      'agent': 'An autonomous software entity that can perform tasks independently',
      'pipeline': 'A series of data processing elements connected in series',
      'neural_network': 'A network of interconnected nodes that can learn patterns',
      'strategy': 'A set of rules for making trading decisions',
      'quantum_state': 'A mathematical object that fully describes a quantum system',
      'mycelium_network': 'A distributed network inspired by fungal mycelium',
      'tensor': 'A multi-dimensional array used in machine learning',
      'matrix': 'A rectangular array of numbers arranged in rows and columns',
      'vector': 'An array of numbers representing magnitude and direction',
      'signal': 'A function that conveys information about a system',
      'indicator': 'A mathematical calculation based on price and/or volume',
      'portfolio': 'A collection of financial investments',
      'entangle': 'Create a quantum mechanical phenomenon linking particles',
      'spore': 'A reproductive unit capable of developing into a new individual'
    };

    const documentation = croweDocumentation[word.word.toLowerCase()];
    if (documentation) {
      return {
        range: new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents: [
          { value: `**${word.word}**` },
          { value: documentation }
        ]
      };
    }
    return null;
  }
};

// Register Crowe language with Monaco
export function registerCroweLanguage() {
  if (typeof window !== 'undefined') {
    import('monaco-editor').then(({ languages }) => {
      // Register the language
      languages.register({ id: 'crowe' });

      // Set configuration
      languages.setLanguageConfiguration('crowe', croweLanguageConfiguration);

      // Set tokenizer
      languages.setMonarchTokensProvider('crowe', croweLanguageConfig);

      // Register completion provider
      languages.registerCompletionItemProvider('crowe', croweCompletionProvider);

      // Register hover provider
      languages.registerHoverProvider('crowe', croweHoverProvider);
    });
  }
}

// File extension mappings
export const croweFileExtensions = ['.crowe', '.cw', '.crowe-lang'];

// Get language from file extension
export function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (croweFileExtensions.includes(`.${ext}`)) {
    return 'crowe';
  }

  // Enhanced language mapping
  const languageMap: { [key: string]: string } = {
    // Enhanced JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'mjs': 'javascript',
    'cjs': 'javascript',

    // Web technologies
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'less': 'less',
    'svg': 'xml',
    'vue': 'vue',
    'svelte': 'svelte',

    // Data formats
    'json': 'json',
    'jsonc': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'xml': 'xml',
    'csv': 'csv',

    // Programming languages
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'r': 'r',
    'lua': 'lua',
    'dart': 'dart',
    'pl': 'perl',
    'clj': 'clojure',
    'cljs': 'clojure',
    'elm': 'elm',
    'ex': 'elixir',
    'exs': 'elixir',
    'fs': 'fsharp',
    'fsx': 'fsharp',
    'hs': 'haskell',
    'lhs': 'haskell',
    'jl': 'julia',
    'ml': 'ocaml',
    'mli': 'ocaml',
    'pas': 'pascal',
    'pp': 'pascal',

    // Shell scripting
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ps1': 'powershell',
    'bat': 'bat',
    'cmd': 'bat',

    // Database
    'sql': 'sql',
    'mysql': 'sql',
    'pgsql': 'sql',
    'sqlite': 'sql',

    // Configuration
    'dockerfile': 'dockerfile',
    'dockerignore': 'plaintext',
    'gitignore': 'plaintext',
    'gitattributes': 'plaintext',
    'env': 'plaintext',
    'ini': 'ini',
    'conf': 'plaintext',
    'config': 'plaintext',
    'properties': 'plaintext',

    // Documentation
    'md': 'markdown',
    'mdx': 'markdown',
    'rst': 'restructuredtext',
    'txt': 'plaintext',
    'log': 'plaintext',

    // Build and package management
    'makefile': 'makefile',
    'mk': 'makefile',
    'gradle': 'groovy',
    'groovy': 'groovy',
    'sbt': 'scala',
    'cmake': 'cmake',

    // Specialized
    'graphql': 'graphql',
    'gql': 'graphql',
    'prisma': 'prisma',
    'proto': 'protobuf',
    'thrift': 'thrift',
    'avro': 'json',
    'tf': 'terraform',
    'hcl': 'terraform',

    // Crowe ecosystem
    'crowe': 'crowe',
    'cw': 'crowe'
  };

  return languageMap[ext || ''] || 'plaintext';
}