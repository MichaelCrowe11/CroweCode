import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

// Store terminal sessions in memory
const sessions = new Map<string, { cwd: string; history: string[] }>();

export async function POST(request: NextRequest) {
  try {
    const { command, sessionId = "default", cwd = process.cwd() } = await request.json();

    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      session = { cwd, history: [] };
      sessions.set(sessionId, session);
    }

    // Security check - prevent dangerous commands
    const blockedCommands = ["rm -rf /", "format c:", "del /f /s /q"];
    if (blockedCommands.some(blocked => command.toLowerCase().includes(blocked))) {
      return NextResponse.json({
        output: "Command blocked for security reasons",
        error: true,
        cwd: session.cwd,
      });
    }

    // Check if running in production/Vercel environment
    const isVercel = process.env.VERCEL === "1";
    const isProduction = process.env.NODE_ENV === "production" && isVercel;
    
    if (isProduction) {
      // In production (Vercel), we can't execute real commands due to serverless limitations
      return NextResponse.json({
        output: "Terminal execution is not available in serverless environment. Please run locally or use Docker deployment for full terminal functionality.",
        error: false,
        cwd: session.cwd,
        serverless: true,
      });
    }

    // Local development - execute real commands
    try {
      // Handle special commands
      if (command === "clear" || command === "cls") {
        return NextResponse.json({
          output: "",
          error: false,
          cwd: session.cwd,
          clearScreen: true,
        });
      }
      
      if (command === "pwd") {
        return NextResponse.json({
          output: session.cwd,
          error: false,
          cwd: session.cwd,
        });
      }
      
      // Handle cd command specially
      if (command === "cd" || command === "cd ~") {
        const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
        session.cwd = homeDir;
        return NextResponse.json({
          output: "",
          error: false,
          cwd: session.cwd,
        });
      }
      
      if (command.startsWith("cd ")) {
        const newPath = command.substring(3).trim();
        const resolvedPath = path.isAbsolute(newPath) 
          ? newPath 
          : path.resolve(session.cwd, newPath);
        
        // Check if directory exists
        try {
          const stats = await fs.stat(resolvedPath);
          if (stats.isDirectory()) {
            session.cwd = resolvedPath;
            return NextResponse.json({
              output: "",
              error: false,
              cwd: session.cwd,
            });
          } else {
            return NextResponse.json({
              output: `cd: not a directory: ${newPath}`,
              error: true,
              cwd: session.cwd,
            });
          }
        } catch {
          return NextResponse.json({
            output: `cd: no such file or directory: ${newPath}`,
            error: true,
            cwd: session.cwd,
          });
        }
      }

      // Determine shell based on platform
      const isWindows = process.platform === "win32";
      const shell = isWindows ? "cmd.exe" : "/bin/bash";
      const shellFlag = isWindows ? "/c" : "-c";
      
      // Execute command
      const { stdout, stderr } = await execAsync(command, {
        cwd: session.cwd,
        env: process.env,
        timeout: 30000, // 30 second timeout
        shell: shell,
        windowsHide: true,
      });

      const output = stdout || stderr || "Command executed successfully";
      session.history.push(`$ ${command}`, output);

      return NextResponse.json({
        output,
        error: false,
        cwd: session.cwd,
        exitCode: 0,
      });
    } catch (error: any) {
      return NextResponse.json({
        output: error.message || "Command failed",
        error: true,
        cwd: session.cwd,
        exitCode: error.code || 1,
      });
    }
  } catch (error: any) {
    console.error("Terminal error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to execute command",
        output: "Terminal error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId") || "default";
  let session = sessions.get(sessionId);
  
  // Initialize session if it doesn't exist
  if (!session) {
    const projectDir = process.cwd();
    session = {
      cwd: projectDir,
      history: [
        "Welcome to Crowe Terminal",
        "Type 'help' for available commands",
        `Current directory: ${projectDir}`
      ]
    };
    sessions.set(sessionId, session);
  }
  
  return NextResponse.json({
    sessionId,
    cwd: session.cwd,
    history: session.history,
    active: true,
    platform: process.platform,
    node: process.version,
  });
}

export async function DELETE(request: NextRequest) {
  const { sessionId = "default" } = await request.json();
  sessions.delete(sessionId);
  
  return NextResponse.json({
    message: "Session terminated",
    sessionId,
  });
}