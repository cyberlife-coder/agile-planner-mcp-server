// Test d'intégration end-to-end CLI Agile Planner
const { exec } = require('child_process');
const fs = require('fs');

describe('CLI End-to-End', () => {
  it('génère un backlog complet sans erreur', done => {
    exec('node server/index.js --generateBacklog', { cwd: process.cwd() }, (error, stdout, stderr) => {
      expect(error).toBeNull();
      expect(fs.existsSync('.agile-planner-backlog/backlog-last-dump.json')).toBe(true);
      done();
    });
  });
});
