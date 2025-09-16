import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface SearchResult {
  file: string;
  line: number;
  column: number;
  text: string;
  match: string;
  preview: string;
}

export async function POST(request: NextRequest) {
  try {
    const { pattern, caseSensitive, includePattern, excludePattern } = await request.json();
    
    if (!pattern) {
      return NextResponse.json(
        { error: "Search pattern is required" },
        { status: 400 }
      );
    }

    const projectRoot = process.cwd();
    const results: SearchResult[] = [];
    let filesSearched = 0;

    try {
      // Use ripgrep if available for better performance
      const flags = caseSensitive ? '' : '-i';
      const includeFlags = includePattern ? `--glob "${includePattern}"` : '';
      const excludeFlags = excludePattern ? excludePattern.split(',').map((p: string) => `--glob "!${p.trim()}"`).join(' ') : '';
      
      const command = `rg ${flags} --json --no-heading ${includeFlags} ${excludeFlags} "${pattern}" "${projectRoot}"`;
      
      try {
        const { stdout } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 }); // 10MB buffer
        
        // Parse ripgrep JSON output
        const lines = stdout.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === 'match') {
              const filePath = path.relative(projectRoot, data.data.path.text);
              results.push({
                file: filePath.replace(/\\/g, '/'),
                line: data.data.line_number,
                column: data.data.submatches[0]?.start || 1,
                text: data.data.lines.text,
                match: data.data.submatches[0]?.match.text || '',
                preview: data.data.lines.text.trim()
              });
            } else if (data.type === 'summary') {
              filesSearched = data.data.stats.searches_with_match || 0;
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      } catch (rgError) {
        // Fallback to manual search if ripgrep is not available
        console.log('Ripgrep not available, using fallback search');
        
        // Simple recursive file search
        async function searchInDirectory(dir: string) {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(projectRoot, fullPath);
            
            // Skip excluded patterns
            if (excludePattern) {
              const excludes = excludePattern.split(',').map((p: string) => p.trim());
              if (excludes.some((ex: string) => relativePath.includes(ex))) {
                continue;
              }
            }
            
            if (entry.isDirectory()) {
              // Skip node_modules and hidden directories
              if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await searchInDirectory(fullPath);
              }
            } else if (entry.isFile()) {
              // Check include pattern
              if (includePattern) {
                const extensions = includePattern.match(/\{([^}]+)\}/)?.[1]?.split(',') || [];
                const hasValidExt = extensions.some((ext: string) => entry.name.endsWith(ext.trim()));
                if (!hasValidExt) continue;
              }
              
              try {
                const content = await fs.readFile(fullPath, 'utf-8');
                const lines = content.split('\n');
                filesSearched++;
                
                const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
                
                lines.forEach((line, index) => {
                  const matches = [...line.matchAll(regex)];
                  matches.forEach(match => {
                    if (match.index !== undefined) {
                      results.push({
                        file: relativePath.replace(/\\/g, '/'),
                        line: index + 1,
                        column: match.index + 1,
                        text: line,
                        match: match[0],
                        preview: line.trim()
                      });
                    }
                  });
                });
              } catch (e) {
                // Skip files that can't be read
              }
            }
          }
        }
        
        await searchInDirectory(projectRoot);
      }
    } catch (error) {
      console.error('Search error:', error);
    }

    return NextResponse.json({
      results: results.slice(0, 500), // Limit to 500 results
      filesSearched,
      totalMatches: results.length
    });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform search" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { replacements } = await request.json();
    
    if (!replacements || !Array.isArray(replacements)) {
      return NextResponse.json(
        { error: "Replacements array is required" },
        { status: 400 }
      );
    }

    const projectRoot = process.cwd();
    const fileChanges = new Map<string, string>();
    
    // Group replacements by file
    for (const replacement of replacements) {
      const filePath = path.join(projectRoot, replacement.file);
      
      if (!fileChanges.has(filePath)) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          fileChanges.set(filePath, content);
        } catch (e) {
          console.error(`Failed to read file: ${filePath}`);
          continue;
        }
      }
    }
    
    // Apply replacements
    let totalReplaced = 0;
    for (const [filePath, originalContent] of fileChanges) {
      const fileReplacements = replacements.filter(r => 
        path.join(projectRoot, r.file) === filePath
      );
      
      // Sort by line and column in reverse order to maintain positions
      fileReplacements.sort((a, b) => {
        if (a.line === b.line) {
          return b.column - a.column;
        }
        return b.line - a.line;
      });
      
      // Apply replacements
      const lines = originalContent.split('\n');
      for (const replacement of fileReplacements) {
        const lineIndex = replacement.line - 1;
        if (lineIndex >= 0 && lineIndex < lines.length) {
          const line = lines[lineIndex];
          const before = line.substring(0, replacement.column - 1);
          const after = line.substring(replacement.column - 1 + replacement.oldText.length);
          lines[lineIndex] = before + replacement.newText + after;
          totalReplaced++;
        }
      }
      
      // Write back to file
      try {
        await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
      } catch (e) {
        console.error(`Failed to write file: ${filePath}`);
      }
    }

    return NextResponse.json({
      success: true,
      replaced: totalReplaced,
      filesModified: fileChanges.size
    });
  } catch (error: any) {
    console.error("Replace API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform replace" },
      { status: 500 }
    );
  }
}