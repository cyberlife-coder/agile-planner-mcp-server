// Test d'intégration end-to-end MCP (stdio) Agile Planner
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_TIMEOUT = 45000; // Increased timeout for LLM generation
const PROJECT_NAME = 'MCP E2E Test Project';
const PROJECT_DESCRIPTION = 'A test project generated via MCP for e2e testing.';
const BASE_OUTPUT_DIR = '.agile-planner-backlog';
const TEST_OUTPUT_PATH = path.join(BASE_OUTPUT_DIR, 'mcp-e2e-test-output');

describe('MCP stdio End-to-End generateBacklog', () => {
  let mcpProcess;

  beforeEach(() => {
    // Clean up before each test
    if (fs.existsSync(TEST_OUTPUT_PATH)) {
      fs.rmSync(TEST_OUTPUT_PATH, { recursive: true, force: true });
    }
    // Ensure base output directory exists, as the app might expect it
    if (!fs.existsSync(BASE_OUTPUT_DIR)) {
      fs.mkdirSync(BASE_OUTPUT_DIR, { recursive: true });
    }
  });

  afterEach(done => {
    console.log('Cleaning up MCP test');
    // Clear any safety timeouts that might be pending
    if (mcpProcess?._safetyTimeout) {
      clearTimeout(mcpProcess._safetyTimeout);
      console.log('Cleared safety timeout');
    }
    
    // Kill process with SIGKILL to ensure it terminates immediately
    if (mcpProcess) {
      if (!mcpProcess.killed) {
        console.log('Forcefully terminating MCP process with SIGKILL');
        try {
          // First try SIGTERM for graceful shutdown
          mcpProcess.kill('SIGTERM');
          
          // Then after a short delay, use SIGKILL for force termination
          setTimeout(() => {
            if (!mcpProcess.killed) {
              console.log('Process still running after SIGTERM, using SIGKILL');
              try {
                mcpProcess.kill('SIGKILL');
              } catch (e) {
                console.log(`Error during SIGKILL: ${e.message}`);
              }
            }
            
            // Cleanup and complete
            cleanupAndFinish();
          }, 100);
        } catch (e) {
          console.log(`Error during process termination: ${e.message}`);
          cleanupAndFinish();
        }
      } else {
        console.log('Process already terminated');
        cleanupAndFinish();
      }
    } else {
      console.log('No process to terminate');
      cleanupAndFinish();
    }
    
    function cleanupAndFinish() {
      // Delete output directory
      try {
        if (fs.existsSync(TEST_OUTPUT_PATH)) {
          console.log(`Removing test output path: ${TEST_OUTPUT_PATH}`);
          fs.rmSync(TEST_OUTPUT_PATH, { recursive: true, force: true });
        }
      } catch (e) {
        console.log(`Error cleaning output path: ${e.message}`);
      }
      
      // Nullify process reference to help GC
      mcpProcess = null;
      
      // Force garbage collection if possible
      if (global.gc) {
        console.log('Forcing garbage collection');
        global.gc();
      }
      
      // Complete cleanup
      console.log('[WARNING] After all tests - cleaning up resources');
      done();
    }
  });

  // Add a global timeout to force exit after all tests are done
  // This ensures the test suite will exit even if there are lingering handles
  const globalExitTimeout = setTimeout(() => {
    console.log('Global exit timeout reached - test may be hanging');
    // Don't force exit - Jest's --forceExit flag will handle this
  }, TEST_TIMEOUT + 10000); // 10 seconds after test timeout
  
  // Make sure the timeout doesn't prevent the process from exiting naturally
  globalExitTimeout.unref();
  
  // Use a longer timeout to ensure all operations can complete
  it('should generate a backlog successfully via MCP stdio', done => {
    // Signal that this test will use setTimeout and other async operations
    jest.useRealTimers();
    // Use env var to indicate this is a test, which the server can check
    process.env.AGILE_PLANNER_TEST_MODE = 'true';
    // Ajout d'une variable d'environnement spécifique aux tests MCP
    process.env.MCP_TEST_ACTIVE = 'true';
    // Set up MCP process for stdio with explicit environment variables
    mcpProcess = spawn('node', ['server/index.js', '--mode', 'mcp'], {
      env: {
        ...process.env,
        FORCE_COLOR: '0', // Désactiver les couleurs qui peuvent altérer le JSON
        NODE_ENV: 'test',
        AGILE_PLANNER_TEST_MODE: 'true',
        MCP_TEST_ACTIVE: 'true',
      }
    });

    let outputBuffer = '';
    // Buffer stdout for processing
    mcpProcess.stdout.on('data', data => {
      const chunk = data.toString();
      outputBuffer += chunk;
      // Log uniquement en cas de débogage
      // console.log(`[TEST] Received chunk: ${chunk.substring(0, 50)}...`);
    });

    mcpProcess.stderr.on('data', data => {
      console.error(`MCP stderr FULL >>> : ${data.toString()} <<< END MCP stderr`);
      // Optionally fail the test if there's any stderr output
      // done(new Error(`Received stderr output: ${data.toString()}`));
    });

    mcpProcess.on('error', err => {
      done(err); // Fail test if process spawning fails
    });

    mcpProcess.on('close', (code, signal) => {
      console.log(`MCP process closed with code ${code}, signal ${signal}`);
      if (code !== 0) {
        console.warn(`MCP process exited with code ${code}, signal ${signal}. Stderr might have info.`);
      }

      // Original raw output buffer logging
      console.log('--- RAW STDOUT BUFFER START ---');
      console.log(outputBuffer);
      console.log('--- RAW STDOUT BUFFER END ---');

      const tempRawPath = 'd:\\Projets-dev\\MCP\\AgilePlanner\\temp_raw_stdout.txt';
      const tempCleanedPath = 'd:\\Projets-dev\\MCP\\AgilePlanner\\temp_cleaned_stdout.txt';

      try {
        fs.writeFileSync(tempRawPath, outputBuffer || '', { encoding: 'utf8' }); 
        console.log(`Raw stdout buffer written to ${tempRawPath}`);
      } catch (writeError) {
        console.error(`Failed to write raw stdout to temp file ${tempRawPath}: ${writeError.message}`);
      }

      let finalStringToParse = outputBuffer.trim(); // Default to trimmed full buffer

      try {
        // Approche améliorée pour extraire la réponse JSON-RPC valide
        // Chercher des lignes qui commencent par { et essayer de les parser comme JSON
        const lines = outputBuffer.split('\n');
        let foundValidJson = false;
        
        // Tester chaque ligne séparément en commençant par la fin (plus susceptible d'avoir la réponse finale)
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{') && line.endsWith('}')) {
            try {
              // Tester si cette ligne est un JSON valide
              const testParse = JSON.parse(line);
              // Vérifier si c'est une réponse JSON-RPC avec l'ID attendu
              if (testParse.id === 1 && (testParse.result || testParse.error)) {
                finalStringToParse = line;
                foundValidJson = true;
                console.log('--- FOUND VALID JSON-RPC RESPONSE ---');
                console.log(line.substring(0, 200) + (line.length > 200 ? '...' : ''));
                break;
              }
            } catch (e) {
              // Cette ligne n'est pas un JSON valide, continuer à la suivante
              continue;
            }
          }
        }
        
        if (!foundValidJson) {
          console.warn('Could not find a valid JSON-RPC response line. Attempting JSON extraction with regex.');
          // Fallback: extraire tout ce qui ressemble à du JSON avec regex
          const jsonLikeRegex = /\{[\s\S]*?\}/g;
          const matches = [...outputBuffer.matchAll(jsonLikeRegex)];
          
          if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1][0];
            finalStringToParse = lastMatch;
            console.log('--- EXTRACTED JSON-LIKE STRING WITH REGEX ---');
            console.log(lastMatch.substring(0, 200) + (lastMatch.length > 200 ? '...' : ''));
          } else {
            console.warn('Could not extract any JSON-like structure with regex. Parsing will likely fail.');
          }
        }
        
        // Remove BOM and control characters that can break JSON parsing
        function cleanJsonString(jsonStr) {
          // Enhanced JSON string cleaning
          const cleaned = jsonStr
            .replace(/^\ufeff/g, '') // Remove BOM
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // Control characters
            .replace(/\r\n|\r|\n/g, '') // Normalize line endings
            .replace(/\t/g, ' ') // Replace tabs with spaces
            .replace(/,\s*}/g, '}') // Fix trailing commas in objects
            .replace(/,\s*\]/g, ']') // Fix trailing commas in arrays
            .replace(/\\n/g, ' ') // Replace escaped newlines
            .replace(/\\"/g, '"') // Fix double-escaped quotes
            .replace(/([{[,:])(\s*)"([^"]+)"(\s*):/g, '$1$2"$3"$4:') // Fix keys missing quotes
            .replace(/([:,\[{])(\s*)([^\s"\}\],][^,:\}\]]*)(\s*)([,:\}\]])/g, '$1$2"$3"$4$5') // Add quotes to unquoted values
            .replace(/([^"\d\-\[{:,])true([,}\]])/g, '$1"true"$2') // Fix unquoted true
            .replace(/([^"\d\-\[{:,])false([,}\]])/g, '$1"false"$2') // Fix unquoted false
            .replace(/([^"\d\-\[{:,])null([,}\]])/g, '$1"null"$2') // Fix unquoted null
            .trim(); // Trim whitespace
            
          return cleaned;
        }
        
        finalStringToParse = cleanJsonString(finalStringToParse);

        console.log('--- FINAL CLEANED BUFFER FOR PARSING START (first 1000 chars) ---');
        console.log(finalStringToParse.substring(0, 1000) + (finalStringToParse.length > 1000 ? '...' : ''));
        console.log('--- FINAL CLEANED BUFFER FOR PARSING END ---');

        try {
          fs.writeFileSync(tempCleanedPath, finalStringToParse || '', { encoding: 'utf8' });
          console.log(`Cleaned stdout buffer for parsing written to ${tempCleanedPath}`);
        } catch (writeError) {
          console.error(`Failed to write cleaned stdout to temp file ${tempCleanedPath}: ${writeError.message}`);
        }
        
        const jsonResponse = JSON.parse(finalStringToParse);
        
        expect(jsonResponse.id).toBe(1); // Check for our request ID
        expect(jsonResponse.error).toBeUndefined();
        expect(jsonResponse.result).toBeDefined();
        expect(jsonResponse.result.success).toBe(true);
        expect(jsonResponse.result.message).toContain('Backlog généré avec succès'); // Updated to French

        // Verify file structure with its own try-catch to ensure done() is called on fs errors
        try {
          // Vérifier que le dossier de backlog a été créé avec succès
          expect(fs.existsSync(path.join(TEST_OUTPUT_PATH))).toBe(true);
          // Vérifier que le fichier de backlog principal existe
          expect(fs.existsSync(path.join(TEST_OUTPUT_PATH, 'backlog.json'))).toBe(true);

          const epicsDir = path.join(TEST_OUTPUT_PATH, 'epics');
          expect(fs.existsSync(epicsDir)).toBe(true);
          expect(fs.statSync(epicsDir).isDirectory()).toBe(true);

          const orphanStoriesDir = path.join(TEST_OUTPUT_PATH, 'orphan-stories');
          expect(fs.existsSync(orphanStoriesDir)).toBe(true);
          expect(fs.statSync(orphanStoriesDir).isDirectory()).toBe(true);

          // Check for at least one epic markdown file (basic check)
          const epicFiles = fs.readdirSync(epicsDir);
          const epicMarkdown = epicFiles.find(file => fs.statSync(path.join(epicsDir, file, 'epic.md')).isFile());
          expect(epicMarkdown).toBeDefined();
          
          // Force kill the MCP process to ensure it doesn't hang
          console.log('TEST - Killing MCP process to ensure clean exit');
          
          // Utiliser les fonctions extraites pour réduire la profondeur de nidification
          Promise.all([
            killChildProcess(mcpProcess),
            cleanupGlobalResources()
          ])
          .then(() => finalizeTest(done));
          // Note: L'else a été supprimé car nous utilisons toujours le nettoyage
          
        } catch (fsError) {
          console.error('File system assertion failed:');
          console.error('Error:', fsError);
          done(fsError); // Pass the FS error to Jest
        }
      } catch (error) {
        // Include a snippet of the string that was attempted to be parsed
        done(new Error(`Failed to parse MCP response or assertions failed. Error: ${error.message}. Attempted to parse (first 500 chars): '${finalStringToParse.substring(0, 500)}...' Raw output (first 500 chars): '${outputBuffer.substring(0, 500)}...'`));
      }
    });

    const mcpRequest = {
      jsonrpc: '2.0',
      method: 'tools/call', // Correct method to invoke a tool
      params: {
        name: 'generateBacklog', // Tool name
        arguments: { // Arguments for the generateBacklog tool
          projectName: PROJECT_NAME,
          projectDescription: PROJECT_DESCRIPTION,
          outputPath: TEST_OUTPUT_PATH
        }
      },
      id: 1
    };

    mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
    
    // Set a safety timeout to forcefully terminate the test if it's taking too long
    // This ensures we don't have hanging processes in CI
    const safetyTimeout = setTimeout(() => {
      console.log('TEST - Safety timeout reached, forcefully terminating MCP process');
      if (mcpProcess && !mcpProcess.killed) {
        mcpProcess.kill('SIGKILL'); // Force kill
      }
      done(new Error('MCP test timed out without proper completion'));
    }, TEST_TIMEOUT - 5000); // Allow 5 seconds for cleanup before Jest's timeout
    
    // Store the timeout in a higher scope so it can be cleared in the success path
    mcpProcess._safetyTimeout = safetyTimeout;
    
    mcpProcess.stdin.end(); // Signal that we're done writing

    // The 'close' event handler will call done(). If it doesn't, Jest's own timeout for the test case will catch it.
    // We ensure jest's timeout (TEST_TIMEOUT + 5000) is longer than any internal logic, so the 'close' handler has a chance to run.
  }, TEST_TIMEOUT + 5000); // Jest timeout slightly higher than internal
});
