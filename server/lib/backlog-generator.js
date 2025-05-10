const OpenAI = require('openai');
const Groq = require('groq-sdk');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const validatorsFactory = require('./utils/validators/validators-factory');
const { parseJsonResponse } = require('./utils/json-parser');

/**
 * Initializes the OpenAI or GROQ client based on available API key
 * @param {string} openaiKey - OpenAI API key
 * @param {string} groqKey - GROQ API key
 * @returns {OpenAI} Initialized client instance
 */
function initializeClient(openaiKey, groqKey) {
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
    // Version moderne - uniquement format 'epics' (pluriel)
    required: ["epics", "mvp", "iterations"],
    properties: {
      // Support du format pluriel 'epics' (moderne)
      epics: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "title", "description"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" }
          }
        }
      },
      mvp: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          required: ["id", "title", "description", "acceptance_criteria", "tasks", "priority"],
          properties: {
            id: { type: "string", pattern: "^US\\d{3}$" },
            title: { type: "string" },
            description: { type: "string" },
            acceptance_criteria: {
              type: "array",
              minItems: 2,
              items: { type: "string" }
            },
            tasks: {
              type: "array",
              minItems: 2,
              items: { type: "string" }
            },
            priority: { enum: ["HIGH", "MEDIUM", "LOW"] }
          }
        }
      },
      iterations: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "object",
          required: ["name", "goal", "stories"],
          properties: {
            name: { type: "string" },
            goal: { type: "string" },
            stories: {
              type: "array",
              minItems: 1,
              items: { $ref: "#/properties/mvp/items" }
            }
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
  "mvp": [ ... ],
  "iterations": [ ... ]
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
      "slug": "titre-de-lepic-1" // slug généré à partir du titre
    }
  ],
  "mvp": [ // Crée exactement 3 user stories prioritaires
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
  ],
  "iterations": [ // Crée exactement 2 itérations
    {
      "name": "Iteration 1",
      "goal": "Objectif clair de l'itération",
      "stories": [ // Réutilise le même format que mvp
        {
          "id": "US004",
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
          "priority": "MEDIUM"
        }
      ]
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
- 3 user stories dans le MVP
- 2 itérations avec au moins 1 user story chacune

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
    // --- END DEBUG LOGS ---
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      functions: [{
        name: "deliver_backlog",
        description: "Renvoie un backlog agile structuré en JSON",
        parameters: backlogSchema
      }],
      function_call: { name: "deliver_backlog" },
      max_tokens: 8192
    });

    // Utiliser une chaîne optionnelle pour vérifier choices plus élégamment
    if (!completion.choices?.length) {
      throw new Error("Réponse API invalide: aucun choix retourné");
    }

    const functionCall = completion.choices[0].message.function_call;
    if (!functionCall) {
      return { valid: false, error: "Aucun appel de fonction retourné par l'API" };
    }
    
    let parsed;
    try {
      console.log(chalk.blue(`🔍 Tentative de parsing robuste de la réponse API pour le backlog...`));
      parsed = parseJsonResponse(functionCall.arguments, true);
      console.log(chalk.green(`✅ JSON parsé avec succès`));
    } catch (parseError) {
      console.error(chalk.red(`❌ Erreur lors du parsing JSON: ${parseError.message}`));
      console.error(chalk.yellow(`Début du contenu: ${functionCall.arguments.substring(0, 100)}...`));
      return { valid: false, error: `Erreur de parsing JSON: ${parseError.message}` };
    }
    
    return { valid: true, data: parsed, functionCall };
    
  } catch (error) {
    // Attraper toutes les erreurs et retourner un résultat invalide pour traitement en amont
    return { valid: false, error: error.message };
  }
}

/**
 * Valide un backlog contre le schéma
 * @param {Object} backlog - Le backlog à valider
 * @returns {Object} Résultat de la validation
 */
function validateBacklog(backlog) {
  console.log('[REAL validateBacklog] Received backlog:', JSON.stringify(backlog, null, 2).substring(0, 300));
  console.log(chalk.blue('🔎 Validation du backlog avec la factory...'));
  
  try {
    // Vérifications préliminaires avant d'utiliser la factory
    if (!backlog) {
      return { valid: false, errors: ['Backlog invalide ou manquant'] };
    }
    
    if (!backlog.projectName) {
      return { valid: false, errors: ['projectName est requis'] };
    }
    
    // Le backlog est considéré valide uniquement avec le format epics (pluriel)
    const hasEpics = backlog.epics && Array.isArray(backlog.epics);
    
    if (!hasEpics) {
      return { valid: false, errors: ['Le format epics est requis'] };
    }
    
    // Tentative de validation avec le validateur moderne
    const validationResult = validatorsFactory.validate(backlog, 'backlog');
    
    if (validationResult.valid) {
      console.log(chalk.green('✅ Backlog validé avec succès'));
    } else {
      console.log(chalk.yellow(`⚠️ Validation échouée: ${validationResult.errors[0]}`));
    }
    
    return validationResult;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la validation: ${error.message}`));
    return { valid: false, errors: [error.message] };
  }
}



/**
 * Tente de générer un backlog via l'API
 * @param {Object} client - Client API
 * @param {string} model - Modèle à utiliser
 * @param {Array} messages - Messages pour l'API
 * @param {Object} backlogSchema - Schéma de validation pour l'API
 * @returns {Promise<Object>} - Résultat de la tentative
 */
async function attemptBacklogGeneration(client, model, messages, backlogSchema) {
  const maxTries = 3;
  let lastValidationErrors = null;
  
  // Boucle de tentatives
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    // Appeler l'API pour générer le backlog
    const apiResult = await callApiForBacklog(client, model, messages, backlogSchema);
    
    if (!apiResult.valid) {
      lastValidationErrors = [{ message: apiResult.error }];
      continue;
    }
    
    // Valider le backlog généré
    const validationResult = validateBacklog(apiResult.data);
    
    if (validationResult.valid) {
      // Backlog validé, on retourne le résultat
      return {
        success: true,
        result: apiResult.data,
        lastValidationErrors: null
      };
    }
    
    // Erreurs de validation, on prépare un feedback pour l'IA
    lastValidationErrors = validationResult.errors;
    
    // Ajouter les messages pour la prochaine tentative
    messages.push(
      {
        role: "assistant",
        content: null,
        function_call: apiResult.functionCall
      },
      {
        role: "system",
        content: `La réponse JSON n'est pas valide : ${validationResult.errors.join(', ')}. Merci de ne renvoyer que le JSON conforme via deliver_backlog.`
      }
    );
  }
  
  // Après toutes les tentatives, si toujours invalide
  return {
    success: false,
    lastValidationErrors
  };
}

