import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Get file tree for a directory
async function getFileTree(dirPath: string, depth = 0, maxDepth = 3): Promise<any[]> {
  if (depth > maxDepth) return [];
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const tree = [];
    
    for (const item of items) {
      // Skip hidden files and node_modules
      if (item.name.startsWith('.') || item.name === 'node_modules') {
        continue;
      }
      
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        const children = depth < maxDepth ? await getFileTree(fullPath, depth + 1, maxDepth) : [];
        tree.push({
          name: item.name,
          type: 'folder',
          path: fullPath,
          children
        });
      } else {
        tree.push({
          name: item.name,
          type: 'file',
          path: fullPath
        });
      }
    }
    
    return tree;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dirPath = searchParams.get('path') || process.cwd();
    const action = searchParams.get('action') || 'tree';
    
    // Security check - prevent access outside project directory
    const resolvedPath = path.resolve(dirPath);
    const projectRoot = process.cwd();
    
    if (!resolvedPath.startsWith(projectRoot)) {
      return NextResponse.json(
        { error: "Access denied: Path outside project directory" },
        { status: 403 }
      );
    }
    
    if (action === 'tree') {
      const tree = await getFileTree(resolvedPath);
      return NextResponse.json({ tree, root: resolvedPath });
    }
    
    if (action === 'read') {
      try {
        const content = await fs.readFile(resolvedPath, 'utf-8');
        return NextResponse.json({ 
          content, 
          path: resolvedPath,
          name: path.basename(resolvedPath)
        });
      } catch (error) {
        return NextResponse.json(
          { error: "Failed to read file" },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("File API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, content, action } = await request.json();
    
    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }
    
    // Security check
    const resolvedPath = path.resolve(filePath);
    const projectRoot = process.cwd();
    
    if (!resolvedPath.startsWith(projectRoot)) {
      return NextResponse.json(
        { error: "Access denied: Path outside project directory" },
        { status: 403 }
      );
    }
    
    if (action === 'write') {
      await fs.writeFile(resolvedPath, content, 'utf-8');
      return NextResponse.json({ 
        success: true, 
        path: resolvedPath,
        message: "File saved successfully"
      });
    }
    
    if (action === 'create') {
      // Check if file already exists
      try {
        await fs.access(resolvedPath);
        return NextResponse.json(
          { error: "File already exists" },
          { status: 409 }
        );
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(resolvedPath, content || '', 'utf-8');
        return NextResponse.json({ 
          success: true, 
          path: resolvedPath,
          message: "File created successfully"
        });
      }
    }
    
    if (action === 'delete') {
      await fs.unlink(resolvedPath);
      return NextResponse.json({ 
        success: true, 
        message: "File deleted successfully"
      });
    }
    
    if (action === 'mkdir') {
      await fs.mkdir(resolvedPath, { recursive: true });
      return NextResponse.json({ 
        success: true, 
        path: resolvedPath,
        message: "Directory created successfully"
      });
    }
    
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("File API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}