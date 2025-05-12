/**
 * @fileoverview Module de gestion des epics et de leur association avec les features
 * Permet de trouver intelligemment si une feature doit être associée à une epic existante
 * ou si une nouvelle epic doit être créée
 * 
 * @module epic-manager
 * @requires fs-extra
 * @requires path
 * @requires chalk
 * @requires api-client
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const apiClient = require('./api-client');
const { sanitizeFileName } = require('./utils/file-utils');

/**
 * Recherche les epics existantes et analyse leur contenu pour déterminer 
 * la plus pertinente pour une feature
 * 
 * @async
 * @param {string} outputPath - Chemin de sortie où se trouve la structure
 * @param {string} featureDescription - Description de la feature à associer
 * @returns {Promise<Object|null>} L'epic la plus pertinente ou null si aucune n'est suffisamment cohérente
 */
async function findRelevantExistingEpic(outputPath, featureDescription) {
  console.error(chalk.blue(`🔍 Recherche d'epics existantes pour la feature dans: ${outputPath}`));
  
  const backlogDir = path.join(outputPath, '.agile-planner-backlog');
  const epicsDir = path.join(backlogDir, 'epics');
  
  // Vérifier si le répertoire epics existe
  if (!fs.existsSync(epicsDir)) {
    console.error(chalk.yellow(`⚠️ Aucun répertoire epics trouvé dans ${backlogDir}`));
    return null; // Pas d'epics existantes
  }
  
  // Lire toutes les epics
  try {
    const epicDirs = fs.readdirSync(epicsDir).filter(dir => 
      fs.statSync(path.join(epicsDir, dir)).isDirectory()
    );
    
    if (epicDirs.length === 0) {
      console.error(chalk.yellow('⚠️ Aucune epic trouvée dans le répertoire'));
      return null; // Pas d'epics existantes
    }
    
    console.error(chalk.green(`✅ ${epicDirs.length} epics trouvées, analyse en cours...`));
    
    // Analyser chaque epic
    const epics = [];
    for (const epicDir of epicDirs) {
      const epicPath = path.join(epicsDir, epicDir);
      const epicFile = path.join(epicPath, 'epic.md');
      
      if (fs.existsSync(epicFile)) {
        const content = fs.readFileSync(epicFile, 'utf8');
        
        // Extraire le titre et la description
        const titleMatch = content.match(/# Epic: (.*)/);
        const descriptionMatch = content.match(/## Description\s+([\s\S]*?)(?=##|$)/);
        
        if (titleMatch && descriptionMatch) {
          epics.push({
            id: epicDir,
            title: titleMatch[1].trim(),
            description: descriptionMatch[1].trim(),
            dirPath: epicPath
          });
        }
      }
    }
    
    if (epics.length === 0) {
      console.error(chalk.yellow('⚠️ Aucune epic avec contenu analysable trouvée'));
      return null; // Pas d'epics analysables
    }
    
    // Demander à l'IA d'évaluer la cohérence
    return await evaluateFeatureEpicCoherence(epics, featureDescription);
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la recherche d'epics: ${error.message}`));
    return null;
  }
}

/**
 * Utilise l'IA pour évaluer la cohérence entre une feature et les epics existantes
 * 
 * @async
 * @param {Array} epics - Liste des epics existantes
 * @param {string} featureDescription - Description de la feature
 * @returns {Promise<Object|null>} L'epic la plus pertinente ou paramètres pour une nouvelle epic
 */
async function evaluateFeatureEpicCoherence(epics, featureDescription) {
  console.error(chalk.blue(`🧠 Évaluation de la cohérence entre la feature et ${epics.length} epics existantes`));
  
  // Préparer la requête pour l'IA
  const prompt = `
  Je dois déterminer si une nouvelle feature doit être associée à une epic existante ou nécessite une nouvelle epic.
  
  Voici la description de la feature:
  ${featureDescription}
  
  Voici les epics existantes:
  ${epics.map((epic, index) => `Epic ${index + 1}:\nID: ${epic.id}\nTitre: ${epic.title}\nDescription: ${epic.description}`).join('\n\n')}
  
  Évalue la cohérence thématique entre cette feature et chaque epic.
  Si la feature est clairement liée à une epic existante, retourne l'ID de cette epic.
  Si la feature nécessite une nouvelle epic, suggère un titre et une description pour cette nouvelle epic.
  
  Réponds au format JSON, et uniquement au format JSON:
  {
    "useExistingEpic": true/false,
    "existingEpicId": "id-de-l-epic-existante" (si useExistingEpic est true),
    "newEpicTitle": "Titre de la nouvelle epic" (si useExistingEpic est false),
    "newEpicDescription": "Description de la nouvelle epic" (si useExistingEpic est false),
    "confidence": 0.0-1.0 (niveau de confiance de la décision)
  }
  `;
  
  try {
    // Obtenir la réponse de l'IA
    const client = apiClient.getClient();
    const response = await client.complete({
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.2, // Température basse pour des réponses plus cohérentes
      response_format: { type: "json_object" } // Forcer le format JSON
    });
    
    let result;
    try {
      // Analyser la réponse JSON
      const responseText = response.text || response.completion || response;
      result = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
    } catch (parseError) {
      console.error(chalk.red(`❌ Erreur de parsing JSON: ${parseError.message}`));
      console.error(chalk.yellow(`Réponse brute: ${response.text || response.completion || JSON.stringify(response)}`));
      
      // Fallback: créer une nouvelle epic avec des valeurs par défaut
      return {
        isNew: true,
        title: `Nouvelle Epic pour ${featureDescription.substring(0, 30)}...`,
        description: `Epic créée automatiquement pour la feature: ${featureDescription.substring(0, 100)}...`
      };
    }
    
    // Si l'IA suggère d'utiliser une epic existante avec suffisamment de confiance
    if (result.useExistingEpic && result.confidence > 0.65) {
      // Trouver l'epic correspondante
      const matchingEpic = epics.find(epic => epic.id === result.existingEpicId);
      if (matchingEpic) {
        console.error(chalk.green(`✅ Feature associée à l'epic existante "${matchingEpic.title}" avec une confiance de ${result.confidence.toFixed(2)}`));
        return {
          ...matchingEpic,
          isNew: false
        };
      }
    }
    
    // Sinon, suggérer une nouvelle epic
    console.error(chalk.blue(`📌 Création d'une nouvelle epic recommandée: "${result.newEpicTitle || 'Nouvelle Epic'}"`));
    return {
      isNew: true,
      title: result.newEpicTitle || `Epic pour ${featureDescription.substring(0, 30)}...`,
      description: result.newEpicDescription || `Epic créée pour la feature: ${featureDescription}`
    };
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de l'évaluation de la cohérence: ${error.message}`));
    // En cas d'erreur, créer une nouvelle epic par défaut
    return {
      isNew: true,
      title: `Nouvelle Epic (${new Date().toISOString().split('T')[0]})`,
      description: `Epic créée automatiquement pour la feature: ${featureDescription.substring(0, 100)}...`
    };
  }
}

/**
 * Crée une nouvelle epic si nécessaire
 * 
 * @async
 * @param {Object} epicInfo - Informations sur l'epic à créer
 * @param {string} outputPath - Chemin de sortie
 * @returns {Promise<Object>} Informations sur l'epic créée ou existante
 */
async function createNewEpicIfNeeded(epicInfo, outputPath) {
  // Si l'epic existe déjà, la retourner simplement
  if (!epicInfo.isNew) {
    return {
      id: epicInfo.id,
      title: epicInfo.title,
      description: epicInfo.description
    };
  }
  
  console.error(chalk.blue(`📝 Création d'une nouvelle epic: "${epicInfo.title}"`));
  
  // Générer un ID pour la nouvelle epic
  const epicId = sanitizeFileName(epicInfo.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'));
  const backlogDir = path.join(outputPath, '.agile-planner-backlog');
  const epicDir = path.join(backlogDir, 'epics', epicId);
  const epicFile = path.join(epicDir, 'epic.md');
  
  try {
    // Créer les répertoires nécessaires
    await fs.ensureDir(epicDir);
    await fs.ensureDir(path.join(epicDir, 'features'));
    
    // Générer le contenu markdown de l'epic
    const epicMarkdown = `# Epic: ${epicInfo.title}

## Description
${epicInfo.description}

## Objectifs
- Implémenter les fonctionnalités liées à cette epic

## Critères d'acceptation
- [ ] Toutes les features sont implémentées
- [ ] Tous les tests sont passants

## Features associées
<!-- Ne pas modifier manuellement cette section, elle sera mise à jour automatiquement -->

## Métadonnées
- **ID**: \`${epicId}\`
- **Priorité**: Moyenne
- **Statut**: À faire
- **Date de création**: ${new Date().toISOString().split('T')[0]}
- **Dernière mise à jour**: ${new Date().toISOString().split('T')[0]}
`;
    
    // Écrire le fichier markdown
    await fs.writeFile(epicFile, epicMarkdown);
    
    console.error(chalk.green(`✅ Epic créée avec succès: ${epicFile}`));
    
    return {
      id: epicId,
      title: epicInfo.title,
      description: epicInfo.description
    };
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la création de l'epic: ${error.message}`));
    throw error;
  }
}

module.exports = {
  findRelevantExistingEpic,
  evaluateFeatureEpicCoherence,
  createNewEpicIfNeeded
};
