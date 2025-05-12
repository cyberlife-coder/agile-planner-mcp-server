/**
 * Script de test direct pour generateBacklog en mode MCP (stdio)
 * Conforme à la RULE 1: Refactorisation & TDD - Approche ultra-minimaliste
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Constants
const TEST_OUTPUT_DIR = path.join(process.cwd(), '.agile-planner-test-direct-backlog');
const PROJECT_NAME = 'Test Direct Backlog';
const PROJECT_DESC = 'Test backlog generated directly via MCP for testing';

// Ensure clean test directory
if (fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });

// Log function
function log(message) {
  console.log(`[TEST] ${message}`);
}

log(`Starting direct MCP test for generateBacklog`);
log(`Output directory: ${TEST_OUTPUT_DIR}`);

// Launch MCP process
const mcpProcess = spawn('node', ['server/index.js', '--mode', 'mcp'], {
  env: {
    ...process.env,
    NODE_ENV: 'test',
    FORCE_COLOR: '0',
    DEBUG_MCP: 'true'
  }
});

let stdoutData = '';
let receivedValidResponse = false;

// Handle output
mcpProcess.stdout.on('data', (data) => {
  const chunk = data.toString();
  stdoutData += chunk;
  log(`Received chunk: ${chunk.substring(0, 100)}...`);
  
  try {
    // Try to find JSON response
    if (chunk.includes('"id":1') && chunk.includes('"result"')) {
      log('Found potential response');
      
      // Try to extract JSON
      const jsonMatch = chunk.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        try {
          const response = JSON.parse(jsonStr);
          if (response.id === 1 && response.result && response.result.success) {
            log('Valid response received!');
            log(`Message: ${response.result.message}`);
            receivedValidResponse = true;
            
            // Validate files
            setTimeout(() => {
              try {
                validateFiles();
                log('Test completed successfully');
              } catch (error) {
                log(`Validation error: ${error.message}`);
              } finally {
                // Clean up
                if (mcpProcess && !mcpProcess.killed) {
                  mcpProcess.kill('SIGTERM');
                }
              }
            }, 500);
          }
        } catch (parseError) {
          log(`JSON parse error: ${parseError.message}`);
        }
      }
    }
  } catch (error) {
    log(`Error processing output: ${error.message}`);
  }
});

// Handle errors
mcpProcess.stderr.on('data', (data) => {
  log(`STDERR: ${data.toString()}`);
});

// Handle process exit
mcpProcess.on('close', (code) => {
  log(`Process closed with code ${code}`);
  if (!receivedValidResponse) {
    log('Process terminated without valid response');
    log(`Raw output: ${stdoutData}`);
  }
});

// Safety timeout
const timeout = setTimeout(() => {
  log('Test timeout - terminating');
  if (mcpProcess && !mcpProcess.killed) {
    mcpProcess.kill('SIGKILL');
  }
}, 30000);

// Function to validate output files
function validateFiles() {
  log('Validating output files...');
  
  const backlogJsonPath = path.join(TEST_OUTPUT_DIR, 'backlog.json');
  const epicsDir = path.join(TEST_OUTPUT_DIR, 'epics');
  const orphanStoriesDir = path.join(TEST_OUTPUT_DIR, 'orphan-stories');
  
  // Check existence
  if (!fs.existsSync(backlogJsonPath)) {
    throw new Error('backlog.json not found');
  }
  
  if (!fs.existsSync(epicsDir)) {
    throw new Error('epics directory not found');
  }
  
  if (!fs.existsSync(orphanStoriesDir)) {
    throw new Error('orphan-stories directory not found');
  }
  
  // Check backlog.json content
  const backlogContent = fs.readFileSync(backlogJsonPath, 'utf8');
  const backlog = JSON.parse(backlogContent);
  
  if (backlog.projectName !== PROJECT_NAME) {
    throw new Error(`Project name mismatch: ${backlog.projectName} vs ${PROJECT_NAME}`);
  }
  
  if (backlog.projectDescription !== PROJECT_DESC) {
    throw new Error(`Project description mismatch: ${backlog.projectDescription} vs ${PROJECT_DESC}`);
  }
  
  if (!Array.isArray(backlog.epics)) {
    throw new Error('Epics is not an array');
  }
  
  log('Validation completed successfully');
}

// Send MCP request
const mcpRequest = {
  jsonrpc: '2.0',
  method: 'tools/call',
  params: {
    name: 'generateBacklog',
    arguments: {
      projectName: PROJECT_NAME,
      projectDescription: PROJECT_DESC,
      outputPath: TEST_OUTPUT_DIR
    }
  },
  id: 1
};

// Wait a moment before sending the request to ensure the server is ready
setTimeout(() => {
  log(`Sending request: ${JSON.stringify(mcpRequest)}`);
  mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
  mcpProcess.stdin.end();
}, 1000);
