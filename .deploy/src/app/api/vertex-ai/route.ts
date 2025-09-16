import { NextRequest, NextResponse } from "next/server";
import { vertexAIProvider } from "@/lib/vertex-ai-provider";

/**
 * Vertex AI API Route
 * Unified interface for all AI operations using Google Vertex AI
 */

export async function POST(request: NextRequest) {
  try {
    const { 
      messages, 
      temperature = 0.7, 
      action, 
      code, 
      language, 
      filePath,
      model,
      stream = false
    } = await request.json();

    // Check if Vertex AI is configured
    if (!vertexAIProvider.isConfigured()) {
      return NextResponse.json(
        { error: "Vertex AI is not configured. Please set up GCP credentials." },
        { status: 500 }
      );
    }

    // Switch model if specified
    if (model) {
      try {
        vertexAIProvider.switchModel(model);
      } catch (error) {
        console.error("Failed to switch model:", error);
      }
    }

    // Handle code analysis action
    if (action === 'analyze' && code) {
      const analysisResult = await vertexAIProvider.analyzeCode(
        code,
        language || 'javascript',
        'review'
      );

      // Parse and structure the response
      try {
        const structuredResponse = {
          completion: "",
          refactoring: "",
          fixes: [],
          optimization: "",
          documentation: analysisResult
        };

        // Try to extract structured data if the model returns JSON
        const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          Object.assign(structuredResponse, parsed);
        }

        return NextResponse.json(structuredResponse);
      } catch (error) {
        return NextResponse.json({
          completion: "",
          refactoring: "",
          fixes: [],
          optimization: "",
          documentation: analysisResult
        });
      }
    }

    // Handle code generation
    if (action === 'generate' && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const codeResult = await vertexAIProvider.generateCode(
        lastMessage.content,
        language || 'javascript',
        filePath
      );

      return NextResponse.json({
        content: codeResult,
        role: "assistant",
        metadata: vertexAIProvider.getModelInfo()
      });
    }

    // Handle regular chat
    if (messages && messages.length > 0) {
      // Add system message for consistent behavior
      const systemMessage = {
        role: "system",
        content: `You are an advanced AI assistant powered by Google Vertex AI. 
        You have access to cutting-edge language models from the Model Garden including Gemini, Claude, Llama, and more.
        You excel at code generation, analysis, debugging, and technical discussions.
        Always provide helpful, accurate, and detailed responses.`
      };

      const allMessages = [systemMessage, ...messages];

      if (stream) {
        // Handle streaming response
        const streamResult = await vertexAIProvider.generateContent(
          allMessages,
          {
            temperature,
            maxOutputTokens: 4096,
            streamResponse: true
          }
        );

        // Create a readable stream for the response
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
          async start(controller) {
            for await (const chunk of streamResult.stream) {
              const text = chunk.text();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        });

        return new NextResponse(readableStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } else {
        // Regular non-streaming response
        const result = await vertexAIProvider.generateContent(
          allMessages,
          {
            temperature,
            maxOutputTokens: 2048,
          }
        );

        return NextResponse.json({
          content: result,
          role: "assistant",
          metadata: vertexAIProvider.getModelInfo()
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid request. Please provide messages or code to analyze." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Vertex AI API error:", error);
    return NextResponse.json(
      { error: "Vertex AI service error. Please try again later." },
      { status: 500 }
    );
  }
}

// GET endpoint for model information and health check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'models') {
    // Return available models
    const models = vertexAIProvider.getAvailableModels();
    return NextResponse.json({
      models,
      currentModel: vertexAIProvider.getModelInfo()
    });
  }

  if (action === 'health') {
    // Health check
    const isConfigured = vertexAIProvider.isConfigured();
    return NextResponse.json({
      status: isConfigured ? 'healthy' : 'not_configured',
      provider: 'Google Vertex AI',
      configured: isConfigured,
      modelInfo: isConfigured ? vertexAIProvider.getModelInfo() : null
    });
  }

  // Default response
  return NextResponse.json({
    service: 'Vertex AI API',
    status: 'operational',
    endpoints: [
      'POST /api/vertex-ai - Generate content',
      'GET /api/vertex-ai?action=models - List available models',
      'GET /api/vertex-ai?action=health - Health check'
    ]
  });
}
