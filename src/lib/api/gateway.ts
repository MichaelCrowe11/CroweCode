/**
 * CroweCode™ Unified API Gateway
 * Enterprise-grade API gateway with authentication, rate limiting, and service orchestration
 * Routes requests to all CroweCode services with security and monitoring
 */

import { croweCodeServiceIntegration } from '../integration/service-integration';
import { aiProviderManager } from '../ai-provider';
import { croweCodeAutonomousAgent } from '../ai/autonomous-agent';
import { croweCodeMarketplace } from '../marketplace/marketplace-manager';
import { croweCodeCollaboration } from '../collaboration/real-time-collaboration';
import { croweCodePipelineManager } from '../ci-cd/pipeline-integration';
import { croweCodeAnalysisEngine } from '../analysis/code-analysis-engine';
import { croweCodeDeploymentManager } from '../deployment/deployment-manager';

export interface APIRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  user?: AuthenticatedUser;
  timestamp: Date;
  ip: string;
  userAgent: string;
}

export interface APIResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  duration: number;
  cached: boolean;
  rateLimited: boolean;
  timestamp: Date;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  subscription: SubscriptionInfo;
  rateLimit: RateLimitInfo;
  session: SessionInfo;
}

export type UserRole = 'admin' | 'enterprise' | 'pro' | 'developer' | 'free' | 'guest';

export interface Permission {
  resource: string;
  actions: string[];
  scope: 'global' | 'project' | 'organization';
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'in' | 'not-in' | 'contains' | 'greater-than' | 'less-than';
  value: string | string[] | number;
}

export interface SubscriptionInfo {
  plan: 'free' | 'pro' | 'enterprise' | 'custom';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  features: string[];
  limits: SubscriptionLimits;
  expiresAt?: Date;
  trialEndsAt?: Date;
}

export interface SubscriptionLimits {
  apiCallsPerHour: number;
  concurrentUsers: number;
  projectsMax: number;
  storageGB: number;
  computeUnits: number;
  aiTokensPerMonth: number;
  collaborators: number;
  deployments: number;
}

export interface RateLimitInfo {
  requestsRemaining: number;
  requestsMax: number;
  resetTime: Date;
  burst: number;
  burstRemaining: number;
}

export interface SessionInfo {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  ip: string;
  userAgent: string;
  expiresAt: Date;
}

export interface RouteConfig {
  path: string;
  method: string;
  service: string;
  handler: string;
  auth: AuthConfig;
  rateLimit: RateLimitConfig;
  cache: CacheConfig;
  validation: ValidationConfig;
  documentation: RouteDocumentation;
}

export interface AuthConfig {
  required: boolean;
  roles: UserRole[];
  permissions: Permission[];
  scopes: string[];
}

export interface RateLimitConfig {
  enabled: boolean;
  requests: number;
  window: number; // seconds
  burst: number;
  keyBy: 'ip' | 'user' | 'subscription' | 'api-key';
  skipIf?: (req: APIRequest) => boolean;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // seconds
  vary: string[];
  keyBy: string[];
  skipIf?: (req: APIRequest) => boolean;
}

export interface ValidationConfig {
  query?: ValidationSchema;
  body?: ValidationSchema;
  headers?: ValidationSchema;
  params?: ValidationSchema;
}

export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, ValidationSchema>;
  required?: string[];
  items?: ValidationSchema;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
}

export interface RouteDocumentation {
  summary: string;
  description: string;
  tags: string[];
  parameters: ParameterDoc[];
  responses: ResponseDoc[];
  examples: ExampleDoc[];
}

export interface ParameterDoc {
  name: string;
  in: 'query' | 'header' | 'path' | 'body';
  description: string;
  required: boolean;
  type: string;
  example?: any;
}

export interface ResponseDoc {
  status: number;
  description: string;
  schema?: ValidationSchema;
  examples?: Record<string, any>;
}

export interface ExampleDoc {
  name: string;
  description: string;
  request: any;
  response: any;
}

export interface MiddlewareContext {
  request: APIRequest;
  response?: APIResponse;
  user?: AuthenticatedUser;
  metadata: Record<string, any>;
  services: ServiceRegistry;
}

export interface ServiceRegistry {
  ai: AIServiceInterface;
  marketplace: MarketplaceServiceInterface;
  collaboration: CollaborationServiceInterface;
  analysis: AnalysisServiceInterface;
  cicd: CICDServiceInterface;
  deployment: DeploymentServiceInterface;
  auth: AuthServiceInterface;
  billing: BillingServiceInterface;
  storage: StorageServiceInterface;
}

export interface AIServiceInterface {
  chat(messages: any[], options?: any): Promise<any>;
  complete(prompt: string, options?: any): Promise<any>;
  analyze(code: string, language: string): Promise<any>;
  submitTask(description: string, context: any): Promise<string>;
  getTaskStatus(taskId: string): Promise<any>;
}

