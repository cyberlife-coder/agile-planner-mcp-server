/**
 * Module responsable de la génération de features et des user stories associées
 */

const Ajv = require('ajv');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

const ajv = new Ajv({ allErrors: true });

// Schéma de validation pour la réponse JSON
const featureResponseSchema = {
  type: 'object',
  required: ['feature', 'userStories'],
  properties: {
    feature: {
      type: 'object',
      required: ['title', 'description'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        businessValue: { type: 'string' }
      }
    },
    userStories: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['title', 'asA', 'iWant', 'soThat', 'acceptanceCriteria', 'tasks'],
        properties: {
          title: { type: 'string' },
          asA: { type: 'string' },
          iWant: { type: 'string' },
          soThat: { type: 'string' },
          acceptanceCriteria: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['given', 'when', 'then'],
              properties: {
                given: { type: 'string' },
                when: { type: 'string' },
                then: { type: 'string' }
              }
            }
          },
          tasks: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['description'],
              properties: {
                description: { type: 'string' },
                estimate: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

const validate = ajv.compile(featureResponseSchema);

/**
 * Détermine le modèle à utiliser en fonction du fournisseur
 * @param {string} provider - Le fournisseur de l'API (openai, groq)
 * @returns {string} - Le modèle à utiliser
 */
function determineModel(provider) {
  if (provider === 'groq') {
    return process.env.GROQ_MODEL || 'llama3-70b-8192';
  }
  return process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
}

/**
 * Génère une feature et les user stories associées
 * @param {Object} params - Paramètres pour la génération
 * @param {string} params.featureDescription - Description de la feature
 * @param {number} params.storyCount - Nombre de user stories à générer
 * @param {string} params.businessValue - Valeur business de la feature
 * @param {Object} client - Client API (OpenAI ou Groq)
 * @param {string} provider - Fournisseur d'API ('openai' ou 'groq')
 * @returns {Promise<Object>} - L'objet feature généré
 */
async function generateFeature(params, client, provider = 'openai') {
  const {
    featureDescription,
    storyCount = 3,
    businessValue = ""
  } = params;
  
  console.error(chalk.blue('🔄 Génération de la feature en cours...'));
  
  // Adapter prompt pour AI pour générer une feature spécifique
  const prompt = `
    Génère une feature agile complète basée sur cette description: "${featureDescription}".
    Business value: "${businessValue}"
    
    Crée exactement ${storyCount} user stories qui respectent les critères INVEST:
    - Independent (Indépendante)
    - Negotiable (Négociable)
    - Valuable (Utile)
    - Estimable (Estimable)
    - Small (Petite)
    - Testable (Testable)
    
    Pour chaque user story, inclus:
    1. Un titre clair
    2. Une description au format "En tant que... Je veux... Afin de..."
    3. Des critères d'acceptation au format Gherkin (Given/When/Then)
    4. 3-5 tâches techniques pour l'implémentation
    
    Format JSON attendu:
    {
      "feature": { 
        "title": "Titre descriptif de la feature", 
        "description": "Description détaillée de la feature", 
        "businessValue": "Valeur métier de cette feature" 
      },
      "userStories": [
        {
          "title": "Titre de la user story",
          "asA": "En tant que [rôle]",
          "iWant": "Je veux [action]",
          "soThat": "Afin de [bénéfice]",
          "acceptanceCriteria": [
            { "given": "Étant donné que...", "when": "Quand...", "then": "Alors..." }
          ],
          "tasks": [
            { "description": "Description de la tâche", "estimate": "estimation en points" }
          ]
        }
      ]
    }
    
    Assure-toi que:
    1. Les user stories sont complémentaires et couvrent tous les aspects de la feature
    2. Chaque user story a au moins 2 critères d'acceptation Gherkin
    3. Chaque user story a au moins 3 tâches techniques
    4. Les titres sont descriptifs et uniques
    
    Réponds UNIQUEMENT avec le JSON valide, sans commentaires ni préambule.
  `;
  
  let responseContent;
  let parsedResponse;
  
  try {
    // Appel à l'API selon le fournisseur
    if (provider === 'groq') {
      const completion = await client.chat.completions.create({
        model: determineModel('groq'),
        messages: [
          {
            role: "system",
            content: "Tu es un expert agile qui crée des features et user stories de haute qualité"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });
      responseContent = completion.choices[0].message.content;
    } else {
      // Défaut: OpenAI
      const completion = await client.chat.completions.create({
        model: determineModel('openai'),
        messages: [
          {
            role: "system",
            content: "Tu es un expert agile qui crée des features et user stories de haute qualité"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });
      responseContent = completion.choices[0].message.content;
    }
    
    // Extraction du JSON
    let jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || 
                   responseContent.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } else {
      parsedResponse = JSON.parse(responseContent);
    }
    
    // Validation du JSON selon le schéma
    const isValid = validate(parsedResponse);
    
    if (!isValid) {
      console.error(chalk.red('❌ Le format de la réponse est invalide:'));
      console.error(validate.errors);
      throw new Error('Format de réponse invalide');
    }
    
    console.error(chalk.green(`✅ Feature "${parsedResponse.feature.title}" générée avec ${parsedResponse.userStories.length} user stories`));
    return parsedResponse;
    
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la génération de la feature:'));
    console.error(error);
    
    if (error.message.includes('JSON') || error.message.includes('SyntaxError')) {
      console.error(chalk.yellow('Réponse brute reçue:'));
      console.error(responseContent?.substring(0, 500) + '...');
    }
    
    throw error;
  }
}

/**
 * Sauvegarde le backlog brut généré au format JSON
 * @param {Object} result - Le résultat de la génération
 * @param {string} outputDir - Le répertoire de sortie
 * @returns {Promise<void>}
 */
async function saveRawFeatureResult(result, outputDir) {
  try {
    const backlogJsonPath = path.join(outputDir, 'backlog.json');
    
    // Si le fichier existe déjà, on le lit et on fusionne les données
    let backlogData = {};
    
    if (await fs.pathExists(backlogJsonPath)) {
      const existingContent = await fs.readFile(backlogJsonPath, 'utf8');
      backlogData = JSON.parse(existingContent);
      
      // Si features n'existe pas, on l'initialise
      if (!backlogData.features) {
        backlogData.features = [];
      }
    } else {
      // Initialisation avec structure de base
      backlogData = {
        features: []
      };
    }
    
    // On ajoute la nouvelle feature
    backlogData.features.push({
      ...result.feature,
      userStories: result.userStories
    });
    
    await fs.writeFile(backlogJsonPath, JSON.stringify(backlogData, null, 2));
    console.error(chalk.green('✅ Données brutes sauvegardées dans ' + backlogJsonPath));
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la sauvegarde des données brutes:'));
    console.error(error);
  }
}

module.exports = {
  generateFeature,
  saveRawFeatureResult
};