/**
 * Génère un backlog agile complet basé sur la description du projet
 * @param {string} projectName Nom du projet
 * @param {string} projectDescription Description du projet
 * @param {Object} client Client API à utiliser
 * @param {string} [provider='openai'] - API provider ('openai' or 'groq')
 * @returns {Promise<Object>} Generated backlog in JSON format
 */
async function generateBacklog(projectName, projectDescription, client, provider = 'openai') {
  console.log(chalk.blue('🧠 Génération du backlog à partir de la description...'));
  console.log(chalk.yellow(`Client API disponible: ${!!client}`));
  
  return new Promise((resolve, reject) => {
    const processBacklog = async () => {
      try {
        console.log(chalk.yellow('Début de la génération du backlog...'));
        
        // Traiter les paramètres et vérifier le client
        const paramsResult = processBacklogParams(projectName, projectDescription, client);
        if (!paramsResult.valid) {
          return resolve(handleBacklogError(paramsResult.error));
        }
        
        // Préparer les messages pour l'API
        const messages = createApiMessages(paramsResult.project);
        const model = determineModel(paramsResult.client);
        
        // Initialiser le schéma de validation pour l'API
        const backlogSchema = createBacklogSchema();
        
        // Tenter de générer le backlog
        const generationResult = await attemptBacklogGeneration(
          paramsResult.client, 
          model, 
          messages, 
          backlogSchema
        );

        // Harmonisation stories pour chaque feature
        if (generationResult.success && generationResult.result && Array.isArray(generationResult.result.epics)) {
          harmonizeStories(generationResult.result);
        }

        if (generationResult.success) {
          console.log(chalk.green('✅ Backlog généré avec succès!'));
          return resolve({
            success: true,
            result: generationResult.result
          });
        }
        
        // Échec de la génération
        const errorMessage = generationResult.lastValidationErrors?.join(', ') || 'Validation du backlog échouée';
        
        console.error(chalk.red(`❌ Erreur lors de la génération du backlog: ${errorMessage}`));
        return resolve(handleBacklogError(new Error(errorMessage)));
        
      } catch (error) {
        // Gestion des erreurs
        const errorMessage = error?.message || 'Une erreur est survenue lors de la génération du backlog';
        
        console.error(chalk.red(`❌ Exception lors de la génération du backlog: ${errorMessage}`));
        if (error?.stack) {
          console.error(error.stack);
        }
        
        return resolve({
          success: false,
          error: { message: errorMessage }
        });
      }
    };
    
    // Exécuter la fonction async
    processBacklog().catch(err => {
      const errorMessage = err?.message || 'Erreur interne pendant la génération du backlog';
      
      console.error(chalk.red(`❌ Erreur non gérée dans processBacklog: ${errorMessage}`));
      resolve(handleBacklogError(err));
    });
  });
}

/**
 * Alias direct pour générer un backlog avec shape uniforme et détails d'erreur
 */
async function generateBacklogDirect(projectName, projectDescription, client) {
  const params = processBacklogParams(projectName, projectDescription, client);
  if (!params.valid) {
    return { success: false, error: { message: params.error.message } };
  }
  const { project, client: apiClient } = params;
  const messages = createApiMessages(project);
  const model = determineModel(apiClient);
  const backlogSchema = createBacklogSchema();
  try {
    // Single API call
    const apiResult = await callApiForBacklog(apiClient, model, messages, backlogSchema);
    // API error
    if (!apiResult.valid) {
      return handleBacklogError(new Error(`Erreur lors de la génération du backlog: ${apiResult.error}`));
    }
    // Sécurisation : injecte projectName/projectDescription si absents
    if (apiResult.data && (!apiResult.data.projectName || !apiResult.data.projectDescription)) {
      apiResult.data.projectName = projectName;
      apiResult.data.projectDescription = projectDescription;
    }
    // Log pour vérification
    console.log('[DEBUG generateBacklogDirect] Backlog avant validation:', JSON.stringify(apiResult.data, null, 2).substring(0, 500));
    // Schema validation
    const validationResult = validateBacklog(apiResult.data);
    if (!validationResult.valid) {
      return handleBacklogError(new Error('Validation du backlog JSON avec le schéma a échoué.'));
    }
    // Success
    return { success: true, result: apiResult.data, error: null };
  } catch (err) {
    return handleBacklogError(err);
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
  generateBacklogDirect,
  processBacklogParams,
  harmonizeStories,
  handleBacklogError
};
