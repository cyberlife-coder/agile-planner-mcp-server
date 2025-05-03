const inquirer = require('inquirer');
const chalk = require('chalk');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra');
const backlogGenerator = require('./backlog-generator');
const markdownGenerator = require('./markdown-generator');

// Charger les variables d'environnement
dotenv.config();

/**
 * Lance l'interface interactive en ligne de commande
 */
async function startCLI() {
  console.log(chalk.blue.bold('🚀 Agile Planner - Générateur de Backlog'));
  console.log(chalk.blue('------------------------------------------\n'));

  // Vérifier les clés API
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.log(chalk.yellow('⚠️  Aucune clé API trouvée dans les variables d\'environnement'));
    
    const { useEnvFile } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useEnvFile',
        message: 'Voulez-vous créer un fichier .env pour stocker votre clé API?',
        default: true,
      }
    ]);
    
    if (useEnvFile) {
      await createEnvFile();
      console.log(chalk.green('✅ Veuillez redémarrer l\'application après avoir configuré le fichier .env'));
      return;
    }
  }
  
  // Demander la description du projet
  const answers = await inquirer.prompt([
    {
      type: 'editor',
      name: 'project',
      message: 'Décrivez votre projet (un éditeur va s\'ouvrir):',
      validate: input => input.trim().length > 0 ? true : 'La description du projet est requise'
    },
    {
      type: 'confirm',
      name: 'saveRaw',
      message: 'Souhaitez-vous également sauvegarder le fichier JSON brut?',
      default: false
    }
  ]);
  
  try {
    console.log(chalk.blue('\n🔍 Génération du backlog en cours...'));
    
    // Initialiser le client
    const client = backlogGenerator.initializeClient(process.env.OPENAI_API_KEY, process.env.GROQ_API_KEY);
    
    // Générer le backlog
    const backlog = await backlogGenerator.generateBacklog(answers.project, client);
    
    // Générer les fichiers Markdown
    await markdownGenerator.generateMarkdownFiles(backlog);
    
    // Sauvegarder le JSON brut si demandé
    if (answers.saveRaw) {
      await markdownGenerator.saveRawBacklog(backlog);
    }
    
    console.log(chalk.green.bold('\n✅ Backlog généré avec succès!'));
    console.log(chalk.green('📁 Fichiers créés:'));
    console.log(chalk.green('   - epic.md'));
    console.log(chalk.green('   - mvp/user-stories.md'));
    
    backlog.iterations.forEach(iteration => {
      const dirName = iteration.name.toLowerCase().replace(/\s+/g, '-');
      console.log(chalk.green(`   - iterations/${dirName}/user-stories.md`));
    });
    
    if (answers.saveRaw) {
      console.log(chalk.green('   - backlog.json'));
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Erreur lors de la génération du backlog:'), error.message);
  }
}

/**
 * Crée un fichier .env interactif
 */
async function createEnvFile() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Quel fournisseur d\'API souhaitez-vous utiliser?',
      choices: ['OpenAI', 'GROQ'],
      default: 'OpenAI'
    },
    {
      type: 'password',
      name: 'apiKey',
      message: answers => `Entrez votre clé API ${answers.provider}:`,
      validate: input => input.trim().length > 0 ? true : 'La clé API est requise'
    }
  ]);
  
  const envContent = answers.provider === 'OpenAI'
    ? `OPENAI_API_KEY=${answers.apiKey}\n# GROQ_API_KEY=your_groq_api_key_here`
    : `# OPENAI_API_KEY=your_openai_api_key_here\nGROQ_API_KEY=${answers.apiKey}`;
  
  const envPath = path.join(process.cwd(), '.env');
  
  await fs.writeFile(envPath, envContent, 'utf8');
  console.log(chalk.green(`✅ Fichier .env créé à ${envPath}`));
}

module.exports = {
  startCLI
};
