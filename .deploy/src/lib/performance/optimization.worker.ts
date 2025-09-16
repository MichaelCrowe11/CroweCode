// Web Worker for performance-intensive operations

interface WorkerMessage {
  type: 'PARSE_CODE' | 'ANALYZE_COMPLEXITY' | 'FORMAT_CODE' | 'MINIFY' | 'LINT';
  payload: any;
  id: string;
}

interface WorkerResponse {
  type: string;
  result: any;
  id: string;
  error?: string;
}

// Code complexity analyzer
function analyzeComplexity(code: string): any {
  const lines = code.split('\n');
  const metrics = {
    lines: lines.length,
    complexity: 0,
    functions: 0,
    classes: 0,
    imports: 0,
    variables: 0,
    comments: 0
  };

  // Simple regex-based analysis
  lines.forEach(line => {
    const trimmed = line.trim();

    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      metrics.comments++;
    }
    if (trimmed.includes('function') || trimmed.includes('=>')) {
      metrics.functions++;
      metrics.complexity += 1;
    }
    if (trimmed.includes('class ')) {
      metrics.classes++;
      metrics.complexity += 2;
    }
    if (trimmed.includes('import ') || trimmed.includes('require(')) {
      metrics.imports++;
    }
    if (trimmed.includes('const ') || trimmed.includes('let ') || trimmed.includes('var ')) {
      metrics.variables++;
    }
    if (trimmed.includes('if ') || trimmed.includes('else')) {
      metrics.complexity += 1;
    }
    if (trimmed.includes('for ') || trimmed.includes('while ')) {
      metrics.complexity += 2;
    }
    if (trimmed.includes('try ') || trimmed.includes('catch ')) {
      metrics.complexity += 1;
    }
  });

  return metrics;
}

// Code parser for syntax validation
function parseCode(code: string, language: string): any {
  try {
    // Basic syntax checking
    const errors: any[] = [];
    const warnings: any[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for common issues
      if (line.length > 120) {
        warnings.push({
          line: index + 1,
          message: 'Line exceeds 120 characters',
          severity: 'warning'
        });
      }

      // Check for console.log in production code
      if (line.includes('console.log') && !line.includes('//')) {
        warnings.push({
          line: index + 1,
          message: 'console.log found in code',
          severity: 'warning'
        });
      }

      // Check for TODO comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        warnings.push({
          line: index + 1,
          message: 'TODO/FIXME comment found',
          severity: 'info'
        });
      }

      // Basic bracket matching
      const openBrackets = (line.match(/[{[(]/g) || []).length;
      const closeBrackets = (line.match(/[}\])]/g) || []).length;

      if (openBrackets !== closeBrackets) {
        // This is a simple check, more sophisticated parsing needed
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      language
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

// Code formatter (simplified)
function formatCode(code: string, options: any = {}): string {
  const {
    tabSize = 2,
    useTabs = false,
    lineWidth = 80
  } = options;

  const indent = useTabs ? '\t' : ' '.repeat(tabSize);
  let formatted = code;
  let indentLevel = 0;

  // Very basic formatting
  const lines = formatted.split('\n');
  const formattedLines: string[] = [];

  lines.forEach(line => {
    const trimmed = line.trim();

    // Decrease indent for closing brackets
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Add proper indentation
    if (trimmed) {
      formattedLines.push(indent.repeat(indentLevel) + trimmed);
    } else {
      formattedLines.push('');
    }

    // Increase indent for opening brackets
    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
      indentLevel++;
    }
  });

  return formattedLines.join('\n');
}

// Code minification
function minifyCode(code: string): string {
  // Remove comments
  let minified = code.replace(/\/\*[\s\S]*?\*\//g, '');
  minified = minified.replace(/\/\/.*/g, '');

  // Remove unnecessary whitespace
  minified = minified.replace(/\s+/g, ' ');
  minified = minified.replace(/\s*([{}();,:])\s*/g, '$1');

  // Remove line breaks
  minified = minified.replace(/\n/g, '');

  return minified.trim();
}

// Basic linting
function lintCode(code: string, rules: any = {}): any[] {
  const issues: any[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // No var rule
    if (rules.noVar !== false && line.includes('var ')) {
      issues.push({
        line: lineNum,
        column: line.indexOf('var '),
        severity: 'error',
        message: 'Use let or const instead of var',
        rule: 'no-var'
      });
    }

    // No eval rule
    if (rules.noEval !== false && line.includes('eval(')) {
      issues.push({
        line: lineNum,
        column: line.indexOf('eval('),
        severity: 'error',
        message: 'eval() is dangerous and should be avoided',
        rule: 'no-eval'
      });
    }

    // Prefer const
    if (rules.preferConst !== false && line.includes('let ')) {
      // This is simplified - would need proper AST analysis
      issues.push({
        line: lineNum,
        column: line.indexOf('let '),
        severity: 'warning',
        message: 'Consider using const if variable is never reassigned',
        rule: 'prefer-const'
      });
    }

    // No debugger
    if (rules.noDebugger !== false && line.includes('debugger')) {
      issues.push({
        line: lineNum,
        column: line.indexOf('debugger'),
        severity: 'error',
        message: 'Remove debugger statement',
        rule: 'no-debugger'
      });
    }

    // Trailing spaces
    if (rules.noTrailingSpaces !== false && line !== line.trimEnd()) {
      issues.push({
        line: lineNum,
        column: line.trimEnd().length,
        severity: 'warning',
        message: 'Trailing spaces',
        rule: 'no-trailing-spaces'
      });
    }
  });

  return issues;
}

// Message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;
  let response: WorkerResponse;

  try {
    switch (type) {
      case 'PARSE_CODE':
        response = {
          type: 'PARSE_CODE_RESULT',
          result: parseCode(payload.code, payload.language),
          id
        };
        break;

      case 'ANALYZE_COMPLEXITY':
        response = {
          type: 'ANALYZE_COMPLEXITY_RESULT',
          result: analyzeComplexity(payload.code),
          id
        };
        break;

      case 'FORMAT_CODE':
        response = {
          type: 'FORMAT_CODE_RESULT',
          result: formatCode(payload.code, payload.options),
          id
        };
        break;

      case 'MINIFY':
        response = {
          type: 'MINIFY_RESULT',
          result: minifyCode(payload.code),
          id
        };
        break;

      case 'LINT':
        response = {
          type: 'LINT_RESULT',
          result: lintCode(payload.code, payload.rules),
          id
        };
        break;

      default:
        response = {
          type: 'ERROR',
          result: null,
          id,
          error: `Unknown message type: ${type}`
        };
    }
  } catch (error: any) {
    response = {
      type: 'ERROR',
      result: null,
      id,
      error: error.message
    };
  }

  self.postMessage(response);
};

// Export for TypeScript
export {};