export interface MarketplaceServiceInterface {
  searchExtensions(query: string, options?: any): Promise<any[]>;
  installExtension(extensionId: string): Promise<any>;
  listInstalledExtensions(): Promise<any[]>;
  getMCPServers(): Promise<any[]>;
}

export interface CollaborationServiceInterface {
  createSession(projectId: string, settings?: any): Promise<string>;
  joinSession(sessionId: string, userId: string): Promise<boolean>;
  getActiveSessions(): Promise<any[]>;
  getSessionInfo(sessionId: string): Promise<any>;
}

export interface AnalysisServiceInterface {
  analyzeProject(projectPath: string, config?: any): Promise<string>;
  getAnalysisResults(projectId: string): Promise<any>;
  getProjectSummary(projectId: string): Promise<any>;
}

export interface CICDServiceInterface {
  createPipeline(config: any): Promise<string>;
  executePipeline(pipelineId: string, trigger: any): Promise<string>;
  getPipelineStatus(pipelineId: string): Promise<any>;
  getExecutionHistory(pipelineId: string): Promise<any[]>;
}

export interface DeploymentServiceInterface {
  createConfiguration(config: any): Promise<string>;
  deploy(configId: string, version: string): Promise<string>;
  getDeploymentStatus(deploymentId: string): Promise<any>;
  rollback(deploymentId: string): Promise<string>;
}

export interface AuthServiceInterface {
  authenticate(token: string): Promise<AuthenticatedUser | null>;
  authorize(user: AuthenticatedUser, resource: string, action: string): Promise<boolean>;
  createSession(userId: string): Promise<SessionInfo>;
  validateSession(sessionId: string): Promise<boolean>;
}

export interface BillingServiceInterface {
  getSubscription(userId: string): Promise<SubscriptionInfo>;
  createSubscription(userId: string, plan: string): Promise<any>;
  updateUsage(userId: string, usage: any): Promise<void>;
  processPayment(userId: string, amount: number): Promise<any>;
}

export interface StorageServiceInterface {
  createProject(userId: string, project: any): Promise<string>;
  getProject(projectId: string): Promise<any>;
  updateProject(projectId: string, updates: any): Promise<any>;
  deleteProject(projectId: string): Promise<boolean>;
  listProjects(userId: string): Promise<any[]>;
}

