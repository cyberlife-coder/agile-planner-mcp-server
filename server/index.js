#!/usr/bin/env node
const { generateBacklogCLI } = require('./lib/cli');

const args = process.argv.slice(2);

if (args.includes('--generateBacklog')) {
  // Parsing simple : node server/index.js --generateBacklog "projectName" "projectDescription" --output-path=".agile-planner-backlog"
  const projectName = args[args.indexOf('--generateBacklog') + 1];
  const projectDescription = args[args.indexOf('--generateBacklog') + 2];
  const outputPathArg = args.find(arg => arg.startsWith('--output-path='));
  const outputPath = outputPathArg ? outputPathArg.split('=')[1].replace(/['"]+/g, '') : undefined;

  if (!projectName || !projectDescription) {
    console.error('❌ Erreur : projectName et projectDescription sont requis.');
    console.error('Usage : node server/index.js --generateBacklog "projectName" "projectDescription" --output-path=".agile-planner-backlog"');
    process.exit(1);
  }
  console.log(`🟦 [DEBUG] projectName="${projectName}", projectDescription="${projectDescription}", outputPath="${outputPath}"`);
  generateBacklogCLI({ projectName, projectDescription, outputPath });
} else {
  console.log('Usage: node server/index.js --generateBacklog "projectName" "projectDescription" --output-path=".agile-planner-backlog"');
}
