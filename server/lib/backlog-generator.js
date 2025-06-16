const OpenAI = require('openai');
const Groq = require('groq-sdk');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
// Ces importations ont été supprimées car non utilisées dans ce module
// const validatorsFactory = require('./utils/validators/validators-factory');
// const { parseJsonResponse } = require('./utils/json-parser');

const LOG_PATH = path.join(process.cwd(), '.agile-planner-backlog', 'debug-cli.log');
function debugLog(msg) {
  try { fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${msg}\n`); } catch (e) {
    // If logging to file fails, at least log the original message and error to console
    console.error(`Failed to write to debug log file (${LOG_PATH}): ${e.message}`);
    console.error(`Original debug message: ${msg}`);
  }
}

function initializeClient(openaiKey, groqKey) {
  debugLog(`initializeClient: openaiKey=${openaiKey ? '[OK]' : '[ABSENT]'}, groqKey=${groqKey ? '[OK]' : '[ABSENT]'}`);
  if (openaiKey) {
    return new OpenAI({ apiKey: openaiKey });
  } else if (groqKey) {
    return new Groq({ apiKey: groqKey });
  } else {
    throw new Error('No API key provided for OpenAI or GROQ');
  }
}

/**
 * Crée le schéma de validation pour une user story
 * @param {string} idPattern - Pattern de l'ID (US\d{3} ou OS\d{3})
 * @returns {Object} Schéma de validation pour une user story
 * @private
 */
function _createUserStorySchema(idPattern = "^US\\d{3}$") {
  return {
    type: "object",
    required: ["id", "title", "description", "acceptance_criteria", "tasks", "priority", "slug"],
    properties: {
      id: { type: "string", pattern: idPattern },
      title: { type: "string" },
      description: { type: "string" }, // Format: En tant que [rôle], je veux [action] afin de [bénéfice]
      acceptance_criteria: {
        type: "array",
        minItems: 1,
        items: { type: "string" } // Format: Étant donné [contexte], quand [action], alors [résultat]
      },
      tasks: {
        type: "array",
        minItems: 1,
        items: { type: "string" }
      },
      priority: { enum: ["HIGH", "MEDIUM", "LOW"] },
      slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }
    }
  };
}

/**
 * Crée le schéma de validation pour une feature
 * @returns {Object} Schéma de validation pour une feature
 * @private
 */
function _createFeatureSchema() {
  return {
    type: "object",
    required: ["id", "title", "description", "slug", "stories"],
    properties: {
      id: { type: "string", pattern: "^FEAT\\d{3}$" },
      title: { type: "string" },
      description: { type: "string" },
      slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      stories: {
        type: "array",
        minItems: 1, // Au moins une story par feature
        items: _createUserStorySchema()
      }
    }
  };
}

/**
 * Crée le schéma de validation pour un epic
 * @returns {Object} Schéma de validation pour un epic
 * @private
 */
function _createEpicSchema() {
  return {
    type: "object",
    required: ["id", "title", "description", "slug", "features"],
    properties: {
      id: { type: "string", pattern: "^EPIC\\d{3}$" },
      title: { type: "string" },
      description: { type: "string" },
      slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      features: {
        type: "array",
        minItems: 1, // Au moins une feature par epic
        items: _createFeatureSchema()
      }
    }
  };
}

/**
 * Crée le schéma de validation pour le backlog
 * @returns {Object} Schéma de validation JSON complet pour le backlog
 */
function createBacklogSchema() {
  return {
    type: "object",
    required: ["projectName", "projectDescription", "epics", "orphan_stories"],
    properties: {
      projectName: { type: "string" },
      projectDescription: { type: "string" },
      epics: {
        type: "array",
        minItems: 1, // Au moins un epic
        items: _createEpicSchema()
      },
      orphan_stories: {
        type: "array",
        items: _createUserStorySchema("^OS\\d{3}$") // OS pour Orphan Story
      }
    }
  };
}

/**
 * Détermine le modèle à utiliser en fonction du client API
 * @param {Object} client - Le client API (OpenAI ou GROQ)
 * @param {string} taskComplexity - Complexité de la tâche ('standard', 'high', 'low')
 * @returns {string} Le nom du modèle à utiliser
 */
function determineModel(client, taskComplexity = 'standard') {
  if (client.baseURL === undefined || client.baseURL.includes('openai.com')) {
    // OpenAI: only allow gpt-4.1 or o4-mini
    switch (taskComplexity) {
      case 'high':
      case 'standard':
        return "gpt-4.1"; // Only allow gpt-4.1 for high/standard
      case 'low':
        return "o4-mini"; // Only allow o4-mini for low
      default:
        return "gpt-4.1";
    }
  } else {
    // Non-OpenAI models (e.g., GROQ)
    return "llama3-70b-8192";
  }
}

/**
 * Crée le message d'instruction système pour l'API LLM
 * @param {string} projectName - Nom du projet
 * @param {string} projectDescription - Description du projet
 * @returns {Object} Message système formaté
 * @private
 */
function _createSystemPrompt(projectName, projectDescription) {
  return {
    role: "system",
    content: `Tu es un expert Product Owner agile. Génère un backlog agile détaillé pour un projet informatique en suivant strictement le schéma JSON demandé.

IMPORTANT : Le JSON généré doit OBLIGATOIREMENT avoir à la racine :
{
  "projectName": "${projectName}",
  "projectDescription": "${projectDescription}",
  "epics": [ ... ],
  "orphan_stories": [ ... ]
}
N'ajoute AUCUN texte avant ou après le JSON. Respecte strictement ces propriétés à la racine.

Structure requise:
{
  "projectName": "${projectName}", // Obligatoire, utilise ce nom exact
  "epics": [ // Crée exactement 2 epics significatifs pour ce projet
    {
      "id": "EPIC001",
      "title": "Titre de l'epic 1",
      "description": "Description détaillée",
      "slug": "titre-de-lepic-1", // slug généré à partir du titre
      "features": [ ... ]
    }
  ],
  "orphan_stories": [ ... ]
}
`
  };
}

/**
 * Crée le message utilisateur pour l'API LLM
 * @param {string} projectName - Nom du projet
 * @param {string} projectDescription - Description du projet
 * @returns {Object} Message utilisateur formaté
 * @private
 */
function _createUserPrompt(projectName, projectDescription) {
  return {
    role: "user",
    content: `Génère un backlog agile détaillé pour le projet suivant: ${projectName}
Description: ${projectDescription}

Le backlog doit contenir au minimum:
- 2 epics significatifs
- 1 feature par epic
- 1 story par feature
- 1 story orpheline

Tout le contenu doit être pertinent pour ${projectName} et basé sur la description fournie.`
  };
}

/**
 * Crée les messages pour l'API
 * @param {string|Object} project - Description complète du projet sous forme de chaîne "nom: description" ou objet {name, description}
 * @returns {Array} Messages formatés pour l'API
 */
function createApiMessages(project) {
  let projectName = 'Projet sans nom';
  let projectDescription = 'Pas de description';

  if (project && typeof project === 'object') {
    projectName = project.name || projectName;
    projectDescription = project.description || projectDescription;
  } else if (typeof project === 'string') {
    const splitProject = project.split(': ');
    projectName = splitProject[0] || projectName;
    projectDescription = splitProject[1] || projectDescription;
  }
  
  return [
    _createSystemPrompt(projectName, projectDescription),
    _createUserPrompt(projectName, projectDescription)
  ];
}

/**
 * Effectue un appel API pour générer le backlog
 * @param {Object} client - Le client API
 * @param {string} model - Le modèle à utiliser
 * @param {Array} messages - Les messages pour l'API
 * @param {Object} backlogSchema - Le schéma de validation
 * @returns {Promise<Object>} Résultat de l'appel API
 */
async function callApiForBacklog(client, model, messages, backlogSchema) {
  // Si un constructeur est passé, instancier pour obtenir .chat
  if (typeof client === 'function') {
    client = new client();
  }
  try {
    console.error(chalk.blue('✨ Appel API en cours (stderr)... Modèle:'), model);
    // --- BEGIN DEBUG LOGS ---
    console.error('[DEBUG callApiForBacklog] Client object:', client);
    if (client) {
      console.error('[DEBUG callApiForBacklog] client.chat exists:', !!client.chat);
      if (client.chat) {
        console.error('[DEBUG callApiForBacklog] client.chat.completions exists:', !!client.chat.completions);
      }
    } else {
      console.error('[DEBUG callApiForBacklog] Client is null or undefined');
    }
    // Appel à l'API OpenAI/GROQ avec paramètres optimisés
    debugLog('generateBacklog: appel client.chat.completions.create...');
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      functions: backlogSchema.functions || undefined
    });

    // Vérifie que la réponse contient bien un choix
    if (!completion.choices?.length) {
      throw new Error("Réponse API invalide: aucun choix retourné");
    }
    // Récupération de la réponse
    debugLog('generateBacklog: réponse API reçue');
    const content = completion.choices[0].message.content;
    debugLog(`generateBacklog: réponse API (début): ${content ? content.slice(0, 120) : '[vide]'}`);
    return JSON.parse(content);
  } catch (error) {
    debugLog('callApiForBacklog: ERREUR ' + (error && error.message ? error.message : error));
    throw error;
  }
}
async function generateBacklog(projectName, projectDescription, client, provider = 'openai') {
  console.error('DEBUG_BACKLOG_GENERATOR: Entrée dans generateBacklog. Client reçu:', client);
  console.error('DEBUG_BACKLOG_GENERATOR: Provider reçu:', provider);
  debugLog(`generateBacklog: appelé avec client=${client ? '[OK]' : '[UNDEFINED]'}`);
  // Note: Bien que l'opérateur de chaînage optionnel (?.) soit recommandé par SonarQube,
  // dans ce cas précis, l'expression ternaire est plus claire car nous vérifions
  // l'existence de l'objet client lui-même, pas d'une propriété sur client.
  if (!client) {
    debugLog('generateBacklog: ERREUR client API non initialisé');
    throw new Error('Client API non initialisé');
  }
  debugLog('generateBacklog: début appel API');
  console.error(chalk.blue('🧠 Génération du backlog à partir de la description (stderr)...'));
  console.error(chalk.yellow(`Client API disponible (stderr): ${!!client}`));

  const fullProject = `${projectName}: ${projectDescription}`;
  const model = determineModel(client);
  const messages = createApiMessages(fullProject);
  const schema = createBacklogSchema();

  try {
    const rawResultFromApi = await callApiForBacklog(client, model, messages, schema);
    console.error(chalk.magentaBright('DEBUG_BACKLOG_GENERATOR: Raw result from callApiForBacklog:'), JSON.stringify(rawResultFromApi, null, 2));

    // Basic validation of rawResultFromApi
    if (!rawResultFromApi || typeof rawResultFromApi !== 'object' || Object.keys(rawResultFromApi).length === 0) {
      console.error(chalk.red('DEBUG_BACKLOG_GENERATOR: callApiForBacklog returned invalid or empty result.'), rawResultFromApi);
      throw new Error('Failed to get valid data from LLM API. Result was empty or not an object.');
    }

    // Example check: A successful backlog result should ideally have epics or a project name.
    // This check might need refinement based on the actual minimal valid structure from the LLM.
    if (typeof rawResultFromApi.projectName === 'undefined' && !Array.isArray(rawResultFromApi.epics)) {
      console.error(chalk.red('DEBUG_BACKLOG_GENERATOR: callApiForBacklog result missing expected fields (projectName or epics).'), rawResultFromApi);
      throw new Error('LLM API result is missing expected fields like projectName or epics.');
    }

    const outputDir = path.join(process.cwd(), '.agile-planner-backlog');
    await fs.ensureDir(outputDir);
    const jsonPath = path.join(outputDir, 'backlog.json');
    
    console.error(chalk.blueBright(`DEBUG_BACKLOG_GENERATOR: Attempting to write the following to ${jsonPath}:`), JSON.stringify(rawResultFromApi, null, 2));
    await fs.writeFile(jsonPath, JSON.stringify(rawResultFromApi, null, 2));
    console.error(chalk.green(`✅ Backlog généré avec succès : ${jsonPath}`));
    return rawResultFromApi;
  } catch (error) {
    debugLog(`generateBacklog: ERREUR ${error?.message ?? error}`);
    throw error;
  }
}

/**
 * Sauvegarde le backlog brut généré au format JSON
 * @param {Object} result - Le résultat de la génération
 * @param {string} outputDir - Le répertoire de sortie
 * @param {Object} options - Options de sauvegarde
 * @param {boolean} options.auditMode - Sauvegarde en mode audit (backlog-last-dump.json)
 * @returns {Promise<string>} - Chemin du fichier généré
 */
async function saveRawBacklog(result, outputDir = './output', options = {}) {
  try {
    const fs = require('fs-extra');
    const path = require('path');
    
    await fs.ensureDir(outputDir);
    
    // Déterminer le nom du fichier selon le mode
    // Mode audit : backlog-last-dump.json (utilisé par les tests et l'audit CLI)
    // Mode normal : backlog.json (utilisation standard)
    const fileName = options.auditMode ? 'backlog-last-dump.json' : 'backlog.json';
    const jsonPath = path.join(outputDir, fileName);
    
    await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
    
    debugLog(`Backlog sauvegardé avec succès dans : ${jsonPath}`);
    console.error(chalk.green(`✅ Backlog sauvegardé avec succès : ${jsonPath}`));
    
    return jsonPath;
  } catch (error) {
    debugLog(`saveRawBacklog: ERREUR ${error?.message ?? error}`);
    console.error('Erreur lors de la sauvegarde du backlog au format JSON:', error);
    throw error;
  }
}

/**
 * Valide les paramètres d'entrée pour la génération du backlog
 * @param {string} projectName
 * @param {string} projectDescription
 * @param {Object} client
 * @returns {{valid: boolean, error?: Error, project?: Object, client?: Object}}
 */
function processBacklogParams(projectName, projectDescription, client) {
  if (!projectName || typeof projectName !== 'string') {
    return { valid: false, error: new Error('Nom de projet invalide') };
  }
  if (!projectDescription || typeof projectDescription !== 'string') {
    return { valid: false, error: new Error('Description de projet invalide') };
  }
  if (!client) {
    return { valid: false, error: new Error('Client API non fourni') };
  }
  return {
    valid: true,
    project: { name: projectName, description: projectDescription },
    client
  };
}

/**
 * Harmonise les stories dans toutes les features de chaque epic
 * @param {Object} backlogResult
 */
function harmonizeStories(backlogResult) {
  if (!Array.isArray(backlogResult.epics)) return;
  for (const epic of backlogResult.epics) {
    if (Array.isArray(epic.features)) {
      for (const feature of epic.features) {
        if (!Array.isArray(feature.stories)) {
          feature.stories = [];
        }
        if (feature.stories.length === 0) {
          console.error(chalk.yellow(`⚠️ Feature "${feature.title}" sans user stories : un dossier user-stories vide sera généré.`));
        }
      }
    }
  }
}

/**
 * Formate une erreur pour la génération du backlog
 * @param {Error} error
 * @returns {{success: false, error: {message: string}}}
 */
function handleBacklogError(error) {
  const errorMessage = error?.message ?? 'Une erreur est survenue lors de la génération du backlog';
  return {
    success: false,
    error: { message: errorMessage }
  };
}

module.exports = {
  // Fonctions principales
  initializeClient,
  generateBacklog,
  saveRawBacklog,
  
  // Fonctions utilitaires
  processBacklogParams,
  createApiMessages,
  determineModel,
  createBacklogSchema,
  harmonizeStories,
  handleBacklogError,
  
  // Pour les tests unitaires
  attemptBacklogGeneration: callApiForBacklog // aliased for backward compatibility
};
