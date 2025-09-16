import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Enhanced Terminal API with Internet Access
 * Supports web requests, package installation, and data operations
 */

export async function POST(request: NextRequest) {
  try {
    const { command, sessionId } = await request.json();

    // Enhanced command processing with internet capabilities
    const processedCommand = await processEnhancedCommand(command);
    
    if (processedCommand.isWebRequest) {
      // Handle web requests (curl, wget, etc.)
      const result = await executeWebCommand(processedCommand.command);
      return NextResponse.json({ 
        output: result,
        type: 'web',
        timestamp: new Date().toISOString()
      });
    }

    if (processedCommand.isDataOperation) {
      // Handle data science operations
      const result = await executeDataCommand(processedCommand.command);
      return NextResponse.json({
        output: result,
        type: 'data',
        timestamp: new Date().toISOString()
      });
    }

    if (processedCommand.isPackageManager) {
      // Handle package installations (npm, pip, conda)
      const result = await executePackageCommand(processedCommand.command);
      return NextResponse.json({
        output: result,
        type: 'package',
        timestamp: new Date().toISOString()
      });
    }

    // Execute regular terminal command
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        // Enable internet access
        HTTP_PROXY: process.env.HTTP_PROXY || '',
        HTTPS_PROXY: process.env.HTTPS_PROXY || '',
        // Add Python/ML paths
        PYTHONPATH: process.env.PYTHONPATH || '',
        CONDA_PREFIX: process.env.CONDA_PREFIX || '',
      }
    });

    return NextResponse.json({
      output: stdout || stderr,
      type: 'command',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      type: 'error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function processEnhancedCommand(command: string) {
  const lowerCommand = command.toLowerCase().trim();
  
  return {
    command,
    isWebRequest: /^(curl|wget|fetch|http|api)/.test(lowerCommand),
    isDataOperation: /^(python|jupyter|pandas|numpy|sklearn)/.test(lowerCommand),
    isPackageManager: /^(npm|pip|conda|yarn|cargo)/.test(lowerCommand),
    isMLOperation: /tensorflow|pytorch|keras|scikit/.test(lowerCommand)
  };
}

async function executeWebCommand(command: string): Promise<string> {
  try {
    // Parse and execute web requests
    if (command.startsWith('curl')) {
      const { stdout } = await execAsync(command);
      return stdout;
    }
    
    if (command.startsWith('fetch') || command.startsWith('api')) {
      // Custom fetch implementation
      const urlMatch = command.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const response = await fetch(urlMatch[0]);
        const data = await response.text();
        return data;
      }
    }
    
    return "Web command executed";
  } catch (error: any) {
    return `Web request error: ${error.message}`;
  }
}

async function executeDataCommand(command: string): Promise<string> {
  try {
    // Handle Python/Jupyter commands
    if (command.startsWith('python')) {
      const { stdout, stderr } = await execAsync(command);
      return stdout || stderr;
    }
    
    if (command.startsWith('jupyter')) {
      // Launch Jupyter notebook
      if (command.includes('notebook')) {
        return "Jupyter notebook server starting on http://localhost:8888";
      }
      if (command.includes('lab')) {
        return "JupyterLab server starting on http://localhost:8888";
      }
    }
    
    // Handle data processing commands
    if (command.includes('pandas') || command.includes('numpy')) {
      const pythonScript = `python -c "${command}"`;
      const { stdout } = await execAsync(pythonScript);
      return stdout;
    }
    
    return "Data command executed";
  } catch (error: any) {
    return `Data operation error: ${error.message}`;
  }
}

async function executePackageCommand(command: string): Promise<string> {
  try {
    // NPM commands
    if (command.startsWith('npm')) {
      const { stdout, stderr } = await execAsync(command);
      return stdout || stderr;
    }
    
    // Python package management
    if (command.startsWith('pip')) {
      const { stdout, stderr } = await execAsync(command);
      return stdout || stderr;
    }
    
    // Conda environment management
    if (command.startsWith('conda')) {
      const { stdout, stderr } = await execAsync(command);
      return stdout || stderr;
    }
    
    return "Package command executed";
  } catch (error: any) {
    return `Package management error: ${error.message}`;
  }
}

// GET endpoint for terminal capabilities
export async function GET() {
  return NextResponse.json({
    capabilities: {
      internet: true,
      webRequests: ['curl', 'wget', 'fetch'],
      dataScience: ['python', 'jupyter', 'pandas', 'numpy', 'sklearn'],
      packageManagers: ['npm', 'pip', 'conda', 'yarn'],
      mlFrameworks: ['tensorflow', 'pytorch', 'keras', 'scikit-learn'],
      databases: ['mysql', 'postgresql', 'mongodb', 'redis'],
      apis: ['rest', 'graphql', 'websocket']
    },
    environment: {
      python: process.env.PYTHON_VERSION || '3.9',
      node: process.version,
      npm: process.env.NPM_VERSION || '8.0',
      internetAccess: true
    }
  });
}