import type { editor, languages, Position, Range } from 'monaco-editor';

export interface RefactoringAction {
  id: string;
  title: string;
  description: string;
  category: 'extract' | 'rename' | 'organize' | 'generate' | 'optimize';
  icon: string;
  execute: (editor: editor.IStandaloneCodeEditor, range?: Range) => Promise<void>;
  isApplicable: (editor: editor.IStandaloneCodeEditor, position: Position) => boolean;
}

export class RefactoringProvider {
  private static instance: RefactoringProvider;
  private actions: RefactoringAction[] = [];

  static getInstance(): RefactoringProvider {
    if (!RefactoringProvider.instance) {
      RefactoringProvider.instance = new RefactoringProvider();
    }
    return RefactoringProvider.instance;
  }

  constructor() {
    this.initializeActions();
  }

  private initializeActions(): void {
    this.actions = [
      // Extract Method
      {
        id: 'extract-method',
        title: 'Extract Method',
        description: 'Extract selected code into a new method',
        category: 'extract',
        icon: '🔧',
        execute: async (editor, range) => {
          await this.extractMethod(editor, range);
        },
        isApplicable: (editor, position) => {
          const selection = editor.getSelection();
          return !!(selection && !selection.isEmpty());
        }
      },

      // Extract Variable
      {
        id: 'extract-variable',
        title: 'Extract Variable',
        description: 'Extract expression into a variable',
        category: 'extract',
        icon: '📦',
        execute: async (editor, range) => {
          await this.extractVariable(editor, range);
        },
        isApplicable: (editor, position) => {
          const selection = editor.getSelection();
          return !!(selection && !selection.isEmpty());
        }
      },

      // Rename Symbol
      {
        id: 'rename-symbol',
        title: 'Rename Symbol',
        description: 'Rename all occurrences of a symbol',
        category: 'rename',
        icon: '✏️',
        execute: async (editor) => {
          await this.renameSymbol(editor);
        },
        isApplicable: (editor, position) => {
          const model = editor.getModel();
          if (!model) return false;
          const word = model.getWordAtPosition(position);
          return !!word;
        }
      },

      // Organize Imports
      {
        id: 'organize-imports',
        title: 'Organize Imports',
        description: 'Sort and remove unused imports',
        category: 'organize',
        icon: '📋',
        execute: async (editor) => {
          await this.organizeImports(editor);
        },
        isApplicable: (editor) => {
          const model = editor.getModel();
          if (!model) return false;
          const content = model.getValue();
          return /import\s+/.test(content) || /from\s+['"].+['"]/.test(content);
        }
      },

      // Generate Constructor
      {
        id: 'generate-constructor',
        title: 'Generate Constructor',
        description: 'Generate constructor from class properties',
        category: 'generate',
        icon: '🏗️',
        execute: async (editor) => {
          await this.generateConstructor(editor);
        },
        isApplicable: (editor, position) => {
          const model = editor.getModel();
          if (!model) return false;
          const line = model.getLineContent(position.lineNumber);
          return /class\s+\w+/.test(line);
        }
      },

      // Generate Getters/Setters
      {
        id: 'generate-accessors',
        title: 'Generate Getters/Setters',
        description: 'Generate getter and setter methods',
        category: 'generate',
        icon: '🔑',
        execute: async (editor) => {
          await this.generateAccessors(editor);
        },
        isApplicable: (editor, position) => {
          const model = editor.getModel();
          if (!model) return false;
          const line = model.getLineContent(position.lineNumber);
          return /private\s+\w+\s*:/.test(line) || /public\s+\w+\s*:/.test(line);
        }
      },

      // Convert to Arrow Function
      {
        id: 'convert-arrow-function',
        title: 'Convert to Arrow Function',
        description: 'Convert function declaration to arrow function',
        category: 'optimize',
        icon: '➡️',
        execute: async (editor) => {
          await this.convertToArrowFunction(editor);
        },
        isApplicable: (editor, position) => {
          const model = editor.getModel();
          if (!model) return false;
          const line = model.getLineContent(position.lineNumber);
          return /function\s+\w+\s*\(/.test(line);
        }
      },

      // Add JSDoc
      {
        id: 'add-jsdoc',
        title: 'Add JSDoc Comment',
        description: 'Generate JSDoc documentation',
        category: 'generate',
        icon: '📖',
        execute: async (editor) => {
          await this.addJSDoc(editor);
        },
        isApplicable: (editor, position) => {
          const model = editor.getModel();
          if (!model) return false;
          const line = model.getLineContent(position.lineNumber);
          return /function\s+\w+\s*\(/.test(line) || /\w+\s*:\s*\(/.test(line);
        }
      },

      // Optimize Imports
      {
        id: 'optimize-imports',
        title: 'Optimize Imports',
        description: 'Convert to named imports and optimize',
        category: 'optimize',
        icon: '⚡',
        execute: async (editor) => {
          await this.optimizeImports(editor);
        },
        isApplicable: (editor) => {
          const model = editor.getModel();
          if (!model) return false;
          const content = model.getValue();
          return /import\s+\*\s+as/.test(content);
        }
      }
    ];
  }

  getApplicableActions(editor: editor.IStandaloneCodeEditor, position: Position): RefactoringAction[] {
    return this.actions.filter(action => action.isApplicable(editor, position));
  }

  getActionsByCategory(category: RefactoringAction['category']): RefactoringAction[] {
    return this.actions.filter(action => action.category === category);
  }

  async executeAction(actionId: string, editor: editor.IStandaloneCodeEditor, range?: Range): Promise<void> {
    const action = this.actions.find(a => a.id === actionId);
    if (action) {
      await action.execute(editor, range);
    }
  }

  // Refactoring implementations
  private async extractMethod(editor: editor.IStandaloneCodeEditor, range?: Range): Promise<void> {
    const selection = range || editor.getSelection();
    if (!selection || selection.isEmpty()) return;

    const model = editor.getModel();
    if (!model) return;

    const selectedText = model.getValueInRange(selection);
    const methodName = await this.promptForName('Enter method name:', 'extractedMethod');

    if (!methodName) return;

    // Analyze variables used in selection
    const variables = this.extractVariables(selectedText);
    const parameters = variables.join(', ');

    const methodDeclaration = `
  private ${methodName}(${parameters}) {
    ${selectedText}
  }`;

    const methodCall = `this.${methodName}(${parameters});`;

    // Replace selection with method call
    editor.executeEdits('extract-method', [
      {
        range: selection,
        text: methodCall
      }
    ]);

    // Add method declaration at the end of the class
    const classEnd = this.findClassEnd(model);
    if (classEnd) {
      editor.executeEdits('extract-method', [
        {
          range: { startLineNumber: classEnd, startColumn: 1, endLineNumber: classEnd, endColumn: 1 },
          text: methodDeclaration
        }
      ]);
    }
  }

  private async extractVariable(editor: editor.IStandaloneCodeEditor, range?: Range): Promise<void> {
    const selection = range || editor.getSelection();
    if (!selection || selection.isEmpty()) return;

    const model = editor.getModel();
    if (!model) return;

    const selectedText = model.getValueInRange(selection);
    const variableName = await this.promptForName('Enter variable name:', 'extractedVar');

    if (!variableName) return;

    const variableDeclaration = `const ${variableName} = ${selectedText};`;
    const lineStart = selection.startLineNumber;

    // Insert variable declaration above current line
    editor.executeEdits('extract-variable', [
      {
        range: { startLineNumber: lineStart, startColumn: 1, endLineNumber: lineStart, endColumn: 1 },
        text: variableDeclaration + '\n'
      },
      {
        range: selection,
        text: variableName
      }
    ]);
  }

  private async renameSymbol(editor: editor.IStandaloneCodeEditor): Promise<void> {
    const position = editor.getPosition();
    if (!position) return;

    const model = editor.getModel();
    if (!model) return;

    const word = model.getWordAtPosition(position);
    if (!word) return;

    const newName = await this.promptForName(`Rename "${word.word}" to:`, word.word);
    if (!newName || newName === word.word) return;

    // Find all occurrences
    const matches = model.findMatches(
      word.word,
      true,
      false,
      true,
      null,
      true
    );

    // Replace all occurrences
    const edits = matches.map(match => ({
      range: match.range,
      text: newName
    }));

    editor.executeEdits('rename-symbol', edits);
  }

  private async organizeImports(editor: editor.IStandaloneCodeEditor): Promise<void> {
    const model = editor.getModel();
    if (!model) return;

    const content = model.getValue();
    const lines = content.split('\n');

    let imports: string[] = [];
    let otherLines: string[] = [];
    let inImportSection = true;

    for (const line of lines) {
      if (line.trim().startsWith('import ') || line.trim().startsWith('from ')) {
        imports.push(line);
      } else if (line.trim() === '') {
        if (inImportSection) {
          // Keep empty lines in import section
          imports.push(line);
        } else {
          otherLines.push(line);
        }
      } else {
        inImportSection = false;
        otherLines.push(line);
      }
    }

    // Sort imports
    imports = imports
      .filter(imp => imp.trim() !== '')
      .sort((a, b) => {
        // Sort order: third-party imports, then relative imports
        const aIsRelative = a.includes('./') || a.includes('../');
        const bIsRelative = b.includes('./') || b.includes('../');

        if (aIsRelative && !bIsRelative) return 1;
        if (!aIsRelative && bIsRelative) return -1;
        return a.localeCompare(b);
      });

    const organizedContent = [...imports, '', ...otherLines].join('\n');

    editor.executeEdits('organize-imports', [
      {
        range: model.getFullModelRange(),
        text: organizedContent
      }
    ]);
  }

  private async generateConstructor(editor: editor.IStandaloneCodeEditor): Promise<void> {
    const model = editor.getModel();
    if (!model) return;

    const content = model.getValue();
    const properties = this.extractClassProperties(content);

    if (properties.length === 0) return;

    const parameters = properties.map(prop => `${prop.name}: ${prop.type}`).join(', ');
    const assignments = properties.map(prop => `    this.${prop.name} = ${prop.name};`).join('\n');

    const constructor = `
  constructor(${parameters}) {
${assignments}
  }`;

    // Find class opening brace and insert after it
    const classMatch = content.match(/class\s+\w+[^{]*\{/);
    if (!classMatch) return;

    const insertPosition = content.indexOf(classMatch[0]) + classMatch[0].length;
    const position = model.getPositionAt(insertPosition);

    editor.executeEdits('generate-constructor', [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: constructor
      }
    ]);
  }

  private async generateAccessors(editor: editor.IStandaloneCodeEditor): Promise<void> {
    const position = editor.getPosition();
    if (!position) return;

    const model = editor.getModel();
    if (!model) return;

    const line = model.getLineContent(position.lineNumber);
    const propertyMatch = line.match(/(private|public)\s+(\w+)\s*:\s*(\w+)/);

    if (!propertyMatch) return;

    const [, , propName, propType] = propertyMatch;
    const capitalizedName = propName.charAt(0).toUpperCase() + propName.slice(1);

    const getter = `
  get ${propName}(): ${propType} {
    return this.${propName};
  }`;

    const setter = `
  set ${propName}(value: ${propType}) {
    this.${propName} = value;
  }`;

    const classEnd = this.findClassEnd(model);
    if (classEnd) {
      editor.executeEdits('generate-accessors', [
        {
          range: { startLineNumber: classEnd, startColumn: 1, endLineNumber: classEnd, endColumn: 1 },
          text: getter + setter
        }
      ]);
    }
  }

  private async convertToArrowFunction(editor: editor.IStandaloneCodeEditor): Promise<void> {
    const position = editor.getPosition();
    if (!position) return;

    const model = editor.getModel();
    if (!model) return;

    const line = model.getLineContent(position.lineNumber);
    const functionMatch = line.match(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/);

    if (!functionMatch) return;

    const [fullMatch, funcName, params] = functionMatch;
    const arrowFunction = `const ${funcName} = (${params}) => {`;

    const range = {
      startLineNumber: position.lineNumber,
      startColumn: line.indexOf(fullMatch) + 1,
      endLineNumber: position.lineNumber,
      endColumn: line.indexOf(fullMatch) + fullMatch.length + 1
    };

    editor.executeEdits('convert-arrow-function', [
      {
        range,
        text: arrowFunction
      }
    ]);
  }

  private async addJSDoc(editor: editor.IStandaloneCodeEditor): Promise<void> {
    const position = editor.getPosition();
    if (!position) return;

    const model = editor.getModel();
    if (!model) return;

    const line = model.getLineContent(position.lineNumber);
    const functionMatch = line.match(/function\s+(\w+)\s*\(([^)]*)\)/);

    if (!functionMatch) return;

    const [, funcName, params] = functionMatch;
    const paramNames = params.split(',').map(p => p.trim().split(':')[0].trim()).filter(p => p);

    const jsdoc = `/**
 * Description of ${funcName}
${paramNames.map(param => ` * @param {*} ${param} - Description of ${param}`).join('\n')}
 * @returns {*} Description of return value
 */
`;

    editor.executeEdits('add-jsdoc', [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: 1
        },
        text: jsdoc
      }
    ]);
  }

  private async optimizeImports(editor: editor.IStandaloneCodeEditor): Promise<void> {
    const model = editor.getModel();
    if (!model) return;

    const content = model.getValue();

    // Convert wildcard imports to named imports (simplified)
    const optimizedContent = content.replace(
      /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      'import { /* specific imports */ } from "$2"'
    );

    if (optimizedContent !== content) {
      editor.executeEdits('optimize-imports', [
        {
          range: model.getFullModelRange(),
          text: optimizedContent
        }
      ]);
    }
  }

  // Helper methods
  private async promptForName(message: string, defaultValue: string): Promise<string | null> {
    // In a real implementation, this would show a modal dialog
    return prompt(message, defaultValue);
  }

  private extractVariables(code: string): string[] {
    // Simplified variable extraction
    const variables = new Set<string>();
    const variableRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    let match;

    while ((match = variableRegex.exec(code)) !== null) {
      const variable = match[1];
      if (!['const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while'].includes(variable)) {
        variables.add(variable);
      }
    }

    return Array.from(variables);
  }

  private findClassEnd(model: editor.ITextModel): number | null {
    const content = model.getValue();
    const lines = content.split('\n');

    let braceCount = 0;
    let inClass = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('class ') && line.includes('{')) {
        inClass = true;
        braceCount = 1;
        continue;
      }

      if (inClass) {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

        if (braceCount === 0) {
          return i; // Return line number where class ends
        }
      }
    }

    return null;
  }

