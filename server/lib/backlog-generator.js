const OpenAI = require('openai');
const Groq = require('groq-sdk');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const validatorsFactory = require('./utils/validators/validators-factory');

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
 * @returns {string} Le nom du modèle à utiliser
 */
function determineModel(client) {
  return client.baseURL === undefined || client.baseURL.includes('openai.com') 
    ? "gpt-4.1" 
    : "llama3-70b-8192";
}

/**
 * Crée les messages pour l'API
 * @param {string} project - Description complète du projet
 * @returns {Array} Messages formatés pour l'API
 */
function createApiMessages(project) {
  return [
    {
      role: "system",
      content: "You are an expert agile product owner. Generate a detailed agile backlog as a valid JSON object strictly following the given JSON schema and structure. Include all required fields and respect all constraints."
    },
    {
      role: "user",
      content: `Project description: ${project}`
    },
    {
      role: "system",
      content: `Le backlog doit comporter :\n- Un objet 'epic' (titre, description)\n- Un tableau 'mvp' (3 à 5 user stories complètes avec id, title, description, acceptance_criteria, tasks, priority)\n- Un tableau 'iterations' (2 à 3 itérations, chaque itération a un nom, un goal, et des stories conformes au schéma user story).\nRespecte strictement ce format. N'invente pas de champs en plus.\nProduce a valid JSON that I can use directly.`
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
      parsed = JSON.parse(functionCall.arguments);
    } catch (parseError) {
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
 * Traite les paramètres du backlog et vérifie la présence du client API
 * @param {string} projectName - Nom du projet
 * @param {string} projectDescription - Description du projet
 * @param {Object} client - Client API
 * @returns {Object} - Résultat du traitement des paramètres
 */
function processBacklogParams(projectName, projectDescription, client) {
  // Handle legacy parameter order (project, client) for backward compatibility with tests
  if (typeof projectDescription === 'object' && !client) {
    client = projectDescription;
    projectDescription = '';
  }
  
  // Fallback: instantiate default client from env if none provided
  if (!client) {
    client = initializeClient(process.env.OPENAI_API_KEY, process.env.GROQ_API_KEY);
  }
  
  // Vérification du client
  if (!client) {
    return {
      valid: false,
      error: { message: "Client API non défini" }
    };
  }
  
  return {
    valid: true,
    project: `${projectName}: ${projectDescription}`,
    client
  };
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
          return resolve({
            success: false,
            error: { message: paramsResult.error.message }
          });
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
        return resolve({
          success: false,
          error: { message: errorMessage }
        });
        
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
      resolve({
        success: false,
        error: { message: errorMessage }
      });
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
      return { success: false, error: { message: `Erreur lors de la génération du backlog: ${apiResult.error}` } };
    }
    // Schema validation
    const validationResult = validateBacklog(apiResult.data);
    if (!validationResult.valid) {
      return {
        success: false,
        error: { message: 'Validation du backlog JSON avec le schéma a échoué.', details: validationResult.errors }
      };
    }
    // Success
    return { success: true, result: apiResult.data, error: null };
  } catch (err) {
    return { success: false, error: { message: `Erreur lors de la génération du backlog: ${err.message}` } };
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

module.exports = {
  initializeClient,
  generateBacklog,
  saveRawBacklog,
  generateBacklogDirect
};