class CroweCodeAPIGateway {
  private routes: Map<string, RouteConfig> = new Map();
  private middleware: Middleware[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  private rateLimiter: RateLimiter;
  private authenticator: Authenticator;
  private validator: RequestValidator;
  private logger: APILogger;
  private metrics: APIMetrics;
  private services: ServiceRegistry;

  constructor() {
    this.rateLimiter = new RateLimiter();
    this.authenticator = new Authenticator();
    this.validator = new RequestValidator();
    this.logger = new APILogger();
    this.metrics = new APIMetrics();
    this.services = this.initializeServices();
    this.setupRoutes();
    this.setupMiddleware();
    this.startCleanupTasks();
  }

  private initializeServices(): ServiceRegistry {
    return {
      ai: {
        chat: async (messages: any[], options?: any) => {
          const provider = aiProviderManager.getActiveProvider();
          if (!provider) throw new Error('No AI provider available');
          return { response: 'AI response', provider: provider.name };
        },
        complete: async (prompt: string, options?: any) => {
          const provider = aiProviderManager.getActiveProvider();
          if (!provider) throw new Error('No AI provider available');
          return { completion: 'AI completion', provider: provider.name };
        },
        analyze: async (code: string, language: string) => {
          return { analysis: 'Code analysis result', language };
        },
        submitTask: async (description: string, context: any) => {
          return await croweCodeAutonomousAgent.submitTask(description, context);
        },
        getTaskStatus: async (taskId: string) => {
          return croweCodeAutonomousAgent.getTaskStatus(taskId);
        }
      },
      marketplace: {
        searchExtensions: async (query: string, options?: any) => {
          return await croweCodeMarketplace.searchMarketplace(query, options);
        },
        installExtension: async (extensionId: string) => {
          return await croweCodeMarketplace.installExtension(extensionId);
        },
        listInstalledExtensions: async () => {
          return []; // Implementation would return installed extensions
        },
        getMCPServers: async () => {
          return []; // Implementation would return MCP servers
        }
      },
      collaboration: {
        createSession: async (projectId: string, settings?: any) => {
          return await croweCodeCollaboration.createSession(projectId, 'user-id', settings);
        },
        joinSession: async (sessionId: string, userId: string) => {
          return await croweCodeCollaboration.joinSession(sessionId, userId);
        },
        getActiveSessions: async () => {
          return []; // Implementation would return active sessions
        },
        getSessionInfo: async (sessionId: string) => {
          return {}; // Implementation would return session info
        }
      },
      analysis: {
        analyzeProject: async (projectPath: string, config?: any) => {
          return await croweCodeAnalysisEngine.analyzeProject(projectPath, config);
        },
        getAnalysisResults: async (projectId: string) => {
          return croweCodeAnalysisEngine.getProjectAnalysis(projectId);
        },
        getProjectSummary: async (projectId: string) => {
          return croweCodeAnalysisEngine.getAnalysisSummary(projectId);
        }
      },
      cicd: {
        createPipeline: async (config: any) => {
          return await croweCodePipelineManager.createPipeline(config);
        },
        executePipeline: async (pipelineId: string, trigger: any) => {
          return await croweCodePipelineManager.executePipeline(pipelineId, trigger);
        },
        getPipelineStatus: async (pipelineId: string) => {
          return croweCodePipelineManager.getPipelineStatus(pipelineId);
        },
        getExecutionHistory: async (pipelineId: string) => {
          return []; // Implementation would return execution history
        }
      },
      deployment: {
        createConfiguration: async (config: any) => {
          return await croweCodeDeploymentManager.createDeploymentConfiguration(config);
        },
        deploy: async (configId: string, version: string) => {
          return await croweCodeDeploymentManager.deploy(configId, version);
        },
        getDeploymentStatus: async (deploymentId: string) => {
          return croweCodeDeploymentManager.getDeploymentStatus(deploymentId);
        },
        rollback: async (deploymentId: string) => {
          return await croweCodeDeploymentManager.rollback(deploymentId);
        }
      },
      auth: {
        authenticate: async (token: string) => {
          return this.authenticator.authenticate(token);
        },
        authorize: async (user: AuthenticatedUser, resource: string, action: string) => {
          return this.authenticator.authorize(user, resource, action);
        },
        createSession: async (userId: string) => {
          return this.authenticator.createSession(userId);
        },
        validateSession: async (sessionId: string) => {
          return this.authenticator.validateSession(sessionId);
        }
      },
      billing: {
        getSubscription: async (userId: string) => {
          return this.getDefaultSubscription(); // Mock implementation
        },
        createSubscription: async (userId: string, plan: string) => {
          return { subscriptionId: 'sub_' + Date.now() };
        },
        updateUsage: async (userId: string, usage: any) => {
          // Implementation would update usage tracking
        },
        processPayment: async (userId: string, amount: number) => {
          return { paymentId: 'pay_' + Date.now(), status: 'succeeded' };
        }
      },
      storage: {
        createProject: async (userId: string, project: any) => {
          return 'project_' + Date.now();
        },
        getProject: async (projectId: string) => {
          return { id: projectId, name: 'Sample Project' };
        },
        updateProject: async (projectId: string, updates: any) => {
          return { id: projectId, ...updates };
        },
        deleteProject: async (projectId: string) => {
          return true;
        },
        listProjects: async (userId: string) => {
          return [];
        }
      }
    };
  }

  private setupRoutes(): void {
    // AI Routes
    this.addRoute({
      path: '/api/v1/ai/chat',
      method: 'POST',
      service: 'ai',
      handler: 'chat',
      auth: { required: true, roles: ['developer', 'pro', 'enterprise'], permissions: [], scopes: ['ai:chat'] },
      rateLimit: { enabled: true, requests: 100, window: 3600, burst: 10, keyBy: 'user' },
      cache: { enabled: false, ttl: 0, vary: [], keyBy: [] },
      validation: {
        body: {
          type: 'object',
          required: ['messages'],
          properties: {
            messages: { type: 'array', items: { type: 'object' } },
            model: { type: 'string' },
            temperature: { type: 'number', minimum: 0, maximum: 2 }
          }
        }
      },
      documentation: {
        summary: 'Chat with AI',
        description: 'Send messages to AI and receive responses',
        tags: ['AI'],
        parameters: [],
        responses: [
          { status: 200, description: 'Successful response', examples: { 'application/json': { response: 'AI response' } } }
        ],
        examples: []
      }
    });

    this.addRoute({
      path: '/api/v1/ai/tasks',
      method: 'POST',
      service: 'ai',
      handler: 'submitTask',
      auth: { required: true, roles: ['developer', 'pro', 'enterprise'], permissions: [], scopes: ['ai:tasks'] },
      rateLimit: { enabled: true, requests: 50, window: 3600, burst: 5, keyBy: 'user' },
      cache: { enabled: false, ttl: 0, vary: [], keyBy: [] },
      validation: {
        body: {
          type: 'object',
          required: ['description', 'context'],
          properties: {
            description: { type: 'string', minLength: 1, maxLength: 1000 },
            context: { type: 'object' }
          }
        }
      },
      documentation: {
        summary: 'Submit autonomous task',
        description: 'Submit a task to the autonomous AI agent',
        tags: ['AI', 'Tasks'],
        parameters: [],
        responses: [
          { status: 200, description: 'Task submitted', examples: { 'application/json': { taskId: 'task_123' } } }
        ],
        examples: []
      }
    });

    // Marketplace Routes
    this.addRoute({
      path: '/api/v1/marketplace/extensions/search',
      method: 'GET',
      service: 'marketplace',
      handler: 'searchExtensions',
      auth: { required: true, roles: ['developer', 'pro', 'enterprise'], permissions: [], scopes: ['marketplace:read'] },
      rateLimit: { enabled: true, requests: 1000, window: 3600, burst: 50, keyBy: 'user' },
      cache: { enabled: true, ttl: 300, vary: ['query'], keyBy: ['query'] },
      validation: {
        query: {
          type: 'object',
          properties: {
            q: { type: 'string', minLength: 1, maxLength: 100 },
            category: { type: 'string' },
            sort: { type: 'string' }
          }
        }
      },
      documentation: {
        summary: 'Search extensions',
        description: 'Search VS Code and CroweCode extensions',
        tags: ['Marketplace'],
        parameters: [
          { name: 'q', in: 'query', description: 'Search query', required: true, type: 'string' },
          { name: 'category', in: 'query', description: 'Extension category', required: false, type: 'string' }
        ],
        responses: [
          { status: 200, description: 'Search results', examples: { 'application/json': [] } }
        ],
        examples: []
      }
    });

    // Collaboration Routes
    this.addRoute({
      path: '/api/v1/collaboration/sessions',
      method: 'POST',
      service: 'collaboration',
      handler: 'createSession',
      auth: { required: true, roles: ['developer', 'pro', 'enterprise'], permissions: [], scopes: ['collaboration:write'] },
      rateLimit: { enabled: true, requests: 50, window: 3600, burst: 5, keyBy: 'user' },
      cache: { enabled: false, ttl: 0, vary: [], keyBy: [] },
      validation: {
        body: {
          type: 'object',
          required: ['projectId'],
          properties: {
            projectId: { type: 'string', minLength: 1 },
            settings: { type: 'object' }
          }
        }
      },
      documentation: {
        summary: 'Create collaboration session',
        description: 'Create a new real-time collaboration session',
        tags: ['Collaboration'],
        parameters: [],
        responses: [
          { status: 200, description: 'Session created', examples: { 'application/json': { sessionId: 'session_123' } } }
        ],
        examples: []
      }
    });

    // Analysis Routes
    this.addRoute({
      path: '/api/v1/analysis/projects',
      method: 'POST',
      service: 'analysis',
      handler: 'analyzeProject',
      auth: { required: true, roles: ['developer', 'pro', 'enterprise'], permissions: [], scopes: ['analysis:write'] },
      rateLimit: { enabled: true, requests: 20, window: 3600, burst: 2, keyBy: 'user' },
      cache: { enabled: false, ttl: 0, vary: [], keyBy: [] },
      validation: {
        body: {
          type: 'object',
          required: ['projectPath'],
          properties: {
            projectPath: { type: 'string', minLength: 1 },
            configuration: { type: 'object' }
          }
        }
      },
      documentation: {
        summary: 'Analyze project',
        description: 'Start comprehensive code analysis of a project',
        tags: ['Analysis'],
        parameters: [],
        responses: [
          { status: 200, description: 'Analysis started', examples: { 'application/json': { projectId: 'project_123' } } }
        ],
        examples: []
      }
    });

    // CI/CD Routes
    this.addRoute({
      path: '/api/v1/cicd/pipelines',
      method: 'POST',
      service: 'cicd',
      handler: 'createPipeline',
      auth: { required: true, roles: ['developer', 'pro', 'enterprise'], permissions: [], scopes: ['cicd:write'] },
      rateLimit: { enabled: true, requests: 30, window: 3600, burst: 3, keyBy: 'user' },
      cache: { enabled: false, ttl: 0, vary: [], keyBy: [] },
      validation: {
        body: {
          type: 'object',
          required: ['name', 'projectId'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            projectId: { type: 'string', minLength: 1 },
            configuration: { type: 'object' }
          }
        }
      },
      documentation: {
        summary: 'Create CI/CD pipeline',
        description: 'Create a new CI/CD pipeline configuration',
        tags: ['CI/CD'],
        parameters: [],
        responses: [
          { status: 200, description: 'Pipeline created', examples: { 'application/json': { pipelineId: 'pipeline_123' } } }
        ],
        examples: []
      }
    });

    // Deployment Routes
    this.addRoute({
      path: '/api/v1/deployment/configurations',
      method: 'POST',
      service: 'deployment',
      handler: 'createConfiguration',
      auth: { required: true, roles: ['developer', 'pro', 'enterprise'], permissions: [], scopes: ['deployment:write'] },
      rateLimit: { enabled: true, requests: 20, window: 3600, burst: 2, keyBy: 'user' },
      cache: { enabled: false, ttl: 0, vary: [], keyBy: [] },
      validation: {
        body: {
          type: 'object',
          required: ['name', 'platform'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            platform: { type: 'string' },
            configuration: { type: 'object' }
          }
        }
      },
      documentation: {
        summary: 'Create deployment configuration',
        description: 'Create a new deployment configuration',
        tags: ['Deployment'],
        parameters: [],
        responses: [
          { status: 200, description: 'Configuration created', examples: { 'application/json': { configurationId: 'config_123' } } }
        ],
        examples: []
      }
    });

    // Health and Status Routes
    this.addRoute({
      path: '/api/v1/health',
      method: 'GET',
      service: 'system',
      handler: 'health',
      auth: { required: false, roles: [], permissions: [], scopes: [] },
      rateLimit: { enabled: true, requests: 1000, window: 3600, burst: 100, keyBy: 'ip' },
      cache: { enabled: true, ttl: 30, vary: [], keyBy: [] },
      validation: {},
      documentation: {
        summary: 'Health check',
        description: 'Get platform health status',
        tags: ['System'],
        parameters: [],
        responses: [
          { status: 200, description: 'Health status', examples: { 'application/json': { status: 'healthy' } } }
        ],
        examples: []
      }
    });

    console.log(`Registered ${this.routes.size} API routes`);
  }

  private addRoute(config: RouteConfig): void {
    const key = `${config.method}:${config.path}`;
    this.routes.set(key, config);
  }

  private setupMiddleware(): void {
    // Request logging middleware
    this.middleware.push(async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      const start = Date.now();
      await next();
      const duration = Date.now() - start;
      this.logger.logRequest(ctx.request, ctx.response!, duration);
    });

    // CORS middleware
    this.middleware.push(async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      if (!ctx.response) {
        ctx.response = {
          status: 200,
          headers: {},
          body: null,
          duration: 0,
          cached: false,
          rateLimited: false,
          timestamp: new Date()
        };
      }

      ctx.response.headers['Access-Control-Allow-Origin'] = '*';
      ctx.response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
      ctx.response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-API-Key';

      if (ctx.request.method === 'OPTIONS') {
        ctx.response.status = 204;
        return;
      }

      await next();
    });

