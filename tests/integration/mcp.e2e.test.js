// Test d'intégration end-to-end MCP (stdio) Agile Planner
const { spawn } = require('child_process');
const fs = require('fs');

describe('MCP stdio End-to-End', () => {
  it('répond correctement à une commande MCP', done => {
    const mcp = spawn('node', ['server/index.js'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    mcp.stdout.on('data', data => { output += data.toString(); });
    mcp.stdin.write(JSON.stringify({ command: 'generateBacklog' }) + '\n');
    setTimeout(() => {
      expect(fs.existsSync('.agile-planner-backlog/backlog-last-dump.json')).toBe(true);
      mcp.kill();
      done();
    }, 3000);
  });
});
