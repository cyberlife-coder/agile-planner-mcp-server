const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('MCP Integration', () => {
  const serverPath = path.join(__dirname, '../../server/index.js');
  const utf8Project = require('./test-utf8-project.json');
  const largeProject = require('./test-large-project.json');

  function runMCPServer(input, callback) {
    const proc = spawn('node', [serverPath], {
      env: { 
        ...process.env, 
        MCP_EXECUTION: 'true', 
        OPENAI_API_KEY: 'fake-key', 
        JEST_MOCK_BACKLOG: 'true' // Réactiver pour le mode test manuel
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
    }, 200);

    // Fallback timeout : si le process ne se ferme pas en 4000 ms, on le force à s'arrêter
    const fallbackTimeout = setTimeout(() => {
      if (!proc.killed) {
        proc.kill();
      }
      callback(stdout, stderr);
    }, 4000);

    proc.on('close', (code) => {
      clearTimeout(invokeTimeout);
      clearTimeout(fallbackTimeout);
      callback(stdout, stderr);
    });

    proc.on('error', (err) => {
      clearTimeout(invokeTimeout);
      clearTimeout(fallbackTimeout);
      callback('', `Erreur spawn: ${err.message}`);
    });
  }

  test('UTF-8 et caractères spéciaux', (done) => {
    jest.setTimeout(10000);
    runMCPServer(utf8Project, (stdout, stderr) => {
      // LOG: Afficher stdout et stderr bruts reçus par le test
      console.log('--- TEST STDOUT START ---');
      console.log(stdout);
      console.log('--- TEST STDOUT END ---');
      console.log('--- TEST STDERR START ---');
      console.log(stderr);
      console.log('--- TEST STDERR END ---');

      // Cherche la réponse MCP "invoke_response"
      const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const responseLine = lines.find(line => line.startsWith('invoke_response:'));
      
      if (!responseLine) {
        process.stderr.write('Stderr: ' + stderr + '\n');
        return done(new Error('Pas de ligne invoke_response trouvée dans stdout'));
      }

      try {
        const prefixRegex = /^invoke_response:/;
        const trimmedResponse = responseLine.trim();
        const jsonResponse = trimmedResponse.replace(prefixRegex, '');
        const response = JSON.parse(jsonResponse);

        // Vérifier que le mode test a bien retourné le rawBacklog
        // La réponse mockée ne contient pas de clé 'result', les données sont à la racine
        expect(response.success).toBe(true);
        expect(response.rawBacklog).toBeDefined(); // Vérifier directement response.rawBacklog

        // Vérifier les caractères spéciaux directement dans rawBacklog
        const rawBacklogString = JSON.stringify(response.rawBacklog); // Utiliser response.rawBacklog
        expect(rawBacklogString).toContain('UTF-8');
        expect(rawBacklogString).toContain('汉字');
        expect(rawBacklogString).toContain('😃');
        expect(rawBacklogString).toContain('العربية');
        expect(rawBacklogString).toContain('кириллица');
        
        done(); // Succès
      } catch (e) {
        done(e); // Erreur (parsing JSON ou assertion)
      }
    });
  });

  test('Pas de JSON tronqué (gros projet)', (done) => {
    runMCPServer(largeProject, (stdout, stderr) => {
      // Cherche la réponse MCP "invoke_response"
      const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const responseLine = lines.find(l => l.includes('invoke_response'));
      expect(responseLine).toBeDefined();
      // Doit être un JSON complet
      const prefixRegex = /^invoke_response:/;
      const trimmedResponse = responseLine.trim();
      const jsonResponse = trimmedResponse.replace(prefixRegex, '');
      expect(() => JSON.parse(jsonResponse)).not.toThrow();
      expect(jsonResponse.trim().endsWith('}')).toBe(true);
      done();
    });
  });

  test('Aucune pollution STDOUT (logs MCP only)', (done) => {
    runMCPServer(utf8Project, (stdout, stderr) => {
      // Toutes les lignes STDOUT doivent être du JSON MCP
      const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const prefixRegex = /^invoke_response:/;
      for (const line of lines) {
        const trimmedLine = line.trim();
        const jsonLine = trimmedLine.replace(prefixRegex, '');
        expect(() => JSON.parse(jsonLine)).not.toThrow();
      }
      // Les logs doivent aller sur STDERR, pas sur STDOUT
      expect(stderr).toContain('Mode MCP activé');
      done();
    });
  });
});
