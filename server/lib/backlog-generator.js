const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Initialise le client OpenAI ou GROQ selon la clé API disponible
 * @param {string} openaiKey - Clé API OpenAI
 * @param {string} groqKey - Clé API GROQ
 * @returns {OpenAI} Instance client initialisée
 */
function initializeClient(openaiKey, groqKey) {
  if (openaiKey) {
    return new OpenAI({ apiKey: openaiKey });
  } else if (groqKey) {
    return new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
  } else {
    throw new Error('Aucune clé API fournie pour OpenAI ou GROQ');
  }
}

/**
 * Génère un backlog à partir de la description du projet
 * @param {string} project - Description du projet
 * @param {Object} client - Client OpenAI/GROQ initialisé
 * @returns {Promise<Object>} Backlog généré au format JSON
 */
async function generateBacklog(project, client) {
  // Construction du prompt optimisé pour GPT-4o
  const messages = [
    {
      role: "system",
      content: `# RÔLE
Tu es un Expert Agile Senior spécialisé dans la création de backlogs de produits, avec 15+ ans d'expérience dans la direction de projets digitaux innovants. Tu excelles dans la décomposition stratégique des initiatives en éléments actionnables selon les meilleures pratiques agiles.

# TÂCHE
Décompose le projet fourni en un backlog agile complet, structuré et prêt à être implémenté.

# FORMAT DE RÉPONSE
Réponds UNIQUEMENT avec un objet JSON valide suivant exactement cette structure (sans explications, commentaires ou texte additionnel) :

\`\`\`json
{
  "epic": {
    "title": "Titre concis et impactant de l'Epic",
    "description": "Description détaillée expliquant la vision globale, l'impact business et les objectifs mesurables"
  },
  "mvp": [
    {
      "id": "US001",
      "title": "Titre de User Story précis et orienté valeur",
      "description": "En tant que [persona précis], je veux [fonctionnalité décrite avec précision], afin de [bénéfice métier mesurable]",
      "acceptance_criteria": [
        "ÉTANT DONNÉ [contexte initial précis], QUAND [action spécifique], ALORS [résultat attendu vérifiable]",
        "ÉTANT DONNÉ [autre contexte], QUAND [action], ALORS [résultat]"
      ],
      "tasks": [
        "Tâche technique 1 avec verbe d'action + résultat attendu + critères de qualité",
        "Tâche technique 2 (estimable entre 2-8h de travail)"
      ],
      "priority": "HAUTE | MOYENNE | BASSE"
    }
  ],
  "iterations": [
    {
      "name": "Iteration 1 - [Focus thématique]",
      "goal": "Objectif mesurable de cette itération",
      "stories": [
        {
          "id": "US005",
          "title": "Titre de User Story",
          "description": "En tant que [persona], je veux [fonctionnalité], afin de [bénéfice]",
          "acceptance_criteria": [
            "ÉTANT DONNÉ [contexte], QUAND [action], ALORS [résultat]"
          ],
          "tasks": [
            "Tâche technique 1",
            "Tâche technique 2"
          ],
          "priority": "HAUTE | MOYENNE | BASSE",
          "dependencies": ["US001"] 
        }
      ]
    }
  ]
}
\`\`\`

# CRITÈRES DE QUALITÉ
1. <INVEST>: Chaque User Story doit être Indépendante, Négociable, Valorisable, Estimable, Suffisamment petite et Testable
2. <PERSONAS>: Utilise des personas spécifiques et cohérents (pas "utilisateur" générique)
3. <CRITÈRES>: Critères d'acceptation exhaustifs, testables et automatisables
4. <TÂCHES>: Tâches techniques précises, estimables et singlefocus
5. <PRIORISATION>: MVP contient uniquement les fonctionnalités essentielles
6. <COHÉRENCE>: Vocabulaire métier cohérent dans tout le backlog
7. <AMBITION>: Propose des solutions innovantes mais réalistes
8. <DÉPENDANCES>: Identifie clairement les dépendances entre stories`
    },
    {
      role: "user",
      content: `# DESCRIPTION DU PROJET
${project}

# LIVRABLES ATTENDUS
- Un backlog complet et ambitieux avec:
  * Une Epic clair et stratégique
  * Un MVP défini avec 3-5 User Stories essentielles
  * 2-3 Itérations futures avec leurs User Stories
  * Des critères d'acceptation Gherkin précis
  * Des tâches techniques détaillées

Produis un JSON valide que je pourrai utiliser directement.`
    }
  ];

  try {
    // Déterminer le modèle à utiliser en fonction du client
    const isOpenAI = client.baseURL === undefined || client.baseURL.includes('openai.com');
    const model = isOpenAI ? "gpt-4o" : "llama3-70b-8192";

    // Appel à l'API OpenAI/GROQ avec paramètres optimisés
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" },
      max_tokens: 4000
    });

    // Récupération de la réponse
    const content = completion.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error(chalk.red('Erreur lors de la génération du backlog:'), error);
    throw error;
  }
}

module.exports = {
  initializeClient,
  generateBacklog
};
