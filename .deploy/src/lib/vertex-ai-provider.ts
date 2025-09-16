/**
 * Google Vertex AI Provider Integration
 * Replaces all existing AI providers with Vertex AI Model Garden
 */

import { GoogleAuth } from 'google-auth-library';
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

export interface VertexAIConfig {
  projectId: string;
  location: string;
  modelName: string;
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
}

export interface ModelGardenModel {
  id: string;
  name: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedLanguages: string[];
  capabilities: string[];
}

// Available models in Vertex AI Model Garden
const MODEL_GARDEN_CATALOG: ModelGardenModel[] = [
  {
    id: 'gemini-1.5-pro-002',
    name: 'Gemini 1.5 Pro',
    description: 'Most capable model for complex reasoning and long context',
    inputTokenLimit: 2097152, // 2M tokens
    outputTokenLimit: 8192,
    supportedLanguages: ['100+ languages'],
    capabilities: ['chat', 'code', 'vision', 'function-calling', 'grounding']
  },
  {
    id: 'gemini-1.5-flash-002',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and efficient for high-volume tasks',
    inputTokenLimit: 1048576, // 1M tokens
    outputTokenLimit: 8192,
    supportedLanguages: ['100+ languages'],
    capabilities: ['chat', 'code', 'vision', 'function-calling']
  },
  {
    id: 'gemini-2.0-pro-exp',
    name: 'Gemini 2.0 Pro Experimental',
    description: 'Latest experimental model with advanced capabilities',
    inputTokenLimit: 2097152,
    outputTokenLimit: 8192,
    supportedLanguages: ['100+ languages'],
    capabilities: ['chat', 'code', 'vision', 'function-calling', 'grounding', 'tools']
  },
  {
    id: 'claude-3-5-sonnet@20241022',
    name: 'Claude 3.5 Sonnet (Model Garden)',
    description: 'Anthropic Claude via Model Garden',
    inputTokenLimit: 200000,
    outputTokenLimit: 8192,
    supportedLanguages: ['Multiple languages'],
    capabilities: ['chat', 'code', 'analysis']
  },
  {
    id: 'llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision',
    description: 'Meta Llama with vision capabilities',
    inputTokenLimit: 128000,
    outputTokenLimit: 4096,
    supportedLanguages: ['Multiple languages'],
    capabilities: ['chat', 'code', 'vision']
  },
  {
    id: 'mistral-large@latest',
    name: 'Mistral Large',
    description: 'Mistral AI large model via Model Garden',
    inputTokenLimit: 128000,
    outputTokenLimit: 4096,
    supportedLanguages: ['Multiple languages'],
    capabilities: ['chat', 'code', 'function-calling']
  },
  {
    id: 'codechat-bison@002',
    name: 'Codey for Code Chat',
    description: 'Specialized for code generation and chat',
    inputTokenLimit: 32000,
    outputTokenLimit: 8192,
    supportedLanguages: ['20+ programming languages'],
    capabilities: ['code', 'chat']
  },
  {
    id: 'code-gecko@latest',
    name: 'Code Gecko',
    description: 'Lightweight code completion model',
    inputTokenLimit: 2048,
    outputTokenLimit: 256,
    supportedLanguages: ['20+ programming languages'],
    capabilities: ['code-completion']
  }
];

class VertexAIProviderManager {
  private vertexAI: VertexAI | null = null;
  private auth: GoogleAuth | null = null;
  private currentModel: string = 'gemini-1.5-pro-002';
  private projectId: string;
  private location: string;
  private modelGardenEndpoint: string;

  constructor() {
    this.projectId = process.env.GCP_PROJECT_ID || '';
    this.location = process.env.GCP_LOCATION || 'us-central1';
    this.modelGardenEndpoint = `https://${this.location}-aiplatform.googleapis.com/v1`;
    
    if (this.projectId) {
      this.initialize();
    }
  }

  private async initialize() {
    try {
      // Initialize Google Auth
      this.auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      // Initialize Vertex AI
      this.vertexAI = new VertexAI({
        project: this.projectId,
        location: this.location,
        googleAuthOptions: {
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        }
      });

      console.log('Vertex AI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Vertex AI:', error);
    }
  }

