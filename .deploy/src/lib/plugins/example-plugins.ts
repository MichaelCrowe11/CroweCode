import type { CrowePlugin, PluginContext } from './plugin-system';

// Example Plugin 1: Enhanced Git Integration
export const gitEnhancedPlugin: CrowePlugin = {
  id: 'crowe.git-enhanced',
  name: 'Enhanced Git Integration',
  version: '1.0.0',
  description: 'Advanced Git operations with visual diff and branch management',
  author: 'CroweCode Team',
  category: 'version-control',
  permissions: ['git', 'editor', 'workspace'],
  icon: '🌿',

  async activate(context: PluginContext) {
    // Register Git commands
    context.editor.registerCommand('git.enhancedDiff', async () => {
      const diff = await context.git.getDiff();
      context.ui.showMessage(`Git diff:\n${diff}`, 'info');
    });

    context.editor.registerCommand('git.visualBranches', async () => {
      const branches = await context.git.getBranches();
      const selected = await context.ui.showQuickPick(branches, {
        placeHolder: 'Select branch to switch to'
      });
      if (selected) {
        await context.git.switchBranch(selected);
        context.ui.showMessage(`Switched to branch: ${selected}`, 'info');
      }
    });

    // Register status bar item
    const statusItem = context.ui.createStatusBarItem('git-status');
    statusItem.text = '🌿 Git';
    statusItem.command = 'git.enhancedDiff';
    statusItem.show();

    context.subscriptions.push(statusItem);
  },

  contributes: {
    commands: [
      {
        id: 'git.enhancedDiff',
        title: 'Show Enhanced Git Diff',
        category: 'Git',
        icon: '📊',
        handler: () => {}
      },
      {
        id: 'git.visualBranches',
        title: 'Visual Branch Manager',
        category: 'Git',
        icon: '🌳',
        handler: () => {}
      }
    ]
  }
};

// Example Plugin 2: AI Code Assistant
export const aiCodeAssistantPlugin: CrowePlugin = {
  id: 'crowe.ai-assistant',
  name: 'AI Code Assistant',
  version: '2.1.0',
  description: 'Advanced AI-powered code generation, explanation, and refactoring',
  author: 'CroweCode AI Team',
  category: 'ai-tools',
  permissions: ['ai-api', 'editor'],
  icon: '🤖',

  async activate(context: PluginContext) {
    // Register AI commands
    context.editor.registerCommand('ai.generateFunction', async () => {
      const description = await context.ui.showInputBox({
        prompt: 'Describe the function you want to generate:'
      });

      if (description) {
        const editor = context.editor.getActiveEditor();
        if (editor) {
          const model = editor.getModel();
          const language = model?.getLanguageId() || 'javascript';

          const code = await context.ai.generateCode(description, language);

          const position = editor.getPosition();
          if (position) {
            editor.executeEdits('ai-generate', [{
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              },
              text: code
            }]);
          }
        }
      }
    });

    context.editor.registerCommand('ai.explainSelection', async () => {
      const editor = context.editor.getActiveEditor();
      if (editor) {
        const selection = editor.getSelection();
        const model = editor.getModel();

        if (selection && model && !selection.isEmpty()) {
          const selectedText = model.getValueInRange(selection);
          const language = model.getLanguageId();

          const explanation = await context.ai.explainCode(selectedText, language);
          context.ui.showMessage(`Code Explanation:\n${explanation}`, 'info');
        } else {
          context.ui.showMessage('Please select some code to explain', 'warning');
        }
      }
    });

    context.editor.registerCommand('ai.smartRefactor', async () => {
      const editor = context.editor.getActiveEditor();
      if (editor) {
        const selection = editor.getSelection();
        const model = editor.getModel();

        if (selection && model && !selection.isEmpty()) {
          const selectedText = model.getValueInRange(selection);
          const language = model.getLanguageId();

          const instruction = await context.ui.showInputBox({
            prompt: 'How would you like to refactor this code?'
          });

          if (instruction) {
            const refactoredCode = await context.ai.refactorCode(selectedText, instruction, language);

            editor.executeEdits('ai-refactor', [{
              range: selection,
              text: refactoredCode
            }]);
          }
        } else {
          context.ui.showMessage('Please select some code to refactor', 'warning');
        }
      }
    });
  },

  contributes: {
    commands: [
      {
        id: 'ai.generateFunction',
        title: 'Generate Function with AI',
        category: 'AI Tools',
        icon: '⚡',
        handler: () => {}
      },
      {
        id: 'ai.explainSelection',
        title: 'Explain Selected Code',
        category: 'AI Tools',
        icon: '💡',
        handler: () => {}
      },
      {
        id: 'ai.smartRefactor',
        title: 'Smart Refactor',
        category: 'AI Tools',
        icon: '🔄',
        handler: () => {}
      }
    ],
    keybindings: [
      {
        key: 'Ctrl+Shift+G',
        command: 'ai.generateFunction'
      },
      {
        key: 'Ctrl+Shift+E',
        command: 'ai.explainSelection'
      },
      {
        key: 'Ctrl+Shift+R',
        command: 'ai.smartRefactor'
      }
    ]
  }
};

