/**
 * Script de test direct pour generateFeature en mode MCP (stdio)
 * Conforme à la RULE 1: Refactorisation & TDD - Approche ultra-minimaliste
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Constants
const TEST_OUTPUT_DIR = path.join(process.cwd(), '.agile-planner-test-direct-feature');
const EPIC_ID = 'test-epic-for-feature';
const FEATURE_NAME = 'Test Direct Feature';
const FEATURE_DESC = 'Test feature generated directly via MCP for testing';

// Ensure clean test directory
if (fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });

// Create RULE 3 structure with epic for the test
fs.mkdirSync(path.join(TEST_OUTPUT_DIR, 'epics'), { recursive: true });
fs.mkdirSync(path.join(TEST_OUTPUT_DIR, 'orphan-stories'), { recursive: true });
const epicDir = path.join(TEST_OUTPUT_DIR, 'epics', EPIC_ID);
fs.mkdirSync(epicDir, { recursive: true });
fs.mkdirSync(path.join(epicDir, 'features'), { recursive: true });

// Create epic.md
fs.writeFileSync(
  path.join(epicDir, 'epic.md'),
  `# Test Epic\n\nDescription de l'epic pour le test de feature.`
);

// Create backlog.json
const backlogJson = {
  projectName: 'Test Project',
  projectDescription: 'Test project for feature generation',
  epics: [
    {
      id: EPIC_ID,
      name: 'Test Epic',
      description: 'Description de l\'epic pour le test',
      features: []
    }
  ]
};

fs.writeFileSync(
  path.join(TEST_OUTPUT_DIR, 'backlog.json'),
  JSON.stringify(backlogJson, null, 2)
);

// Log function
function log(message) {
  console.log(`[TEST] ${message}`);
}

log(`Starting direct MCP test for generateFeature`);
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
  const epicDir = path.join(TEST_OUTPUT_DIR, 'epics', EPIC_ID);
  const featuresDir = path.join(epicDir, 'features');
  
  // Check existence
  if (!fs.existsSync(backlogJsonPath)) {
    throw new Error('backlog.json not found');
  }
  
  if (!fs.existsSync(featuresDir)) {
    throw new Error('features directory not found');
  }
  
  // Check for feature directories
  const featureDirs = fs.readdirSync(featuresDir);
  if (featureDirs.length === 0) {
    throw new Error('No feature directories found');
  }
  
  // Check first feature
  const featureDir = path.join(featuresDir, featureDirs[0]);
  const featureMarkdownPath = path.join(featureDir, 'feature.md');
  const userStoriesDir = path.join(featureDir, 'user-stories');
  
  if (!fs.existsSync(featureMarkdownPath)) {
    throw new Error('feature.md not found');
  }
  
  if (!fs.existsSync(userStoriesDir)) {
    throw new Error('user-stories directory not found');
  }
  
  // Check for user stories
  const userStoryFiles = fs.readdirSync(userStoriesDir);
  if (userStoryFiles.length === 0) {
    throw new Error('No user story files found');
  }
  
  // Check backlog.json content
  const backlogContent = fs.readFileSync(backlogJsonPath, 'utf8');
  const backlog = JSON.parse(backlogContent);
  
  const epic = backlog.epics.find(e => e.id === EPIC_ID);
  if (!epic) {
    throw new Error('Epic not found in backlog.json');
  }
  
  if (!Array.isArray(epic.features) || epic.features.length === 0) {
    throw new Error('No features array or empty features array in epic');
  }
  
  log('Validation completed successfully');
}

// Send MCP request
const mcpRequest = {
  jsonrpc: '2.0',
  method: 'tools/call',
  params: {
    name: 'generateFeature',
    arguments: {
      epicId: EPIC_ID,
      featureName: FEATURE_NAME,
      featureDescription: FEATURE_DESC,
      backlogPath: TEST_OUTPUT_DIR
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
