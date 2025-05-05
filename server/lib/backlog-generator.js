const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Ajv = require("ajv");

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
    return new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
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
    required: ["epic", "mvp", "iterations"],
    properties: {
      epic: {
        type: "object",
        required: ["title", "description"],
        properties: {
          title: { type: "string" },
          description: { type: "string" }
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
  try {
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

    if (!completion.choices || !completion.choices.length) {
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
    if (error.message === 'Réponse API invalide: aucun choix retourné') {
      return { valid: false, error: error.message };
    }
    throw error;
  }
}

/**
 * Valide un backlog contre le schéma
 * @param {Object} backlog - Le backlog à valider
 * @param {Function} validator - La fonction de validation
 * @returns {Object} Résultat de la validation
 */
function validateBacklog(backlog, validator) {
  const valid = validator(backlog);
  if (!valid) {
    const errorMsg = validator.errors.map(e => `${e.instancePath} ${e.message}`).join("; ");
    return { valid: false, errors: validator.errors, errorMsg };
  }
  return { valid: true };
}

/**
 * Generates a backlog from the project description
 * @param {string} projectName - Name of the project or full description
 * @param {string|Object} projectDescription - Project description or client object
 * @param {Object} [client] - Initialized OpenAI/GROQ client
 * @param {string} [provider='openai'] - API provider ('openai' or 'groq')
 * @returns {Promise<Object>} Generated backlog in JSON format
 */
async function generateBacklog(projectName, projectDescription, client, provider = 'openai') {
  // Handle legacy parameter order (project, client) for backward compatibility with tests
  if (typeof projectDescription === 'object' && !client) {
    client = projectDescription;
    projectDescription = '';
  }
  
  // Vérification du client
  if (!client) {
    return {
      success: false,
      error: {
        message: "Client API non défini",
        details: [{ message: "L'objet client est undefined ou null" }]
      }
    };
  }

  // Format project for the prompt
  const project = `${projectName}: ${projectDescription}`;

  // Initialiser le schéma de validation et les validateurs
  const backlogSchema = createBacklogSchema();
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(backlogSchema);

  // Préparer les messages pour l'API
  const messages = createApiMessages(project);
  const model = determineModel(client);
  
  // Limite de tentatives
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
    const validationResult = validateBacklog(apiResult.data, validate);
    
    if (validationResult.valid) {
      // Backlog validé, on retourne le résultat
      return { success: true, result: apiResult.data };
    } else {
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
          content: `La réponse JSON n'est pas valide : ${validationResult.errorMsg}. Merci de ne renvoyer que le JSON conforme via deliver_backlog.`
        }
      );
    }
  }

  // Après toutes les tentatives, si toujours invalide, retourne une erreur
  return {
    success: false,
    error: {
      message: "Validation du backlog échouée",
      details: lastValidationErrors
    }
  };
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
    
    // Créer le répertoire s'il n'existe pas
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
  saveRawBacklog
};
