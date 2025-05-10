const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { createSlug } = require('./utils');
const { parseJsonResponse } = require('./utils/json-parser');
const { generateFeatureMarkdown } = require('./markdown-generator');

/**
 * Génère une feature avec des user stories en utilisant l'API OpenAI ou GROQ
 * 
 * @param {Object} params - Les paramètres pour la génération de feature
 * @param {string} params.featureDescription - La description de la feature à générer
 * @param {number} params.storyCount - Le nombre de user stories à générer
 * @param {string} params.businessValue - La valeur métier de la feature (optionnel)
 * @param {string} params.epicName - Le nom de l'epic parent (optionnel)
 * @param {Object} client - Le client API (OpenAI ou GROQ)
 * @param {string} provider - Le fournisseur d'API ('openai' ou 'groq')
 * @returns {Promise<Object>} - La feature générée
 */
async function generateFeature(params, client, provider = 'openai') {
  try {
    console.log(chalk.blue(`Génération d'une feature à partir de la description: ${params.featureDescription}`));
    
    const { featureDescription, storyCount = 3, businessValue, epicName = 'Fonctionnalités principales' } = params;
    
    const systemPrompt = `
    Tu es un expert en analyse fonctionnelle et en méthodologie agile. 
    Je te demande de générer une feature complète accompagnée de user stories pour un projet informatique.
    
    RÈGLES IMPORTANTES:
    - Génère exactement ${storyCount} user stories, ni plus ni moins
    - Utilise le format "En tant que... Je veux... Afin de..."
    - Chaque critère d'acceptation doit suivre le format "Critère: Étant donné [contexte], quand [action], alors [résultat]"
    - Chaque tâche technique doit être concrète et implémentable (éviter les généralités)
    - Les estimations doivent être réalistes (1 = très simple, 8 = complexe)
    - AUCUN texte avant ou après l'objet JSON
    
    CONTEXTE:
    - Feature à créer: ${featureDescription}
    - Epic parent: ${epicName}
    ${businessValue ? `- Valeur métier: ${businessValue}` : ''}
    
    FORMAT DE RÉPONSE (JSON uniquement):
    {
      "feature": {
        "title": "Titre de la feature", // Titre concis représentant la fonctionnalité
        "description": "Description détaillée et concrète de la fonctionnalité",
        "businessValue": "Valeur métier et impact pour les utilisateurs"
      },
      "epicName": "${epicName}", // Utiliser exactement cette valeur
      "userStories": [
        {
          "title": "Titre concis et explicite", // 5-10 mots maximum
          "asA": "En tant que [rôle précis]", // Rôle spécifique, pas générique
          "iWant": "Je veux [action spécifique et concrète]", // Action claire et actionnable
          "soThat": "Afin de [bénéfice tangible et mesurable]", // Bénéfice réel pour l'utilisateur
          "acceptanceCriteria": [
            {
              "given": "Étant donné que [contexte précis]", // Contexte initial
              "when": "Quand [action de l'utilisateur]", // Action déclenchante
              "then": "Alors [résultat vérifiable]", // Résultat attendu et vérifiable
              "andThen": "Et [condition supplémentaire optionnelle]" // Optionnel
            },
            {
              "given": "Étant donné que [contexte alternatif]",
              "when": "Quand [autre action]",
              "then": "Alors [autre résultat attendu]"
            }
          ],
          "tasks": [
            {
              "description": "Tâche technique spécifique 1", // Tâche technique implémentable
              "estimate": "2" // Utiliser uniquement les valeurs 1, 2, 3, 5 ou 8
            },
            {
              "description": "Tâche technique spécifique 2", 
              "estimate": "3"
            },
            {
              "description": "Tâche technique spécifique 3",
              "estimate": "1"
            }
          ]
        }
        // Répéter ce modèle pour chaque user story demandée
      ]
    }
    `;
    
    const userPrompt = `
    Génère une feature complète avec ${storyCount} user stories pour: "${featureDescription}"
    ${businessValue ? `La valeur métier principale est: "${businessValue}"` : ''}
    L'epic parent est: "${epicName}"
    
    INSTRUCTIONS SUPPLÉMENTAIRES :
    1. Détaille clairement la feature avec un titre explicite
    2. Crée ${storyCount} user stories complètes et distinctes
    3. Pour chaque user story :
       - Précise le rôle de l'utilisateur (qui)
       - Décris l'action concrète (quoi)
       - Explique le bénéfice tangible (pourquoi)
       - Fournis au moins 2 critères d'acceptation précis
       - Décompose en 2-4 tâches techniques
    4. Estime chaque tâche technique (1=simple, 8=complexe)
    
    Réponds uniquement avec un objet JSON conforme au format demandé, sans texte avant ou après.
    `;
    
    const model = provider === 'groq' ? 'llama3-70b-8192' : 'gpt-4-turbo';
    
    const options = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000
    };
    
    const response = await client.chat.completions.create(options);
    
    const content = response.choices[0].message.content;
    console.log(chalk.blue(`🔍 Tentative de parsing de la réponse API pour la feature...`));
    
    try {
      // Utiliser notre parser JSON robuste plutôt que JSON.parse simple
      const result = parseJsonResponse(content, true);
      console.log(chalk.green(`✅ JSON parsé avec succès`));
      
      // Vérifie la présence des champs obligatoires
      if (!result.feature || !result.feature.title || !result.feature.description || 
          !result.userStories || result.userStories.length !== storyCount) {
        throw new Error("La réponse de l'API ne respecte pas le format attendu");
      }
      
      // Assure que epicName est défini
      if (!result.epicName) {
        result.epicName = epicName;
      }
      
      console.log(chalk.green(`Feature générée avec succès: ${result.feature.title}`));
      console.log(chalk.green(`${storyCount} user stories créées`));
      
      return result;
    } catch (error) {
      console.error(chalk.red('Erreur lors du parsing de la réponse JSON:'), error);
      console.error(chalk.yellow('Réponse reçue:'), content);
      throw new Error(`Erreur de format dans la réponse de l'API: ${error.message}`);
    }
  } catch (error) {
    console.error(chalk.red('Erreur lors de la génération de la feature:'), error);
    throw error;
  }
}

