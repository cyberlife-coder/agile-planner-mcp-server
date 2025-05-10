/**
 * Utilités partagées pour la génération de markdown
 * @module markdown/utils
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

// Instructions markdown partagées
const markdownInstructions = {
  epicFileInstructions: `## 🚨 Instructions d'utilisation

Ce document généré par Agile Planner décrit un Epic, une initiative majeure qui regroupe plusieurs features liées.

### 📚 Guide d'utilisation

- **Consultation**: Utilisez ce document comme référence pour comprendre la vision et les objectifs de cet Epic
- **Planification**: Consultez la liste des features pour établir votre roadmap et vos priorités
- **Navigation**: Suivez les liens pour explorer les features et user stories associées
- **Mise à jour**: Actualisez uniquement via le MCP Server pour maintenir la cohérence du backlog

### 💪 Bonnes pratiques

- Ajoutez des diagrammes Mermaid pour visualiser les dépendances entre features
- Discutez de cet Epic en réunion de planification pour garantir l'alignement de l'équipe
- Liez cet Epic à des objectifs stratégiques ou KPIs dans votre documentation
`,

  featureFileInstructions: `## 🚨 Instructions d'utilisation

Ce document généré par Agile Planner décrit une Feature, une fonctionnalité complète qui apporte de la valeur aux utilisateurs.

### 📚 Guide d'utilisation

- **Compréhension**: Identifiez clairement la valeur métier et les bénéfices utilisateurs
- **Développement**: Utilisez la décomposition en user stories pour planifier le développement
- **Tests**: Consultez la valeur métier pour élaborer une stratégie de test pertinente
- **Acceptation**: Utilisez les user stories comme base pour les démonstrations utilisateurs

### 🔄 Conseil pour l'implémentation

Pour une meilleure efficacité, implementez les user stories dans l'ordre suivant :
1. User stories fondamentales (infrastructure, modèle de données)
2. User stories avec le plus de valeur métier pour les utilisateurs
3. User stories avec des contraintes techniques importantes

Consultez la documentation Mermaid sur mermaid-js.github.io pour ajouter des diagrammes de séquence illustrant les interactions.`,

  userStoryFileInstructions: `## 🚨 Instructions d'utilisation

Ce document généré par Agile Planner décrit une User Story, une fonctionnalité du point de vue utilisateur.

### 📚 Guide de développement (RULE 1 - TDD)

- **Acceptation**: Utilisez les critères d'acceptation comme base pour les tests automatiques
- **Tâches**: Suivez les tâches techniques pour implémenter méthodiquement la story
- **Tests**: Créez d'abord les tests unitaires (TDD) avant l'implémentation
- **Validation**: Utilisez la structure "Etant donné/Quand/Alors" pour vérifier la complétude

### 💼 Checklist de revue

- [ ] Tous les critères d'acceptation sont couverts par des tests
- [ ] Le code est conforme aux standards du projet (max 500 lignes/fichier, 50 lignes/fonction)
- [ ] La documentation a été mise à jour
- [ ] Les performances et la sécurité ont été considérées

### 🔹 Statuts possibles

- 🟡 **À FAIRE**: Story en attente de développement
- 🟠 **EN COURS**: Développement actif en cours
- 🟢 **TERMINÉE**: Développement terminé, prêt pour revue
- 🔵 **EN REVUE**: En cours de revue par les pairs
- ✅ **VALIDÉE**: Revue complétée et story validée`,

  iterationFileInstructions: `## 🚨 Instructions d'utilisation

Ce document généré par Agile Planner décrit une Itération (Sprint), une période de travail avec un ensemble de user stories.

### 📚 Guide pour le Sprint

- **Planification**: Utilisez ce document lors de la réunion de planification de sprint
- **Daily Stand-up**: Référencez les user stories pendant vos réunions quotidiennes
- **Priorisation**: Les stories sont déjà triées par ordre de priorité (de haut en bas)
- **Review**: Utilisez cette liste pour structurer votre démo de fin de sprint

### 📈 Suivi de la vélocité

Nombre total de points: [Additionner les estimations des user stories]
Capacité estimée de l'équipe: [Spécifier la capacité en points]
Ratio d'engagement: [Calculer le ratio entre points et capacité]

### 🔥 Conseils pour la réussite

- Commencez par les stories qui ont le plus de dépendances
- Identifiez tôt les obstacles potentiels pour chaque story
- Prévoyez du temps pour la revue de code et la correction des bugs`,

  mvpFileInstructions: `## 🚨 Instructions d'utilisation

Ce document généré par Agile Planner définit le Minimum Viable Product (MVP), l'ensemble minimal de fonctionnalités pour une première version.

### 📚 Guide pour le MVP

- **Focus**: Concentrez les efforts de l'équipe uniquement sur ces stories essentielles
- **Scope**: Résistez à l'ajout de nouvelles stories avant la complétion du MVP
- **Tests**: Assurez-vous que ces stories sont testées plus rigoureusement
- **Feedback**: Collectez les retours utilisateurs dès la livraison du MVP

### 📆 Timeline et jalons

Semaine 1: Démarrage et setup
Semaine 2-3: Développement des fonctionnalités core
Semaine 4: Tests utilisateurs et affinage
Semaine 5: Finalisation et déploiement

### 📍 Métriques de succès

1. Tous les critères d'acceptation des user stories du MVP sont validés
2. L'application fonctionne sur tous les environnements cibles
3. Aucun bug critique n'est présent
4. Les premiers utilisateurs peuvent accomplir les parcours principaux`
};

/**
 * Crée un slug à partir d'un titre pour une utilisation dans les chemins de fichiers
 * @param {string} title - Titre à convertir en slug
 * @returns {string} - Slug généré
 */
function createSlug(title) {
  // Protection contre les valeurs null ou undefined
  if (!title) {
    console.warn(chalk.yellow("⚠️ Tentative de création d'un slug avec une valeur undefined ou null. Utilisation d'un slug par défaut."));
    return 'untitled-item';
  }
  
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, '-')     // Remplace les espaces par des tirets
    .replace(/-+/g, '-');     // Supprime les tirets multiples
}

/**
 * Lance un message d'erreur formaté et renvoie l'erreur
 * @param {string} message - Message d'erreur
 * @param {Error} error - Objet erreur original (optionnel)
 * @returns {Error} - Erreur formatée
 */
function handleMarkdownError(message, error = null) {
  const errorMessage = error ? `${message}: ${error.message}` : message;
  console.error(chalk.red(`❌ ${errorMessage}`));
  return new Error(errorMessage);
}

module.exports = {
  createSlug,
  handleMarkdownError,
  markdownInstructions
};