    // Authentication middleware
    this.middleware.push(async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      const route = this.findRoute(ctx.request);
      if (route?.auth.required) {
        const token = this.extractToken(ctx.request);
        if (!token) {
          ctx.response = this.createErrorResponse(401, 'Authentication required');
          return;
        }

        const user = await this.services.auth.authenticate(token);
        if (!user) {
          ctx.response = this.createErrorResponse(401, 'Invalid token');
          return;
        }

        ctx.user = user;
      }

      await next();
    });

    // Authorization middleware
    this.middleware.push(async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      const route = this.findRoute(ctx.request);
      if (route?.auth.required && ctx.user) {
        const hasRole = route.auth.roles.length === 0 || route.auth.roles.includes(ctx.user.role);
        if (!hasRole) {
          ctx.response = this.createErrorResponse(403, 'Insufficient role');
          return;
        }

        // Check permissions
        for (const permission of route.auth.permissions) {
          const hasPermission = await this.services.auth.authorize(ctx.user, permission.resource, permission.actions[0]);
          if (!hasPermission) {
            ctx.response = this.createErrorResponse(403, 'Insufficient permissions');
            return;
          }
        }
      }

      await next();
    });

    // Rate limiting middleware
    this.middleware.push(async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      const route = this.findRoute(ctx.request);
      if (route?.rateLimit.enabled) {
        const rateLimitResult = await this.rateLimiter.checkLimit(ctx.request, route.rateLimit, ctx.user);
        if (!rateLimitResult.allowed) {
          ctx.response = this.createErrorResponse(429, 'Rate limit exceeded', {
            'X-RateLimit-Limit': route.rateLimit.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime!.getTime() / 1000).toString()
          });
          return;
        }

        if (ctx.response) {
          ctx.response.headers['X-RateLimit-Limit'] = route.rateLimit.requests.toString();
          ctx.response.headers['X-RateLimit-Remaining'] = rateLimitResult.remaining.toString();
          ctx.response.headers['X-RateLimit-Reset'] = Math.ceil(rateLimitResult.resetTime!.getTime() / 1000).toString();
        }
      }

      await next();
    });

    // Cache middleware
    this.middleware.push(async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      const route = this.findRoute(ctx.request);
      if (route?.cache.enabled && ctx.request.method === 'GET') {
        const cacheKey = this.generateCacheKey(ctx.request, route.cache);
        const cached = this.cache.get(cacheKey);

        if (cached && cached.expiresAt > new Date()) {
          ctx.response = {
            ...cached.response,
            cached: true,
            headers: {
              ...cached.response.headers,
              'X-Cache': 'HIT'
            }
          };
          return;
        }
      }

      await next();

      // Cache successful responses
      if (route?.cache.enabled && ctx.response?.status === 200) {
        const cacheKey = this.generateCacheKey(ctx.request, route.cache);
        this.cache.set(cacheKey, {
          response: { ...ctx.response, cached: false },
          expiresAt: new Date(Date.now() + route.cache.ttl * 1000)
        });

        ctx.response.headers['X-Cache'] = 'MISS';
      }
    });

    // Request validation middleware
    this.middleware.push(async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      const route = this.findRoute(ctx.request);
      if (route?.validation) {
        const validationErrors = this.validator.validate(ctx.request, route.validation);
        if (validationErrors.length > 0) {
          ctx.response = this.createErrorResponse(400, 'Validation failed', {}, { errors: validationErrors });
          return;
        }
      }

      await next();
    });

    // Metrics middleware
    this.middleware.push(async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      const start = Date.now();
      await next();
      const duration = Date.now() - start;

      this.metrics.recordRequest({
        method: ctx.request.method,
        path: ctx.request.path,
        status: ctx.response?.status || 500,
        duration,
        userId: ctx.user?.id,
        subscription: ctx.user?.subscription.plan
      });
    });
  }

  /**
   * Handle API request
   */
  async handleRequest(request: APIRequest): Promise<APIResponse> {
    const ctx: MiddlewareContext = {
      request,
      metadata: {},
      services: this.services
    };

    try {
      // Execute middleware chain
      await this.executeMiddleware(ctx, 0);

      // If no response was set by middleware, route to service
      if (!ctx.response) {
        ctx.response = await this.routeRequest(ctx);
      }

      return ctx.response;

    } catch (error) {
      console.error('API request error:', error);
      return this.createErrorResponse(500, 'Internal server error');
    }
  }

  private async executeMiddleware(ctx: MiddlewareContext, index: number): Promise<void> {
    if (index >= this.middleware.length) {
      return;
    }

    const middleware = this.middleware[index];
    await middleware(ctx, () => this.executeMiddleware(ctx, index + 1));
  }

  private async routeRequest(ctx: MiddlewareContext): Promise<APIResponse> {
    const route = this.findRoute(ctx.request);
    if (!route) {
      return this.createErrorResponse(404, 'Route not found');
    }

    try {
      const service = this.services[route.service as keyof ServiceRegistry];
      if (!service) {
        return this.createErrorResponse(500, 'Service not available');
      }

      const handler = (service as any)[route.handler];
      if (!handler) {
        return this.createErrorResponse(500, 'Handler not found');
      }

      let result;
      const args = this.extractHandlerArgs(ctx.request, route);

      if (route.service === 'system' && route.handler === 'health') {
        result = await this.getSystemHealth();
      } else {
        result = await handler.call(service, ...args);
      }

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: result,
        duration: 0,
        cached: false,
        rateLimited: false,
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`Route handler error for ${route.path}:`, error);
      return this.createErrorResponse(500, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private findRoute(request: APIRequest): RouteConfig | null {
    const key = `${request.method}:${request.path}`;
    return this.routes.get(key) || null;
  }

  private extractToken(request: APIRequest): string | null {
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const apiKey = request.headers['x-api-key'];
    if (apiKey) {
      return apiKey;
    }

    return null;
  }

  private extractHandlerArgs(request: APIRequest, route: RouteConfig): any[] {
    const args: any[] = [];

    // Add path parameters
    const pathParams = this.extractPathParams(request.path, route.path);
    if (Object.keys(pathParams).length > 0) {
      args.push(pathParams);
    }

    // Add query parameters
    if (Object.keys(request.query).length > 0) {
      args.push(request.query);
    }

    // Add request body
    if (request.body) {
      args.push(request.body);
    }

    // If no other args, add the full request object
    if (args.length === 0) {
      args.push(request);
    }

    return args;
  }

  private extractPathParams(requestPath: string, routePath: string): Record<string, string> {
    const params: Record<string, string> = {};
    const requestParts = requestPath.split('/');
    const routeParts = routePath.split('/');

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      if (routePart.startsWith(':')) {
        const paramName = routePart.substring(1);
        params[paramName] = requestParts[i];
      }
    }

    return params;
  }

  private generateCacheKey(request: APIRequest, config: CacheConfig): string {
    const parts = [request.method, request.path];

    for (const key of config.keyBy) {
      parts.push(`${key}:${request.query[key] || ''}`);
    }

    for (const vary of config.vary) {
      parts.push(`${vary}:${request.query[vary] || ''}`);
    }

    return parts.join('|');
  }

  private createErrorResponse(status: number, message: string, headers: Record<string, string> = {}, data?: any): APIResponse {
    return {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: {
        error: {
          status,
          message,
          timestamp: new Date().toISOString(),
          ...data
        }
      },
      duration: 0,
      cached: false,
      rateLimited: status === 429,
      timestamp: new Date()
    };
  }

  private async getSystemHealth(): Promise<any> {
    const platformStatus = croweCodeServiceIntegration.getPlatformStatus();
    const serviceHealth = await croweCodeServiceIntegration.getServiceHealth();

    return {
      status: platformStatus.status,
      version: platformStatus.version,
      uptime: Date.now() - platformStatus.createdAt.getTime(),
      services: serviceHealth,
      timestamp: new Date().toISOString()
    };
  }

  private getDefaultSubscription(): SubscriptionInfo {
    return {
      plan: 'free',
      status: 'active',
      features: ['basic-ai', 'marketplace', 'collaboration'],
      limits: {
        apiCallsPerHour: 1000,
        concurrentUsers: 5,
        projectsMax: 10,
        storageGB: 5,
        computeUnits: 100,
        aiTokensPerMonth: 10000,
        collaborators: 3,
        deployments: 5
      }
    };
  }

  private startCleanupTasks(): void {
    // Clean up expired cache entries
    setInterval(() => {
      const now = new Date();
      for (const [key, entry] of this.cache) {
        if (entry.expiresAt <= now) {
          this.cache.delete(key);
        }
      }
    }, 300000); // Every 5 minutes

    console.log('API Gateway cleanup tasks started');
  }

  /**
   * Get API documentation
   */
  getDocumentation(): any {
    const paths: any = {};

    for (const [key, route] of this.routes) {
      const [method, path] = key.split(':');

      if (!paths[path]) {
        paths[path] = {};
      }

      paths[path][method.toLowerCase()] = {
        summary: route.documentation.summary,
        description: route.documentation.description,
        tags: route.documentation.tags,
        parameters: route.documentation.parameters,
        responses: route.documentation.responses,
        security: route.auth.required ? [{ BearerAuth: [] }] : []
      };
    }

    return {
      openapi: '3.0.0',
      info: {
        title: 'CroweCode™ API',
        version: '4.1.0',
        description: 'Enterprise development platform API'
      },
      servers: [
        { url: 'https://api.crowecode.com', description: 'Production server' },
        { url: 'https://staging-api.crowecode.com', description: 'Staging server' }
      ],
      paths,
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer'
          }
        }
      }
    };
  }

  /**
   * Get API metrics
   */
  getMetrics(): any {
    return this.metrics.getMetrics();
  }
}

