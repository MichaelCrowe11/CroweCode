import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check if code-server is available
    const codeServerUrl = process.env.CODE_SERVER_URL || "http://localhost:8080";
    
    // In production, this would actually check the code-server instance
    if (process.env.NODE_ENV === "production" && process.env.CODE_SERVER_ENABLED === "true") {
      try {
        const response = await fetch(codeServerUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          return NextResponse.json({
            status: "connected",
            server: "code-server",
            version: "4.19.0",
            features: {
              terminal: true,
              debugging: true,
              extensions: true,
              collaboration: true,
              containers: true
            },
            url: codeServerUrl
          });
        }
      } catch (error) {
        // Code server not reachable
      }
    }
    
    // Demo mode response
    return NextResponse.json({
      status: "demo",
      server: "simulated",
      version: "1.0.0",
      features: {
        terminal: false,
        debugging: false,
        extensions: false,
        collaboration: false,
        containers: false
      },
      message: "Running in demo mode. Deploy with Docker for full functionality."
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: "error",
        error: error.message || "Failed to check IDE status"
      },
      { status: 500 }
    );
  }
}