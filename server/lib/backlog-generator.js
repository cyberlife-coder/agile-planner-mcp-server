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
 * Generates a backlog from the project description
 * @param {string} project - Project description
 * @param {Object} client - Initialized OpenAI/GROQ client
 * @returns {Promise<Object>} Generated backlog in JSON format
 */
async function generateBacklog(project, client) {
  // --- Ajout pour validation stricte du backlog IA ---
  const backlogSchema = {
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
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(backlogSchema);

  // Construction du prompt/messages
  const messages = [
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
  let maxTries = 3;
  let lastValidationErrors = null;
  let completion, call, parsed;
  const model = client.baseURL === undefined || client.baseURL.includes('openai.com') ? "gpt-4.1" : "llama3-70b-8192";

  for (let attempt = 1; attempt <= maxTries; attempt++) {
    completion = await client.chat.completions.create({
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

    call = completion.choices[0].message.function_call;
    if (!call) {
      lastValidationErrors = [{ message: "Aucun appel de fonction retourné par l’API" }];
      break;
    }
    parsed = JSON.parse(call.arguments);
    const valid = validate(parsed);

    if (valid) {
      // Réponse conforme au schéma, retourne le backlog pour génération de fichiers
      return { success: true, result: parsed };
    } else {
      // Erreurs de validation, prépare un feedback pour l’IA
      lastValidationErrors = validate.errors;
      const errorMsg = validate.errors.map(e => `${e.instancePath} ${e.message}`).join("; ");
      messages.push(
        {
          role: "assistant",
          content: null,
          function_call: call
        },
        {
          role: "system",
          content: `La réponse JSON n’est pas valide : ${errorMsg}. Merci de ne renvoyer que le JSON conforme via deliver_backlog.`
        }
      );
    }
  }

  // Après toutes les tentatives, si toujours invalide, retourne une erreur MCP
  return {
    success: false,
    error: {
      message: "Validation du backlog échouée",
      details: lastValidationErrors
    }
  };
}

module.exports = {
  initializeClient,
  generateBacklog
};