// Supporting classes
class RateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();

  async checkLimit(request: APIRequest, config: RateLimitConfig, user?: AuthenticatedUser): Promise<RateLimitResult> {
    const key = this.generateRateLimitKey(request, config, user);
    const bucket = this.buckets.get(key) || this.createBucket(config);

    const now = Date.now();
    const windowStart = now - (config.window * 1000);

    // Remove old requests
    bucket.requests = bucket.requests.filter(time => time > windowStart);

    // Check if we're within limits
    if (bucket.requests.length >= config.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Math.min(...bucket.requests) + config.window * 1000)
      };
    }

    // Add current request
    bucket.requests.push(now);
    this.buckets.set(key, bucket);

    return {
      allowed: true,
      remaining: config.requests - bucket.requests.length,
      resetTime: new Date(now + config.window * 1000)
    };
  }

  private generateRateLimitKey(request: APIRequest, config: RateLimitConfig, user?: AuthenticatedUser): string {
    switch (config.keyBy) {
      case 'user':
        return `user:${user?.id || 'anonymous'}`;
      case 'subscription':
        return `subscription:${user?.subscription.plan || 'free'}`;
      case 'api-key':
        return `api-key:${request.headers['x-api-key'] || 'none'}`;
      default:
        return `ip:${request.ip}`;
    }
  }

  private createBucket(config: RateLimitConfig): RateLimitBucket {
    return {
      requests: [],
      burst: config.burst
    };
  }
}

