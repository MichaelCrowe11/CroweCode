import { NextRequest, NextResponse } from "next/server";
import { createCroweCoderAgent } from "@/lib/claude-agent";

// Initialize Crowe Coder Agent
let agent: ReturnType<typeof createCroweCoderAgent> | null = null;

function getAgent() {
  if (!agent && process.env.ANTHROPIC_API_KEY) {
    agent = createCroweCoderAgent(process.env.ANTHROPIC_API_KEY);
  }
  return agent;
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, capability, params } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Claude API key not configured" },
        { status: 500 }
      );
    }

    const croweAgent = getAgent();
    if (!croweAgent) {
      return NextResponse.json(
        { error: "Failed to initialize Crowe Coder Agent" },
        { status: 500 }
      );
    }

    // Handle capability execution
    if (capability && params) {
      try {
        const agentModule = await import("@/lib/claude-agent");
        const agent = new agentModule.default(process.env.ANTHROPIC_API_KEY);
        const result = await agent.executeCapability(capability, params);
        
        return NextResponse.json({
          content: typeof result === 'string' ? result : result.text || JSON.stringify(result),
          capability: capability,
          success: true
        });
      } catch (error: any) {
        console.error(`Capability ${capability} error:`, error);
        return NextResponse.json({
          error: `Failed to execute ${capability}: ${error.message}`,
          success: false
        });
      }
    }

    // Handle regular chat message
    if (message) {
      const response = await croweAgent.processMessage(message, context);
      
      // Extract any code blocks for the editor
      const codeBlocks = response.match(/```[\w]*\n([\s\S]*?)```/g);
      const commands = response.match(/```bash\n(.*?)\n```/g);
      
      return NextResponse.json({
        content: response,
        codeBlocks: codeBlocks ? codeBlocks.map(block => {
          const match = block.match(/```([\w]*)\n([\s\S]*?)```/);
          return {
            language: match?.[1] || 'text',
            code: match?.[2] || ''
          };
        }) : [],
        commands: commands ? commands.map(cmd => 
          cmd.replace(/```bash\n/, '').replace(/\n```/, '')
        ) : [],
        agent: {
          name: croweAgent.name,
          avatar: croweAgent.avatar,
          personality: croweAgent.personality
        }
      });
    }

    return NextResponse.json(
      { error: "No message or capability provided" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Crowe Coder Agent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const croweAgent = getAgent();
  
  if (!croweAgent) {
    return NextResponse.json({
      status: "not_initialized",
      message: "Crowe Coder Agent requires API key"
    });
  }

  return NextResponse.json({
    status: "ready",
    agent: {
      name: croweAgent.name,
      avatar: croweAgent.avatar,
      personality: croweAgent.personality,
      capabilities: croweAgent.capabilities
    },
    model: "claude-3-opus",
    provider: "Anthropic",
    version: "1.0.0"
  });
}