// Example Plugin 3: Trading Tools
export const tradingToolsPlugin: CrowePlugin = {
  id: 'crowe.trading-tools',
  name: 'Trading Strategy Tools',
  version: '1.5.0',
  description: 'Tools for developing and testing trading strategies',
  author: 'CroweCode Trading Team',
  category: 'trading',
  permissions: ['network', 'workspace', 'editor'],
  icon: '📈',

  async activate(context: PluginContext) {
    // Register language support for trading strategies
    context.editor.registerLanguage({
      id: 'trading-strategy',
      name: 'Trading Strategy',
      extensions: ['.strategy', '.trade'],
      configuration: {
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
          { open: '"', close: '"' }
        ]
      },
      completionProvider: {
        provideCompletionItems: () => ({
          suggestions: [
            {
              label: 'buy_order',
              kind: 14, // Function
              insertText: 'buy_order(${1:symbol}, ${2:quantity}, ${3:price})',
              documentation: 'Place a buy order'
            },
            {
              label: 'sell_order',
              kind: 14, // Function
              insertText: 'sell_order(${1:symbol}, ${2:quantity}, ${3:price})',
              documentation: 'Place a sell order'
            },
            {
              label: 'sma',
              kind: 14, // Function
              insertText: 'sma(${1:data}, ${2:period})',
              documentation: 'Simple Moving Average'
            },
            {
              label: 'rsi',
              kind: 14, // Function
              insertText: 'rsi(${1:data}, ${2:period})',
              documentation: 'Relative Strength Index'
            }
          ]
        })
      }
    });

    // Register trading commands
    context.editor.registerCommand('trading.validateStrategy', async () => {
      const editor = context.editor.getActiveEditor();
      if (editor) {
        const model = editor.getModel();
        if (model) {
          const code = model.getValue();

          // Simulate strategy validation
          const isValid = code.includes('buy_order') || code.includes('sell_order');

          if (isValid) {
            context.ui.showMessage('✅ Trading strategy is valid', 'info');
          } else {
            context.ui.showMessage('❌ Strategy must contain at least one order', 'error');
          }
        }
      }
    });

    context.editor.registerCommand('trading.backtest', async () => {
      context.ui.showMessage('🔄 Running backtest simulation...', 'info');

      // Simulate backtest
      setTimeout(() => {
        context.ui.showMessage('📊 Backtest complete: +15.3% return', 'info');
      }, 2000);
    });

    // Register market data view
    const marketDataView = {
      id: 'trading.marketData',
      name: 'Market Data',
      location: 'sidebar' as const,
      component: () => null, // Would be a React component
      icon: '💹'
    };

    context.ui.registerView(marketDataView);
  },

  contributes: {
    commands: [
      {
        id: 'trading.validateStrategy',
        title: 'Validate Strategy',
        category: 'Trading',
        icon: '✅',
        handler: () => {}
      },
      {
        id: 'trading.backtest',
        title: 'Run Backtest',
        category: 'Trading',
        icon: '📊',
        handler: () => {}
      }
    ],
    languages: [
      {
        id: 'trading-strategy',
        name: 'Trading Strategy',
        extensions: ['.strategy', '.trade']
      }
    ]
  }
};