class Authenticator {
  async authenticate(token: string): Promise<AuthenticatedUser | null> {
    // Mock authentication - in production, this would validate with auth service
    if (token === 'valid-token') {
      return {
        id: 'user-123',
        username: 'developer',
        email: 'dev@crowecode.com',
        role: 'developer',
        permissions: [
          { resource: '*', actions: ['*'], scope: 'global' }
        ],
        subscription: {
          plan: 'pro',
          status: 'active',
          features: ['ai', 'collaboration', 'marketplace', 'analysis', 'cicd', 'deployment'],
          limits: {
            apiCallsPerHour: 10000,
            concurrentUsers: 10,
            projectsMax: 100,
            storageGB: 100,
            computeUnits: 1000,
            aiTokensPerMonth: 100000,
            collaborators: 10,
            deployments: 50
          }
        },
        rateLimit: {
          requestsRemaining: 9999,
          requestsMax: 10000,
          resetTime: new Date(Date.now() + 3600000),
          burst: 100,
          burstRemaining: 99
        },
        session: {
          id: 'session-123',
          createdAt: new Date(),
          lastActivity: new Date(),
          ip: '127.0.0.1',
          userAgent: 'CroweCode/1.0',
          expiresAt: new Date(Date.now() + 86400000) // 24 hours
        }
      };
    }

    return null;
  }

