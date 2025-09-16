import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';
    const cwd = process.cwd();
    
    let command = '';
    switch (action) {
      case 'status':
        command = 'git status --short';
        break;
      case 'branch':
        command = 'git branch';
        break;
      case 'log':
        command = 'git log --oneline -10';
        break;
      case 'diff':
        command = 'git diff';
        break;
      case 'remote':
        command = 'git remote -v';
        break;
      default:
        return NextResponse.json(
          { error: "Invalid git action" },
          { status: 400 }
        );
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      return NextResponse.json({
        output: stdout || stderr,
        action,
        success: true
      });
    } catch (error: any) {
      // Check if git is not initialized
      if (error.message.includes('not a git repository')) {
        return NextResponse.json({
          output: "Not a git repository. Run 'git init' to initialize.",
          initialized: false,
          success: false
        });
      }
      
      return NextResponse.json({
        output: error.message,
        success: false,
        error: true
      });
    }
  } catch (error: any) {
    console.error("Git API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute git command" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, message, files } = await request.json();
    const cwd = process.cwd();
    
    let command = '';
    switch (action) {
      case 'init':
        command = 'git init';
        break;
      case 'add':
        command = files ? `git add ${files.join(' ')}` : 'git add .';
        break;
      case 'commit':
        if (!message) {
          return NextResponse.json(
            { error: "Commit message is required" },
            { status: 400 }
          );
        }
        command = `git commit -m "${message}"`;
        break;
      case 'push':
        command = 'git push';
        break;
      case 'pull':
        command = 'git pull';
        break;
      default:
        return NextResponse.json(
          { error: "Invalid git action" },
          { status: 400 }
        );
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      return NextResponse.json({
        output: stdout || stderr,
        action,
        success: true
      });
    } catch (error: any) {
      return NextResponse.json({
        output: error.message,
        success: false,
        error: true
      });
    }
  } catch (error: any) {
    console.error("Git API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute git command" },
      { status: 500 }
    );
  }
}