  /**
   * Get available models from Model Garden
   */
  public getAvailableModels(): ModelGardenModel[] {
    return MODEL_GARDEN_CATALOG;
  }

  /**
   * Switch to a different model
   */
  public switchModel(modelId: string) {
    const model = MODEL_GARDEN_CATALOG.find(m => m.id === modelId);
    if (model) {
      this.currentModel = modelId;
      console.log(`Switched to model: ${model.name}`);
    } else {
      throw new Error(`Model ${modelId} not found in catalog`);
    }
  }

  /**
   * Generate content using Vertex AI
   */
  public async generateContent(
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      topK?: number;
      topP?: number;
      streamResponse?: boolean;
    }
  ) {
    if (!this.vertexAI) {
      throw new Error('Vertex AI not initialized');
    }

    const model = this.vertexAI.getGenerativeModel({
      model: this.currentModel,
      generationConfig: {
        temperature: options?.temperature || 0.7,
        maxOutputTokens: options?.maxOutputTokens || 2048,
        topK: options?.topK || 40,
        topP: options?.topP || 0.95,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    // Convert messages to Vertex AI format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    if (options?.streamResponse) {
      const result = await model.generateContentStream({ contents });
      return result;
    } else {
      const result = await model.generateContent({ contents });
      const candidates = result.response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts?.[0]?.text) {
        return candidates[0].content.parts[0].text;
      }
      return '';
    }
  }

  /**
   * Generate code using specialized code models
   */
  public async generateCode(
    prompt: string,
    language: string,
    context?: string
  ) {
    // Switch to code-specialized model
    const previousModel = this.currentModel;
    this.switchModel('codechat-bison@002');

    const codePrompt = `
Language: ${language}
Context: ${context || 'General programming task'}

Task: ${prompt}

Please provide clean, well-commented code following best practices.
`;

    try {
      const result = await this.generateContent([
        { role: 'user', content: codePrompt }
      ], {
        temperature: 0.5,
        maxOutputTokens: 4096,
      });

      // Restore previous model
      this.currentModel = previousModel;
      return result;
    } catch (error) {
      this.currentModel = previousModel;
      throw error;
    }
  }

  /**
   * Analyze code using Vertex AI
   */
  public async analyzeCode(
    code: string,
    language: string,
    analysisType: 'review' | 'optimize' | 'debug' | 'document'
  ) {
    const prompts = {
      review: 'Review this code for bugs, security issues, and best practices',
      optimize: 'Optimize this code for performance and readability',
      debug: 'Debug this code and identify any issues',
      document: 'Add comprehensive documentation and comments to this code'
    };

    const analysisPrompt = `
${prompts[analysisType]}:

Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\`

Provide detailed analysis with specific suggestions and improved code if applicable.
`;

    return await this.generateContent([
      { role: 'user', content: analysisPrompt }
    ], {
      temperature: 0.3,
      maxOutputTokens: 4096,
    });
  }

  /**
   * Use Model Garden for custom models
   */
  public async callModelGarden(
    modelEndpoint: string,
    payload: any
  ) {
    if (!this.auth) {
      throw new Error('Google Auth not initialized');
    }

    const client = await this.auth.getClient();
    const accessToken = await client.getAccessToken();

    const response = await fetch(
      `${this.modelGardenEndpoint}/projects/${this.projectId}/locations/${this.location}/endpoints/${modelEndpoint}:predict`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [payload],
          parameters: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Model Garden API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get model capabilities for display
   */
  public getModelInfo(): {
    provider: string;
    model: string;
    capabilities: string;
  } {
    const model = MODEL_GARDEN_CATALOG.find(m => m.id === this.currentModel);
    return {
      provider: 'Google Vertex AI',
      model: model?.name || this.currentModel,
      capabilities: model?.capabilities.join(', ') || 'Advanced AI capabilities'
    };
  }

  /**
   * Check if Vertex AI is configured
   */
  public isConfigured(): boolean {
    return !!this.vertexAI && !!this.projectId;
  }
}

// Singleton instance
export const vertexAIProvider = new VertexAIProviderManager();

// Export for testing
export default VertexAIProviderManager;