  async authorize(user: AuthenticatedUser, resource: string, action: string): Promise<boolean> {
    for (const permission of user.permissions) {
      if (permission.resource === '*' || permission.resource === resource) {
        if (permission.actions.includes('*') || permission.actions.includes(action)) {
          return true;
        }
      }
    }
    return false;
  }

  async createSession(userId: string): Promise<SessionInfo> {
    return {
      id: `session_${Date.now()}`,
      createdAt: new Date(),
      lastActivity: new Date(),
      ip: '127.0.0.1',
      userAgent: 'CroweCode/1.0',
      expiresAt: new Date(Date.now() + 86400000)
    };
  }

  async validateSession(sessionId: string): Promise<boolean> {
    // Mock session validation
    return sessionId.startsWith('session_');
  }
}

class RequestValidator {
  validate(request: APIRequest, validation: ValidationConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    if (validation.query) {
      errors.push(...this.validateObject(request.query, validation.query, 'query'));
    }

    if (validation.body && request.body) {
      errors.push(...this.validateObject(request.body, validation.body, 'body'));
    }

    if (validation.headers) {
      errors.push(...this.validateObject(request.headers, validation.headers, 'headers'));
    }

    return errors;
  }

  private validateObject(obj: any, schema: ValidationSchema, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in obj)) {
          errors.push({
            path: `${path}.${field}`,
            message: `Field '${field}' is required`,
            value: undefined
          });
        }
      }
    }

    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in obj) {
          errors.push(...this.validateField(obj[field], fieldSchema, `${path}.${field}`));
        }
      }
    }

    return errors;
  }

  private validateField(value: any, schema: ValidationSchema, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type validation
    if (schema.type && typeof value !== schema.type) {
      errors.push({
        path,
        message: `Expected type '${schema.type}', got '${typeof value}'`,
        value
      });
      return errors; // Don't continue validation if type is wrong
    }

    // String validations
    if (schema.type === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push({
          path,
          message: `String must be at least ${schema.minLength} characters long`,
          value
        });
      }

      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push({
          path,
          message: `String must be at most ${schema.maxLength} characters long`,
          value
        });
      }

      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push({
          path,
          message: `String does not match pattern '${schema.pattern}'`,
          value
        });
      }
    }

    // Number validations
    if (schema.type === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({
          path,
          message: `Number must be at least ${schema.minimum}`,
          value
        });
      }

      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push({
          path,
          message: `Number must be at most ${schema.maximum}`,
          value
        });
      }
    }

    return errors;
  }
}

