import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/ai-provider';

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now - userLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { context, currentLine, language, filename } = await request.json();

    // Validate input
    if (!context || typeof context !== 'string') {
      return NextResponse.json(
        { error: 'Invalid context provided' },
        { status: 400 }
      );
    }

    // Limit context size to prevent excessive API usage
    const maxContextLength = 8000;
    const limitedContext = context.length > maxContextLength
      ? context.substring(context.length - maxContextLength)
      : context;

    // Generate AI suggestions based on language and context
    const suggestions = await generateCodeSuggestions({
      context: limitedContext,
      currentLine: currentLine || '',
      language: language || 'javascript',
      filename: filename || 'untitled'
    });

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('AI suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

interface SuggestionContext {
  context: string;
  currentLine: string;
  language: string;
  filename: string;
}

async function generateCodeSuggestions({
  context,
  currentLine,
  language,
  filename
}: SuggestionContext): Promise<string[]> {
  // Create language-specific prompts
  const languageInstructions = getLanguageInstructions(language);
  const codePattern = detectCodePattern(context, currentLine);

  const prompt = `You are an expert ${language} developer working in CroweCode IDE. Analyze the code context and provide intelligent code completion suggestions.

CONTEXT:
\`\`\`${language}
${context}
\`\`\`

CURRENT LINE (cursor position): "${currentLine}"
FILENAME: ${filename}
LANGUAGE: ${language}

${languageInstructions}

TASK: Provide 3-5 contextually relevant code completions for the current cursor position. Consider:
1. The existing code structure and patterns
2. Variable names and function signatures in scope
3. ${language}-specific best practices
4. The likely intent based on the current line
5. Code pattern: ${codePattern}

REQUIREMENTS:
- Provide ONLY the completion text (what should be inserted at cursor)
- Each suggestion should be on a new line
- No explanations or markdown formatting
- Focus on the most likely completions first
- Keep suggestions concise but complete
- Consider variable scope and type context

EXAMPLES OF GOOD COMPLETIONS:
- Function calls with proper parameters
- Variable assignments with appropriate types
- Control flow structures
- Object property access
- Method chaining continuations

Suggestions:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const suggestions = content.text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('EXAMPLE') && !line.startsWith('SUGGESTION'))
        .slice(0, 5); // Limit to 5 suggestions

      return suggestions.length > 0 ? suggestions : getDefaultSuggestions(language, currentLine);
    }

    return getDefaultSuggestions(language, currentLine);

  } catch (error) {
    console.error('Anthropic API error:', error);
    return getDefaultSuggestions(language, currentLine);
  }
}

function getLanguageInstructions(language: string): string {
  const instructions: { [key: string]: string } = {
    'javascript': `
Focus on modern ES6+ JavaScript patterns:
- Use const/let instead of var
- Arrow functions and destructuring
- Async/await patterns
- Promise chains
- Modern API usage`,

    'typescript': `
Focus on TypeScript best practices:
- Proper type annotations
- Interface definitions
- Generic type parameters
- Type guards and assertions
- Utility types usage`,

    'python': `
Focus on Python best practices:
- PEP 8 style guidelines
- Type hints where appropriate
- List/dict comprehensions
- Context managers
- Exception handling`,

    'react': `
Focus on React patterns:
- Functional components with hooks
- JSX syntax
- Event handlers
- State management
- Component lifecycle`,

    'crowe': `
Focus on Crowe language patterns:
- Agent definitions
- Pipeline configurations
- Neural network structures
- Trading strategies
- Quantum computing constructs
- Mycelium network patterns`,

    'rust': `
Focus on Rust patterns:
- Memory safety
- Error handling with Result
- Pattern matching
- Ownership and borrowing
- Trait implementations`,

    'go': `
Focus on Go patterns:
- Error handling
- Goroutines and channels
- Interface implementations
- Package structure
- Idiomatic Go code`
  };

  return instructions[language] || instructions['javascript'];
}

function detectCodePattern(context: string, currentLine: string): string {
  // Analyze the context to determine what kind of code is being written
  const lowerContext = context.toLowerCase();
  const lowerLine = currentLine.toLowerCase();

  if (lowerLine.includes('function') || lowerLine.includes('func')) {
    return 'function_definition';
  }

  if (lowerLine.includes('class')) {
    return 'class_definition';
  }

  if (lowerLine.includes('import') || lowerLine.includes('from')) {
    return 'import_statement';
  }

  if (lowerLine.includes('if') || lowerLine.includes('else')) {
    return 'conditional_statement';
  }

  if (lowerLine.includes('for') || lowerLine.includes('while')) {
    return 'loop_statement';
  }

  if (lowerLine.includes('try') || lowerLine.includes('catch')) {
    return 'error_handling';
  }

  if (lowerLine.includes('.') && !lowerLine.includes('..')) {
    return 'method_chaining';
  }

  if (lowerLine.includes('=') && !lowerLine.includes('==')) {
    return 'variable_assignment';
  }

  if (lowerLine.includes('const') || lowerLine.includes('let') || lowerLine.includes('var')) {
    return 'variable_declaration';
  }

  // Crowe-specific patterns
  if (lowerContext.includes('agent') || lowerLine.includes('agent')) {
    return 'agent_definition';
  }

  if (lowerContext.includes('pipeline') || lowerLine.includes('pipeline')) {
    return 'pipeline_definition';
  }

  if (lowerContext.includes('neural') || lowerLine.includes('neural')) {
    return 'neural_network';
  }

  return 'general_code';
}

function getDefaultSuggestions(language: string, currentLine: string): string[] {
  const defaultSuggestions: { [key: string]: string[] } = {
    'javascript': [
      'console.log()',
      'const result = ',
      'function getName() {',
      'return ',
      'if (condition) {'
    ],
    'typescript': [
      'interface IName {',
      'type TName = ',
      'const result: string = ',
      'function getName(): string {',
      'export default '
    ],
    'python': [
      'def function_name():',
      'if __name__ == "__main__":',
      'try:',
      'class ClassName:',
      'import '
    ],
    'crowe': [
      'agent AgentName {',
      'pipeline PipelineName {',
      'neural_network NetworkName {',
      'strategy StrategyName {',
      'quantum_state StateName = |0>'
    ]
  };

  return defaultSuggestions[language] || defaultSuggestions['javascript'];
}