// Example Plugin 4: Quantum Computing Support
export const quantumComputingPlugin: CrowePlugin = {
  id: 'crowe.quantum-computing',
  name: 'Quantum Computing Support',
  version: '0.9.0',
  description: 'Language support and tools for quantum computing',
  author: 'CroweCode Quantum Team',
  category: 'quantum',
  permissions: ['editor', 'network'],
  icon: '⚛️',

  async activate(context: PluginContext) {
    // Register quantum language extensions
    context.editor.registerLanguage({
      id: 'qiskit',
      name: 'Qiskit Python',
      extensions: ['.qpy', '.quantum'],
      completionProvider: {
        provideCompletionItems: () => ({
          suggestions: [
            {
              label: 'QuantumCircuit',
              kind: 6, // Class
              insertText: 'QuantumCircuit(${1:num_qubits})',
              documentation: 'Create a quantum circuit'
            },
            {
              label: 'h_gate',
              kind: 14, // Function
              insertText: 'circuit.h(${1:qubit})',
              documentation: 'Apply Hadamard gate'
            },
            {
              label: 'cx_gate',
              kind: 14, // Function
              insertText: 'circuit.cx(${1:control}, ${2:target})',
              documentation: 'Apply CNOT gate'
            },
            {
              label: 'measure',
              kind: 14, // Function
              insertText: 'circuit.measure(${1:qubit}, ${2:classical_bit})',
              documentation: 'Measure qubit'
            }
          ]
        })
      }
    });

    // Register quantum visualization command
    context.editor.registerCommand('quantum.visualizeCircuit', async () => {
      const editor = context.editor.getActiveEditor();
      if (editor) {
        const model = editor.getModel();
        if (model) {
          const code = model.getValue();

          if (code.includes('QuantumCircuit')) {
            context.ui.showMessage('🎨 Quantum circuit visualization opened in new panel', 'info');
          } else {
            context.ui.showMessage('❌ No quantum circuit found in current file', 'warning');
          }
        }
      }
    });
  },

  contributes: {
    commands: [
      {
        id: 'quantum.visualizeCircuit',
        title: 'Visualize Quantum Circuit',
        category: 'Quantum',
        icon: '🎨',
        handler: () => {}
      }
    ],
    languages: [
      {
        id: 'qiskit',
        name: 'Qiskit Python',
        extensions: ['.qpy', '.quantum']
      }
    ]
  }
};

// Example Plugin 5: Productivity Booster
export const productivityBoosterPlugin: CrowePlugin = {
  id: 'crowe.productivity-booster',
  name: 'Productivity Booster',
  version: '3.2.1',
  description: 'Collection of productivity tools and shortcuts',
  author: 'CroweCode Community',
  category: 'productivity',
  permissions: ['editor', 'workspace'],
  icon: '🚀',

  async activate(context: PluginContext) {
    // Auto-save functionality
    let autoSaveInterval: NodeJS.Timeout;

    const startAutoSave = () => {
      autoSaveInterval = setInterval(() => {
        const editor = context.editor.getActiveEditor();
        if (editor) {
          // Trigger save (would integrate with actual save mechanism)
          console.log('Auto-saving...');
        }
      }, 30000); // 30 seconds
    };

    startAutoSave();

    // Code formatter command
    context.editor.registerCommand('productivity.formatDocument', async () => {
      const editor = context.editor.getActiveEditor();
      if (editor) {
        // Trigger Monaco's built-in formatter
        await editor.getAction('editor.action.formatDocument')?.run();
        context.ui.showMessage('📝 Document formatted', 'info');
      }
    });

    // Duplicate line command
    context.editor.registerCommand('productivity.duplicateLine', async () => {
      const editor = context.editor.getActiveEditor();
      if (editor) {
        await editor.getAction('editor.action.duplicateSelection')?.run();
      }
    });

    // Word count display
    const wordCountItem = context.ui.createStatusBarItem('word-count');

    const updateWordCount = () => {
      const editor = context.editor.getActiveEditor();
      if (editor) {
        const model = editor.getModel();
        if (model) {
          const text = model.getValue();
          const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
          wordCountItem.text = `📝 ${wordCount} words`;
        }
      }
    };

    // Update word count on text changes
    context.events.onDidChangeTextDocument(() => {
      updateWordCount();
    });

    updateWordCount();
    wordCountItem.show();

    context.subscriptions.push(
      wordCountItem,
      { dispose: () => clearInterval(autoSaveInterval) }
    );
  },

  contributes: {
    commands: [
      {
        id: 'productivity.formatDocument',
        title: 'Format Document',
        category: 'Productivity',
        icon: '📝',
        handler: () => {}
      },
      {
        id: 'productivity.duplicateLine',
        title: 'Duplicate Line',
        category: 'Productivity',
        icon: '📋',
        handler: () => {}
      }
    ],
    keybindings: [
      {
        key: 'Shift+Alt+F',
        command: 'productivity.formatDocument'
      },
      {
        key: 'Shift+Alt+D',
        command: 'productivity.duplicateLine'
      }
    ]
  }
};

// Export all example plugins
export const examplePlugins = [
  gitEnhancedPlugin,
  aiCodeAssistantPlugin,
  tradingToolsPlugin,
  quantumComputingPlugin,
  productivityBoosterPlugin
];