class APILogger {
  logRequest(request: APIRequest, response: APIResponse, duration: number): void {
    console.log(`${request.method} ${request.path} ${response.status} ${duration}ms`);
  }
}

class APIMetrics {
  private metrics: Map<string, MetricData> = new Map();

  recordRequest(data: RequestMetricData): void {
    const key = `${data.method}:${data.path}`;
    const existing = this.metrics.get(key) || {
      count: 0,
      totalDuration: 0,
      statusCodes: new Map(),
      users: new Set(),
      subscriptions: new Map()
    };

    existing.count++;
    existing.totalDuration += data.duration;

    const statusCount = existing.statusCodes.get(data.status) || 0;
    existing.statusCodes.set(data.status, statusCount + 1);

    if (data.userId) {
      existing.users.add(data.userId);
    }

    if (data.subscription) {
      const subCount = existing.subscriptions.get(data.subscription) || 0;
      existing.subscriptions.set(data.subscription, subCount + 1);
    }

    this.metrics.set(key, existing);
  }

  getMetrics(): any {
    const result: any = {};

    for (const [key, data] of this.metrics) {
      result[key] = {
        count: data.count,
        averageDuration: data.totalDuration / data.count,
        statusCodes: Object.fromEntries(data.statusCodes),
        uniqueUsers: data.users.size,
        subscriptions: Object.fromEntries(data.subscriptions)
      };
    }

    return result;
  }
}

// Type definitions
type Middleware = (ctx: MiddlewareContext, next: () => Promise<void>) => Promise<void>;

interface CacheEntry {
  response: APIResponse;
  expiresAt: Date;
}

interface RateLimitBucket {
  requests: number[];
  burst: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime?: Date;
}

interface ValidationError {
  path: string;
  message: string;
  value: any;
}

interface MetricData {
  count: number;
  totalDuration: number;
  statusCodes: Map<number, number>;
  users: Set<string>;
  subscriptions: Map<string, number>;
}

interface RequestMetricData {
  method: string;
  path: string;
  status: number;
  duration: number;
  userId?: string;
  subscription?: string;
}

// Export singleton instance
export const croweCodeAPIGateway = new CroweCodeAPIGateway();
export { CroweCodeAPIGateway };