const OpenAI = require('openai');
const Groq = require('groq-sdk');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const validatorsFactory = require('./utils/validators/validators-factory');
const { parseJsonResponse } = require('./utils/json-parser');

const LOG_PATH = path.join(process.cwd(), '.agile-planner-backlog', 'debug-cli.log');
function debugLog(msg) {
  try { fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${msg}\n`); } catch (e) {}
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
 * Crée le schéma de validation pour le backlog
 * @returns {Object} Schéma de validation JSON
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
        items: {
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
              items: {
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
                    items: {
                      type: "object",
                      required: ["id", "title", "description", "acceptance_criteria", "tasks", "priority", "slug"],
                      properties: {
                        id: { type: "string", pattern: "^US\\d{3}$" },
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
                    }
                  }
                }
              }
            }
          }
        }
      },
      orphan_stories: {
        type: "array",
        items: { // Réutilise la même définition de story que ci-dessus
          type: "object",
          required: ["id", "title", "description", "acceptance_criteria", "tasks", "priority", "slug"],
          properties: {
            id: { type: "string", pattern: "^OS\\d{3}$" }, // OS pour Orphan Story
            title: { type: "string" },
            description: { type: "string" },
            acceptance_criteria: {
              type: "array",
              minItems: 1,
              items: { type: "string" }
            },
            tasks: {
              type: "array",
              minItems: 1,
              items: { type: "string" }
            },
            priority: { enum: ["HIGH", "MEDIUM", "LOW"] },
            slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }
          }
        }
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
 * Crée les messages pour l'API
 * @param {string} project - Description complète du projet
 * @returns {Array} Messages formatés pour l'API
 */
function createApiMessages(project) {
  const [projectName, projectDescription] = project.split(': ');
  
  return [
    {
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
      "features": [
        {
          "id": "FEAT001",
          "title": "Titre de la feature",
          "description": "Description détaillée",
          "slug": "titre-de-la-feature",
          "stories": [
            {
              "id": "US001", // Format requis: US + 3 chiffres
              "title": "Titre de la story",
              "description": "En tant que [rôle], je veux [action] afin de [bénéfice]",
              "acceptance_criteria": [
                "Critère 1: Étant donné [contexte], quand [action], alors [résultat]",
                "Critère 2: Étant donné [contexte], quand [action], alors [résultat]"
              ],
              "tasks": [
                "Tâche technique 1",
                "Tâche technique 2"
              ],
              "priority": "HIGH" // Valeurs acceptées: HIGH, MEDIUM, LOW
            }
          ]
        }
      ]
    }
  ],
  "orphan_stories": [
    {
      "id": "OS001",
      "title": "Titre de la story orpheline",
      "description": "En tant que [rôle], je veux [action] afin de [bénéfice]",
      "acceptance_criteria": [
        "Critère 1: Étant donné [contexte], quand [action], alors [résultat]",
        "Critère 2: Étant donné [contexte], quand [action], alors [résultat]"
      ],
      "tasks": [
        "Tâche technique 1",
        "Tâche technique 2"
      ],
      "priority": "MEDIUM"
    }
  ]
}
`
    },
    {
      role: "user",
      content: `Génère un backlog agile détaillé pour le projet suivant: ${projectName}
Description: ${projectDescription}

Le backlog doit contenir au minimum:
- 2 epics significatifs
- 1 feature par epic
- 1 story par feature
- 1 story orpheline

Tout le contenu doit être pertinent pour ${projectName} et basé sur la description fournie.`
    }
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
    console.log(chalk.blue('✨ Appel API en cours... Modèle:'), model);
    // --- BEGIN DEBUG LOGS ---
    console.log('[DEBUG callApiForBacklog] Client object:', client);
    if (client) {
      console.log('[DEBUG callApiForBacklog] client.chat exists:', !!client.chat);
      if (client.chat) {
        console.log('[DEBUG callApiForBacklog] client.chat.completions exists:', !!client.chat.completions);
      }
    } else {
      console.log('[DEBUG callApiForBacklog] Client is null or undefined');
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
  console.log('DEBUG_BACKLOG_GENERATOR: Entrée dans generateBacklog. Client reçu:', client);
  console.log('DEBUG_BACKLOG_GENERATOR: Provider reçu:', provider);
  debugLog(`generateBacklog: appelé avec client=${client ? '[OK]' : '[UNDEFINED]'}`);
  if (!client) {
    debugLog('generateBacklog: ERREUR client API non initialisé');
    throw new Error('Client API non initialisé');
  }
  debugLog('generateBacklog: début appel API');
  console.log(chalk.blue('🧠 Génération du backlog à partir de la description...'));
  console.log(chalk.yellow(`Client API disponible: ${!!client}`));

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
    console.log(chalk.green(`✅ Backlog généré avec succès : ${jsonPath}`));
    return rawResultFromApi;
  } catch (error) {
    debugLog('generateBacklog: ERREUR ' + (error && error.message ? error.message : error));
    throw error;
  }
}

/**
 * Sauvegarde le backlog brut généré au format JSON
 * @param {Object} result - Le résultat de la génération
 * @param {string} outputDir - Le répertoire de sortie
 * @returns {Promise<string>} - Chemin du fichier généré
 */
async function saveRawBacklog(result, outputDir = './output') {
  try {
    const fs = require('fs-extra');
    const path = require('path');
    
    await fs.ensureDir(outputDir);
    
    const jsonPath = path.join(outputDir, 'backlog.json');
    await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
    
    return jsonPath;
  } catch (error) {
    debugLog('saveRawBacklog: ERREUR ' + (error && error.message ? error.message : error));
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
          console.warn(chalk.yellow(`⚠️ Feature "${feature.title}" sans user stories : un dossier user-stories vide sera généré.`));
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
  const errorMessage = error?.message || 'Une erreur est survenue lors de la génération du backlog';
  return {
    success: false,
    error: { message: errorMessage }
  };
}

module.exports = {
  initializeClient,
  generateBacklog,
  saveRawBacklog,
  processBacklogParams,
  harmonizeStories,
  handleBacklogError
};