  private extractClassProperties(content: string): Array<{ name: string; type: string }> {
    const properties: Array<{ name: string; type: string }> = [];
    const propertyRegex = /(private|public|protected)\s+(\w+)\s*:\s*(\w+)/g;
    let match;

    while ((match = propertyRegex.exec(content)) !== null) {
      properties.push({
        name: match[2],
        type: match[3]
      });
    }

    return properties;
  }
}

// Register refactoring provider with Monaco
export function registerRefactoringProvider() {
  if (typeof window !== 'undefined') {
    import('monaco-editor').then(({ languages }) => {
      const provider = RefactoringProvider.getInstance();

      // Register code action provider
      languages.registerCodeActionProvider('typescript', {
        provideCodeActions: (model, range, context, token) => {
          const editor = monaco.editor.getEditors().find(e => e.getModel() === model);
          if (!editor) return { actions: [], dispose: () => {} };

          const position = range.getStartPosition();
          const applicableActions = provider.getApplicableActions(editor, position);

          const codeActions = applicableActions.map(action => ({
            title: action.title,
            kind: 'refactor',
            command: {
              id: action.id,
              title: action.title,
              arguments: [editor, range]
            }
          }));

          return {
            actions: codeActions,
            dispose: () => {}
          };
        }
      });
    });
  }
}