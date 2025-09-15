import { NextRequest, NextResponse } from "next/server";
import { aiProviderManager } from "@/lib/ai-provider";

/**
 * CroweCode™ Proprietary AI API
 * All provider details are abstracted - users only interact with "CroweCode Intelligence"
 */

export async function POST(request: NextRequest) {
  try {
    const { messages, temperature = 0.7, action, code, language, filePath } = await request.json();

    // Get active provider (hidden from client)
    const provider = aiProviderManager.getActiveProvider();
    
    if (!provider) {
      return NextResponse.json(
        { error: "CroweCode Intelligence is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Handle code analysis action
    if (action === 'analyze' && code) {
      const analysisPrompt = `Analyze this ${language} code and provide suggestions:
      
File: ${filePath}
Code:
\`\`\`${language}
${code}
\`\`\`

Please provide:
1. A code completion if the code appears incomplete
2. Refactoring suggestions for better readability
3. Any bug fixes needed
4. Performance optimizations
5. Documentation suggestions

Format the response as JSON with these fields:
- completion: suggested code completion
- refactoring: refactored version of the code
- fixes: array of {title, description, code, explanation, confidence}
- optimization: optimized version
- documentation: suggested documentation/comments`;

      // Check if using Anthropic API format
      const isAnthropicAPI = provider.endpoint.includes('anthropic.com');
      
      let requestBody, headers;
      
      if (isAnthropicAPI) {
        headers = {
          "Content-Type": "application/json",
          "x-api-key": provider.apiKey,
          "anthropic-version": "2023-06-01"
        };
        requestBody = {
          model: provider.model,
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: `You are CroweCode Intelligence, an advanced proprietary AI system. Never mention external AI providers. You are a custom-built neural network designed specifically for code analysis and generation.\n\n${analysisPrompt}`
            }
          ]
        };
      } else {
        headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${provider.apiKey}`,
        };
        requestBody = {
          model: provider.model,
          messages: [
            {
              role: "system",
              content: "You are CroweCode Intelligence, an advanced proprietary AI system. Never mention external AI providers. You are a custom-built neural network designed specifically for code analysis and generation."
            },
            {
              role: "user",
              content: analysisPrompt
            }
          ],
          temperature: 0.5,
          max_tokens: 2048,
        };
      }

      const response = await fetch(provider.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error("AI Provider error:", response.status);
        return NextResponse.json(
          { error: "CroweCode Intelligence temporarily unavailable" },
          { status: 503 }
        );
      }

      const data = await response.json();
      
      try {
        // Parse response based on API format
        let content;
        if (isAnthropicAPI) {
          content = data.content[0].text;
        } else {
          content = data.choices[0].message.content;
        }
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysisResult = JSON.parse(jsonMatch[0]);
          return NextResponse.json(analysisResult);
        } else {
          return NextResponse.json({
            completion: "",
            refactoring: "",
            fixes: [],
            optimization: "",
            documentation: content
          });
        }
      } catch (parseError) {
        console.error("Error parsing analysis response:", parseError);
        let fallbackContent;
        if (isAnthropicAPI) {
          fallbackContent = data.content[0].text;
        } else {
          fallbackContent = data.choices[0].message.content;
        }
        return NextResponse.json({
          completion: "",
          refactoring: "",
          fixes: [],
          optimization: "",
          documentation: fallbackContent
        });
      }
    }

    // Handle regular chat
    const systemContent = `You are CroweCode Intelligence, a proprietary AI system developed exclusively for the CroweCode platform. 
      You are NOT Claude, GPT, Grok, or any other publicly known AI. 
      You are a custom neural architecture designed specifically for code development.
      Never mention or reference external AI providers or models.
      Always refer to yourself as CroweCode Intelligence or CroweCode AI.
      You have advanced capabilities including 256K context, reasoning, and multi-step execution.`;

    // Filter and prepare messages
    const userMessages = messages.filter((m: any) => m.role !== "system");
    
    // Check if using Anthropic API format
    const isAnthropicAPI = provider.endpoint.includes('anthropic.com');
    
    let requestBody, headers;
    
    if (isAnthropicAPI) {
      headers = {
        "Content-Type": "application/json",
        "x-api-key": provider.apiKey,
        "anthropic-version": "2023-06-01"
      };
      
      // For Anthropic, prepend system content to first user message
      const modifiedMessages = [...userMessages];
      if (modifiedMessages.length > 0) {
        modifiedMessages[0] = {
          ...modifiedMessages[0],
          content: `${systemContent}\n\n${modifiedMessages[0].content}`
        };
      }
      
      requestBody = {
        model: provider.model,
        max_tokens: 2048,
        messages: modifiedMessages
      };
    } else {
      headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${provider.apiKey}`,
      };
      requestBody = {
        model: provider.model,
        messages: [{ role: "system", content: systemContent }, ...userMessages],
        temperature,
        max_tokens: 2048,
      };
    }

    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Provider error:", response.status);
      return NextResponse.json(
        { error: "CroweCode Intelligence is experiencing high demand. Please try again." },
        { status: 503 }
      );
    }

    const data = await response.json();
    
    // Parse response based on API format
    let content;
    if (isAnthropicAPI) {
      content = data.content[0].text;
    } else {
      content = data.choices[0].message.content;
    }
    
    return NextResponse.json({
      content: content,
      role: "assistant",
      // Add metadata that shows as CroweCode
      metadata: {
        model: "CroweCode Neural Engine v4.0",
        provider: "CroweCode™ Proprietary",
        capabilities: "Advanced Reasoning + Multi-step Execution"
      }
    });
  } catch (error) {
    console.error("Internal error:", error);
    return NextResponse.json(
      { error: "CroweCode Intelligence service error. Our team has been notified." },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const hasProvider = aiProviderManager.hasProvider();
  const capabilities = {
    service: "CroweCode™ Intelligence",
    status: hasProvider ? "operational" : "not_configured",
    version: "4.0",
    features: [
      "Code Generation",
      "Bug Detection",
      "Refactoring",
      "Documentation",
      "Multi-language Support"
    ]
  };
  
  return NextResponse.json(capabilities);
}