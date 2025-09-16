import Anthropic from "@anthropic-ai/sdk";

export interface AgentCapability {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

export interface CroweCoderAgent {
  name: string;
  avatar: string;
  personality: string;
  capabilities: AgentCapability[];
  processMessage: (message: string, context?: any) => Promise<string>;
}

class ClaudeCodeAgent {
  private anthropic: Anthropic;
  private systemPrompt: string;
  private capabilities: Map<string, AgentCapability>;
  
  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
    this.capabilities = new Map();
    this.systemPrompt = `You are Crowe Coder, an elite AI programming assistant created by Crowe Logic™.
    
Your personality:
- Expert developer with deep knowledge across all programming languages and frameworks
- Friendly, enthusiastic, and encouraging while maintaining professionalism
- You love solving complex problems and optimizing code
- You provide clear, concise explanations with practical examples
- You proactively suggest improvements and best practices
- You have a slight preference for cutting-edge technologies and elegant solutions

Your capabilities:
- Generate production-ready code in any language
- Debug and fix complex issues
- Optimize performance and security
- Create comprehensive tests
- Refactor and modernize legacy code
- Explain concepts clearly to developers of all levels
- Install packages and manage dependencies
- Execute terminal commands
- Analyze and improve code architecture

Always sign your responses with subtle confidence and add value beyond what's asked.
When suggesting commands or code, ensure they're production-ready and follow best practices.`;
    
    this.initializeCapabilities();
  }

  private initializeCapabilities() {
    // File Operations
    this.registerCapability({
      name: "analyzeCode",
      description: "Analyze code for improvements, bugs, and optimizations",
      execute: async ({ code, language }) => {
        const response = await this.anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 2048,
          system: this.systemPrompt,
          messages: [{
            role: "user",
            content: `Analyze this ${language} code and provide specific improvements:\n\n${code}`
          }]
        });
        return response.content[0];
      }
    });

    // Code Generation
    this.registerCapability({
      name: "generateCode",
      description: "Generate code based on requirements",
      execute: async ({ requirements, language, framework }) => {
        const response = await this.anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 4096,
          system: this.systemPrompt,
          messages: [{
            role: "user",
            content: `Generate ${language} code ${framework ? `using ${framework}` : ''} for: ${requirements}`
          }]
        });
        return response.content[0];
      }
    });

    // Debugging
    this.registerCapability({
      name: "debugCode",
      description: "Debug code and fix errors",
      execute: async ({ code, error, language }) => {
        const response = await this.anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 2048,
          system: this.systemPrompt,
          messages: [{
            role: "user",
            content: `Debug this ${language} code that produces error: ${error}\n\nCode:\n${code}`
          }]
        });
        return response.content[0];
      }
    });

    // Test Generation
    this.registerCapability({
      name: "generateTests",
      description: "Generate comprehensive tests for code",
      execute: async ({ code, framework, language }) => {
        const response = await this.anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 3072,
          system: this.systemPrompt,
          messages: [{
            role: "user",
            content: `Generate comprehensive ${framework || 'unit'} tests for this ${language} code:\n\n${code}`
          }]
        });
        return response.content[0];
      }
    });

    // Package Management
    this.registerCapability({
      name: "suggestPackages",
      description: "Suggest packages for specific functionality",
      execute: async ({ functionality, language }) => {
        const response = await this.anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          system: this.systemPrompt,
          messages: [{
            role: "user",
            content: `Suggest the best ${language} packages/libraries for: ${functionality}. Include installation commands.`
          }]
        });
        return response.content[0];
      }
    });

    // Code Review
    this.registerCapability({
      name: "reviewCode",
      description: "Perform comprehensive code review",
      execute: async ({ code, language, type = "security,performance,maintainability" }) => {
        const response = await this.anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 3072,
          system: this.systemPrompt,
          messages: [{
            role: "user",
            content: `Review this ${language} code for ${type}:\n\n${code}`
          }]
        });
        return response.content[0];
      }
    });
  }

  registerCapability(capability: AgentCapability) {
    this.capabilities.set(capability.name, capability);
  }

  async executeCapability(name: string, params: any) {
    const capability = this.capabilities.get(name);
    if (!capability) {
      throw new Error(`Capability ${name} not found`);
    }
    return capability.execute(params);
  }

  async chat(messages: Array<{ role: string; content: string }>, context?: any) {
    try {
      // Add context to system prompt if provided
      let enhancedSystemPrompt = this.systemPrompt;
      if (context) {
        enhancedSystemPrompt += `\n\nCurrent context:\n- File: ${context.currentFile || 'none'}\n- Language: ${context.language || 'typescript'}\n- Project: ${context.projectName || 'Crowe Logic Platform'}`;
      }

      const response = await this.anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 4096,
        temperature: 0.7,
        system: enhancedSystemPrompt,
        messages: messages.map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content
        }))
      });

      return {
        content: response.content[0].type === 'text' ? (response.content[0] as any).text : '',
        usage: response.usage
      };
    } catch (error: any) {
      console.error("Crowe Coder error:", error);
      throw error;
    }
  }

  getCapabilities() {
    return Array.from(this.capabilities.values());
  }
}

// Create Crowe Coder Agent instance
export function createCroweCoderAgent(apiKey: string): CroweCoderAgent {
  const agent = new ClaudeCodeAgent(apiKey);
  
  return {
    name: "Crowe Coder",
    avatar: "/crowe-avatar.png",
    personality: "Elite AI Programming Assistant",
    capabilities: agent.getCapabilities(),
    processMessage: async (message: string, context?: any) => {
      // Check for capability triggers
      const lowerMessage = message.toLowerCase();
      
      // Auto-detect intent and execute capabilities
      if (lowerMessage.includes("analyze") || lowerMessage.includes("review")) {
        if (context?.currentCode) {
          const result = await agent.executeCapability("analyzeCode", {
            code: context.currentCode,
            language: context.language || "typescript"
          });
          return result.text || result;
        }
      }
      
      if (lowerMessage.includes("generate test") || lowerMessage.includes("write test")) {
        if (context?.currentCode) {
          const result = await agent.executeCapability("generateTests", {
            code: context.currentCode,
            language: context.language || "typescript",
            framework: context.testFramework || "jest"
          });
          return result.text || result;
        }
      }
      
      if (lowerMessage.includes("debug") || lowerMessage.includes("fix")) {
        if (context?.currentCode && context?.error) {
          const result = await agent.executeCapability("debugCode", {
            code: context.currentCode,
            error: context.error,
            language: context.language || "typescript"
          });
          return result.text || result;
        }
      }
      
      if (lowerMessage.includes("install") || lowerMessage.includes("package")) {
        const packageMatch = message.match(/(?:install|add|need)\s+(\S+)/i);
        if (packageMatch) {
          return `I'll help you install ${packageMatch[1]}. Run this command:\n\n\`\`\`bash\nnpm install ${packageMatch[1]}\n\`\`\`\n\nThis package will be added to your project dependencies.`;
        }
      }
      
      // Default chat response
      const response = await agent.chat([{ role: "user", content: message }], context);
      return response.content;
    }
  };
}

export default ClaudeCodeAgent;