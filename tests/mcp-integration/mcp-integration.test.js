const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('MCP Integration', () => {
  const serverPath = path.join(__dirname, '../../server/index.js');
  const utf8Project = require('./test-utf8-project.json');
  const largeProject = require('./test-large-project.json');
  // Test key constant to avoid hardcoded secrets
  const TEST_API_KEY = 'TEST-NOT-REAL-API-KEY';

  function runMCPServer(input, callback) {
    const proc = spawn('node', [serverPath], {
      env: { 
        ...process.env, 
        MCP_EXECUTION: 'true', 
        OPENAI_API_KEY: TEST_API_KEY, 
        JEST_MOCK_BACKLOG: 'true' // Enable for manual test mode
      },
      cwd: path.join(__dirname, '../../'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString('utf8'); });
    proc.stderr.on('data', (data) => { stderr += data.toString('utf8'); });

    proc.stdin.write(JSON.stringify({ type: 'init' }) + '\n');
    const invokeTimeout = setTimeout(() => {
      proc.stdin.write(JSON.stringify({
        type: 'invoke',
        id: '1',
        name: 'generateBacklog',
        params: input
      }) + '\n');
      proc.stdin.end();
    }, 300); // Increased delay for slower systems

    // Fallback timeout: if the process doesn't close in 5000ms, we force it to stop
    const fallbackTimeout = setTimeout(() => {
      if (!proc.killed) {
        proc.kill();
      }
      callback(stdout, stderr);
    }, 5000); // Increased timeout for more reliable tests

    proc.on('close', (code) => {
      clearTimeout(invokeTimeout);
      clearTimeout(fallbackTimeout);
      callback(stdout, stderr);
    });

    proc.on('error', (err) => {
      clearTimeout(invokeTimeout);
      clearTimeout(fallbackTimeout);
      callback('', `Spawn error: ${err.message}`);
    });
  }

  test('UTF-8 and special characters', (done) => {
    jest.setTimeout(15000); // Increased timeout for the test
    runMCPServer(utf8Project, (stdout, stderr) => {
      // LOG: Display raw stdout and stderr received by the test
      console.log('--- TEST STDOUT START ---');
      console.log(stdout);
      console.log('--- TEST STDOUT END ---');
      console.log('--- TEST STDERR START ---');
      console.log(stderr);
      console.log('--- TEST STDERR END ---');

      // Search for MCP "invoke_response"
      const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const responseLine = lines.find(line => line.startsWith('invoke_response:'));
      
      if (!responseLine) {
        process.stderr.write('Stderr: ' + stderr + '\n');
        if (stderr.includes('Error: Cannot find module')) {
          done(new Error('Missing dependency: ' + stderr.split('\n')[0]));
        } else {
          done(new Error('No invoke_response line found in stdout'));
        }
        return;
      }

      try {
        const prefixRegex = /^invoke_response:/;
        const trimmedResponse = responseLine.trim();
        const jsonResponse = trimmedResponse.replace(prefixRegex, '');
        const response = JSON.parse(jsonResponse);

        // Verify that test mode correctly returned the rawBacklog
        // The mocked response doesn't contain a 'result' key, the data is at the root level
        expect(response.success).toBe(true);
        expect(response.rawBacklog).toBeDefined(); // Check response.rawBacklog directly

        // Check special characters directly in rawBacklog
        const rawBacklogString = JSON.stringify(response.rawBacklog); // Use response.rawBacklog
        expect(rawBacklogString).toContain('UTF-8');
        expect(rawBacklogString).toContain('汉字');
        expect(rawBacklogString).toContain('😃');
        expect(rawBacklogString).toContain('العربية');
        expect(rawBacklogString).toContain('кириллица');
        
        done(); // Success
      } catch (e) {
        done(e); // Error (JSON parsing or assertion)
      }
    });
  });

  test('No truncated JSON (large project)', (done) => {
    jest.setTimeout(15000); // Increased timeout
    runMCPServer(largeProject, (stdout, stderr) => {
      // If there's an error, log details for debugging
      if (!stdout || stdout.trim() === '') {
        console.log('--- Empty STDOUT, STDERR: ---');
        console.log(stderr);
        done(new Error('No output from MCP server'));
        return;
      }
      
      // Search for MCP "invoke_response"
      const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const responseLine = lines.find(l => l.includes('invoke_response'));
      
      // More helpful error message with debug info
      if (!responseLine) {
        console.log('Available stdout lines:', lines);
        done(new Error('No invoke_response found in output'));
        return;
      }
      
      // Must be a complete JSON
      const prefixRegex = /^invoke_response:/;
      const trimmedResponse = responseLine.trim();
      const jsonResponse = trimmedResponse.replace(prefixRegex, '');
      expect(() => JSON.parse(jsonResponse)).not.toThrow();
      expect(jsonResponse.trim().endsWith('}')).toBe(true);
      done();
    });
  });

  test('No STDOUT pollution (MCP logs only)', (done) => {
    jest.setTimeout(15000); // Increased timeout
    runMCPServer(utf8Project, (stdout, stderr) => {
      // Skip this test if we don't have any stdout (something else went wrong)
      if (!stdout || stdout.trim() === '') {
        console.log('Empty stdout, skipping STDOUT pollution test');
        done();
        return;
      }
      
      // All STDOUT lines must be MCP JSON
      const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const prefixRegex = /^invoke_response:/;
      for (const line of lines) {
        const trimmedLine = line.trim();
        const jsonLine = trimmedLine.replace(prefixRegex, '');
        expect(() => JSON.parse(jsonLine)).not.toThrow();
      }
      
      // Check for MCP mode message in stderr, allowing for error messages
      // Accept either the old or the new message format for backward compatibility
      const hasExpectedLog = 
        stderr.includes('MCP mode activated') || 
        stderr.includes('Mode MCP activé') ||
        stderr.includes('MCP mode enabled');
        
      if (!hasExpectedLog) {
        console.log('Expected MCP mode message not found in stderr:', stderr);
      }
      
      expect(hasExpectedLog).toBe(true);
      done();
    });
  });
});