/**
 * Sauvegarde le résultat brut d'une génération de feature dans un fichier JSON
 * et le combine avec un backlog existant s'il existe
 * 
 * @param {Object} result - Le résultat de la génération de feature
 * @param {string} outputDir - Le répertoire de sortie
 * @returns {Promise<string>} - Le chemin du fichier JSON sauvegardé
 */
async function saveRawFeatureResult(result, outputDir) {
  try {
    console.log(chalk.blue('Sauvegarde du résultat de la feature...'));
    
    // Prépare le répertoire de sortie
    await fs.ensureDir(outputDir);
    
    // Chemin du fichier JSON
    const jsonPath = path.join(outputDir, '.agile-planner-backlog', 'backlog.json');
    
    // Crée le dossier .agile-planner-backlog s'il n'existe pas
    await fs.ensureDir(path.dirname(jsonPath));
    
    // Structure initiale du backlog vide
    let backlog = {
      epics: []
    };
    
    // Vérifie si un backlog existe déjà
    if (await fs.pathExists(jsonPath)) {
      const existingContent = await fs.readFile(jsonPath, 'utf8');
      backlog = JSON.parse(existingContent);
    }
    
    // Extraction des données de result
    const { feature, userStories, epicName } = result;
    
    // Vérifie si l'epic existe déjà
    let epic = backlog.epics.find(e => e.name === epicName);
    
    // Si l'epic n'existe pas, le crée
    if (!epic) {
      epic = {
        name: epicName,
        description: `Epic pour ${epicName}`,
        slug: createSlug(epicName),
        features: []
      };
      backlog.epics.push(epic);
    }
    
    // Crée un slug pour la feature
    const featureSlug = createSlug(feature.title);
    
    // Prépare la feature à ajouter
    const featureToAdd = {
      title: feature.title,
      description: feature.description,
      businessValue: feature.businessValue,
      slug: featureSlug,
      userStories: userStories.map((story, index) => {
        // Génère un ID pour chaque user story
        const storyId = `US${Date.now().toString().slice(-4)}${index + 1}`;
        return {
          id: storyId,
          title: story.title,
          description: `${story.asA} ${story.iWant} ${story.soThat}`,
          acceptance_criteria: story.acceptanceCriteria.map(ac => 
            `${ac.given} ${ac.when} ${ac.then}`
          ),
          tasks: story.tasks.map(task => task.description),
          slug: createSlug(story.title),
          status: 'to-do',
          priority: 'medium',
          estimate: story.tasks.reduce((sum, task) => 
            sum + parseInt(task.estimate || '0'), 0)
        };
      })
    };
    
    // Ajoute la feature à l'epic
    // Toujours garantir la cohérence : stories = userStories
    if (!Array.isArray(featureToAdd.userStories)) {
      featureToAdd.userStories = [];
    }
    // Pour compatibilité markdown : ajouter aussi stories
    featureToAdd.stories = featureToAdd.userStories;
    if (featureToAdd.userStories.length === 0) {
      console.warn(chalk.yellow('⚠️ Feature sans user stories : un dossier user-stories vide sera généré.'));
    }
    epic.features.push(featureToAdd);
    
    // Écrit le backlog dans le fichier JSON
    await fs.writeFile(jsonPath, JSON.stringify(backlog, null, 2), 'utf8');
    
    console.log(chalk.green(`Feature sauvegardée dans: ${jsonPath}`));
    return jsonPath;
  } catch (error) {
    console.error(chalk.red('Erreur lors de la sauvegarde du résultat:'), error);
    throw error;
  }
}

/**
 * Processus complet de génération d'une feature:
 * 1. Génère la feature avec l'API
 * 2. Sauvegarde le résultat brut
 * 3. Génère les fichiers Markdown
 * 
 * @param {Object} params - Les paramètres pour la génération
 * @param {string} outputDir - Le répertoire de sortie
 * @param {Object} client - Le client API (OpenAI ou GROQ)
 * @param {string} provider - Le fournisseur d'API ('openai' ou 'groq')
 * @returns {Promise<Object>} - Le résultat de l'opération
 */
async function generateFeatureAndMarkdown(params, outputDir, client, provider = 'openai') {
  try {
    console.log(chalk.blue('Début du processus de génération de feature...'));
    
    // 1. Génère la feature
    const featureResult = await generateFeature(params, client, provider);
    
    // 2. Sauvegarde le résultat brut
    const jsonPath = await saveRawFeatureResult(featureResult, outputDir);
    
    // 3. Génère les fichiers Markdown
    await generateFeatureMarkdown(featureResult, outputDir);
    
    console.log(chalk.green('Processus de génération de feature terminé avec succès!'));
    
    return {
      success: true,
      result: {
        feature: featureResult.feature,
        userStories: featureResult.userStories,
        epicName: featureResult.epicName,
        files: {
          json: jsonPath
        }
      }
    };
  } catch (error) {
    console.error(chalk.red('Erreur lors du processus de génération:'), error);
    
    return {
      success: false,
      error: {
        message: error.message,
        stack: error.stack
      }
    };
  }
}

module.exports = {
  generateFeature,
  saveRawFeatureResult,
  generateFeatureAndMarkdown
};
