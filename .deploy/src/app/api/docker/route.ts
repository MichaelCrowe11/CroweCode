import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'ps';
    
    let command = '';
    switch (action) {
      case 'ps':
        command = 'docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Names}}"';
        break;
      case 'images':
        command = 'docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}"';
        break;
      case 'volumes':
        command = 'docker volume ls';
        break;
      case 'networks':
        command = 'docker network ls';
        break;
      case 'stats':
        command = 'docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}"';
        break;
      default:
        return NextResponse.json(
          { error: "Invalid docker action" },
          { status: 400 }
        );
    }
    
    try {
      const { stdout, stderr } = await execAsync(command);
      return NextResponse.json({
        output: stdout || stderr,
        action,
        success: true
      });
    } catch (error: any) {
      // Check if Docker is not installed or running
      if (error.message.includes('docker: command not found') || 
          error.message.includes('Cannot connect to the Docker daemon')) {
        return NextResponse.json({
          output: "Docker is not installed or not running",
          dockerAvailable: false,
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
    console.error("Docker API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute docker command" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, container, image, command: customCommand } = await request.json();
    
    let command = '';
    switch (action) {
      case 'start':
        if (!container) {
          return NextResponse.json(
            { error: "Container name/ID is required" },
            { status: 400 }
          );
        }
        command = `docker start ${container}`;
        break;
      case 'stop':
        if (!container) {
          return NextResponse.json(
            { error: "Container name/ID is required" },
            { status: 400 }
          );
        }
        command = `docker stop ${container}`;
        break;
      case 'restart':
        if (!container) {
          return NextResponse.json(
            { error: "Container name/ID is required" },
            { status: 400 }
          );
        }
        command = `docker restart ${container}`;
        break;
      case 'remove':
        if (!container) {
          return NextResponse.json(
            { error: "Container name/ID is required" },
            { status: 400 }
          );
        }
        command = `docker rm ${container}`;
        break;
      case 'run':
        if (!image) {
          return NextResponse.json(
            { error: "Image name is required" },
            { status: 400 }
          );
        }
        command = `docker run -d ${image}`;
        break;
      case 'exec':
        if (!container || !customCommand) {
          return NextResponse.json(
            { error: "Container and command are required" },
            { status: 400 }
          );
        }
        command = `docker exec ${container} ${customCommand}`;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid docker action" },
          { status: 400 }
        );
    }
    
    try {
      const { stdout, stderr } = await execAsync(command);
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
    console.error("Docker API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute docker command" },
      { status: 500 }
    );
  }
}