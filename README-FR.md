# Agile Planner MCP Server (v1.1.5) - Générateur de Backlog Agile propulsé par l'IA
[![smithery badge](https://smithery.ai/badge/@cyberlife-coder/agile-planner-mcp-server)](https://smithery.ai/server/@cyberlife-coder/agile-planner-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/cyberlife-coder/agile-planner-mcp-server/blob/main/LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io) 
[![Windsurf Ready](https://img.shields.io/badge/Windsurf-Ready-brightgreen)](https://docs.windsurf.com/windsurf/mcp) 
[![Cascade Integrated](https://img.shields.io/badge/Cascade-Integrated-purple)](https://cascade.ai)
[![npm version](https://img.shields.io/npm/v/agile-planner-mcp-server.svg?style=flat-square)](https://www.npmjs.com/package/agile-planner-mcp-server)
[![GitHub Stars](https://img.shields.io/github/stars/cyberlife-coder/agile-planner-mcp-server?style=social)](https://github.com/cyberlife-coder/agile-planner-mcp-server)

**Agile Planner MCP** vous permet de générer automatiquement un backlog agile complet (Epics, User Stories, MVP, itérations) ou des features spécifiques à partir d'une simple description, directement dans Windsurf, Cascade ou Cursor, sans aucune compétence technique requise.

> **Dernières améliorations (v1.1.5) :** Correction des problèmes d'ordre des paramètres dans la fonction de génération de backlog, mise à jour de la gestion des erreurs pour la compatibilité MCP, amélioration de la gestion des répertoires pour les fichiers de sortie et renforcement de la fiabilité des tests. Compatible avec la spécification MCP 2025-03 pour Windsurf.

---

## Fonctionnalités

- Générer un backlog agile complet à partir d'une description de projet
- Produire des epics, user stories et tasks
- Structurer les fichiers markdown pour la gestion de projet
- Critères d'acceptation au format Gherkin
- **Nouveau** : Générer des features spécifiques avec leurs user stories

---

## Utilisation

### Génération de backlog complet

```bash
npx agile-planner-mcp-server backlog "Mon super projet" "Description détaillée du projet..."
```

### Génération de feature spécifique

```bash
npx agile-planner-mcp-server feature "Description détaillée de la feature à implémenter" --story-count=4 --business-value="Valeur métier importante"
```

### Options disponibles

| Option | Description |
|--------|-------------|
| `backlog` | Génère un backlog complet avec epics, user stories et tasks |
| `feature` | Génère une feature avec ses user stories et tasks associées |
| `--story-count` | Nombre de user stories à générer (minimum 3, par défaut: 3) |
| `--business-value` | Valeur métier de la feature |
| `--iteration-name` | Nom de l'itération (par défaut: "next") |
| `--output-path` | Chemin de sortie personnalisé |

### Mode interactif (CLI)

Vous pouvez également lancer l'outil en mode interactif :

```bash
npx agile-planner-mcp-server
```

Un menu vous permettra de choisir entre la génération d'un backlog complet ou d'une feature spécifique, avec possibilité de personnaliser tous les paramètres.

---

## Configuration MCP pour Windsurf/Cascade/Cursor

Pour utiliser AgilePlanner comme serveur MCP dans Windsurf, ajoutez cette configuration :

```json
{
  "mcpServers": [
    {
      "name": "AgilePlanner",
      "command": "npx",
      "args": ["-y", "agile-planner-mcp-server"],
      "description": "Générateur de backlog agile avec IA"
    }
  ]
}
```

### Outils MCP disponibles

| Outil | Description |
|-------|-------------|
| `generateBacklog` | Génère un backlog complet à partir de la description d'un projet |
| `generateFeature` | Génère une feature spécifique avec ses user stories |

#### Schema d'entrée pour `generateFeature`

```json
{
  "featureDescription": "Description détaillée de la feature à implémenter",
  "storyCount": 5,
  "businessValue": "Valeur métier de la feature",
  "iterationName": "next",
  "outputPath": "/chemin/optionnel"
}
```

---

## 🎯 À quoi sert cet outil ?

- Obtenez en quelques secondes un backlog agile structuré, prêt à l'emploi, pour tout type de projet (web, mobile, SaaS, MVP, etc.).
- Exportez automatiquement vos Epics, User Stories et itérations au format Markdown, avec des annotations spécifiques pour l'IA.
- Gagnez du temps et structurez vos projets avec l'intelligence artificielle (OpenAI ou Groq).
- La génération comprend des instructions précises pour guider l'IA dans l'implémentation de votre projet.

---

## 🚀 Installation depuis npm

Pour installer le package depuis npmjs.com, exécutez :

```bash
npm install -g agile-planner-mcp-server
```

Une fois installé, vous pouvez l'utiliser de deux façons :

### 1. En ligne de commande

```bash
# Configuration
export OPENAI_API_KEY="votre-clé-api"  # Ou utilisez un fichier .env

# Génération d'un backlog
agile-planner-mcp --project "Description de votre projet" --output ./mon-projet
```

### 2. En tant que bibliothèque dans votre code

```javascript
const { generateBacklog } = require('agile-planner-mcp-server');

// Exemple d'utilisation
async function monProjet() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await generateBacklog("Description du projet", client);
  
  if (result.success) {
    console.log("Backlog généré avec succès :", result.result);
  }
}
```

---

## 🛡️ Architecture technique & Robustesse

### Flux de validation IA et génération de backlog

- **Validation stricte IA** : Toute réponse générée par l'IA (OpenAI ou Groq) est validée localement via un schéma JSON exhaustif (Ajv). Si la réponse n'est pas conforme, elle est repromptée automatiquement jusqu'à 3 fois.
- **Aucune génération de fichier** n'a lieu tant que la réponse IA n'est pas strictement conforme au schéma attendu.
- **Feedback JSON-RPC/MCP** : Toute erreur de validation ou d'exécution est renvoyée dans le champ `error` de la réponse MCP, donc visible dans Windsurf/Cascade/Cursor.
- **Logs** : Toutes les étapes clefs (appel IA, validation, génération, erreurs) sont loggées sur stderr pour auditabilité.

### Structure des fichiers générés

Les fichiers sont générés dans un sous-dossier `.agile-planner-backlog` avec la structure suivante :
```
.agile-planner-backlog/
├── README.md               # Vue d'ensemble et navigation
├── epics/
│   └── epic.md             # Description de l'épopée principale
├── mvp/
│   └── user-stories.md     # User stories du MVP avec cases à cocher
└── iterations/
    └── <NomItération>/
        └── user-stories.md # User stories par itération avec cases à cocher
```

### Annotations pour l'IA

Chaque fichier markdown généré contient :
- **Instructions générales** pour guider l'IA dans l'utilisation des documents
- **Instructions spécifiques** selon le type de fichier (Epic, MVP, Itération)
- **Critères d'acceptation et tâches** formatés avec des cases à cocher pour le suivi
- **Indications de priorité et dépendances** pour faciliter l'implémentation

### Extension et évolutivité
- Le serveur MCP est conçu pour accueillir d'autres outils (tools MCP) facilement, via un handler centralisé.
- Toute nouvelle fonctionnalité peut bénéficier du même pipeline de validation et de feedback.

### Sécurité et conformité MCP
- Le flux garantit la conformité à la spec Model Context Protocol ([modelcontextprotocol.io](https://modelcontextprotocol.io)).
- Les logs techniques ne polluent jamais stdout (seulement du JSON MCP).
- Les erreurs sont toujours visibles dans l'interface utilisateur.

---

## ✅ Bonnes pratiques
- Plus la description du projet est détaillée, plus le backlog généré sera pertinent.
- Chaque appel à `generateBacklog` crée un nouveau backlog dans `.agile-planner-backlog`.
- Pour utiliser le backlog, chargez les fichiers markdown dans Cascade ou Cursor et suivez les instructions intégrées.
- Demandez à l'IA d'implémenter les user stories dans l'ordre de priorité spécifié.
- Utilisez les cases à cocher pour suivre l'avancement de l'implémentation.
- Ne partagez jamais vos clés API publiquement.

---

## ❓ Questions fréquentes
- **Peut-on générer plusieurs backlogs à la suite ?** Oui, chaque appel à `generateBacklog` est indépendant.
- **Les fichiers générés écrasent-ils les anciens ?** Oui, si vous utilisez le même dossier de sortie. Changez `AGILE_PLANNER_OUTPUT_ROOT` pour générer dans un autre emplacement.
- **Groq ou OpenAI ?** Les deux sont supportés, selon la clé renseignée dans `.env` ou dans la configuration MCP.
- **Je ne vois pas l'outil dans Windsurf ?** Vérifiez que la variable `MCP_EXECUTION` est bien définie à `"true"` dans la configuration.
- **Comment utiliser le backlog généré ?** Chargez les fichiers markdown dans Cascade ou Cursor et demandez à l'IA de suivre les instructions incluses dans les fichiers.

---

## 🔒 Sécurité
- Vos descriptions de projet et backlogs générés restent dans votre espace de travail.
- Les clés API sont gérées par votre administrateur et ne doivent jamais être partagées.

---

## 🚀 Changelog

### v1.1.5 (Version actuelle)
- Correction de l'ordre des paramètres dans la fonction de génération de backlog
- Amélioration de la gestion des erreurs en mode MCP
- Renforcement de la fiabilité des tests et correction des tests Jest
- Ajout de la licence avec clause Commons

### v1.1.4
- Correction de la génération de features en mode MCP
- Amélioration de la gestion des paramètres pour la génération de backlog
- Renforcement des rapports d'erreur avec diagnostics détaillés
- Ajout de la création automatique de répertoires pour les fichiers de sortie

### v1.1.3
- Mise à jour de la compatibilité avec la spécification MCP 2025-03
- Ajout du support pour l'intégration Windsurf et Cascade
- Amélioration du formatage markdown pour la consommation par IA
- Amélioration de la génération de features avec de meilleurs critères d'acceptation

### v1.1.0
- Ajout des capacités de génération de features
- Implémentation de la génération de user stories avec critères d'acceptation
- Ajout du support pour les chemins de sortie personnalisés
- Amélioration de la documentation avec des exemples

### v1.0.0
- Version initiale avec génération de backlog agile
- Fonctionnalité d'export markdown de base
- Support des API OpenAI et Groq
- Interface en ligne de commande

---

## 📄 Licence

Agile Planner MCP Server est sous licence MIT avec Commons Clause. Cela signifie que vous pouvez :

### ✅ Autorisé :
- Utiliser Agile Planner à toutes fins (personnelles, commerciales, académiques)
- Modifier le code
- Distribuer des copies
- Créer et vendre des produits construits avec Agile Planner

### ❌ Non autorisé :
- Vendre Agile Planner lui-même
- Proposer Agile Planner comme service hébergé
- Créer des produits concurrents basés sur Agile Planner

Consultez le fichier [LICENSE](https://github.com/cyberlife-coder/agile-planner-mcp-server/blob/main/LICENSE) pour le texte complet de la licence.

---

## ☕ Support

Si ce projet vous aide, vous pouvez soutenir son développement en m'offrant un café sur [BuyMeACoffee](https://buymeacoffee.com/wiscale) !

Merci 🙏

---

## Documentation

### Commandes

Agile Planner MCP prend en charge les commandes suivantes :

#### Générer un Backlog Complet
```javascript
// Dans Windsurf ou Cascade
mcp0_generateBacklog({
  projectName: "Mon Projet",
  projectDescription: "Une description détaillée du projet...",
  outputPath: "chemin/personnalisé/optionnel"
})

// CLI
npx agile-planner-mcp-server backlog "Mon Projet" "Une description détaillée du projet..."
```

#### Générer une Feature Spécifique
```javascript
// Dans Windsurf ou Cascade
mcp0_generateFeature({
  featureDescription: "Une description détaillée de la feature à générer",
  storyCount: 3,  // Optionnel : nombre de user stories à générer (min: 3)
  businessValue: "Élevée", // Optionnel : valeur métier de cette feature
  iterationName: "iteration-2", // Optionnel : itération cible (défaut: 'next')
  outputPath: "chemin/personnalisé/optionnel" // Optionnel : répertoire de sortie personnalisé
})

// CLI
npx agile-planner-mcp-server feature "Une description détaillée de la feature à générer"
```

### Structure des Fichiers Générés

Agile Planner génère une structure de projet organisée avec :

- `./features/` - Descriptions des features avec valeur métier et liens vers les user stories
- `./epics/` - Définitions des epics avec orientation stratégique
- `./user-stories/` - User stories avec critères d'acceptation et tâches techniques
- `./mvp/` - Stories prioritaires pour le produit minimum viable
- `./iterations/` - Planification des cycles de développement

Tous les fichiers incluent des instructions adaptées à l'IA pour guider l'implémentation. Consultez le dossier [examples](./examples) pour des exemples de sorties.

### Utilisation Avancée

Pour des résultats optimaux lors de l'utilisation d'Agile Planner avec Windsurf ou Cascade, consultez notre [Guide d'Utilisation Optimale](./OPTIMAL_USAGE_GUIDE.MD) détaillé. Ce guide fournit les meilleures pratiques pour :

- Combiner Agile Planner avec d'autres outils MCP comme Sequential Thinking
- Récupérer du contexte avant de générer des backlogs
- Intégrer la documentation existante du projet
- Suivre la progression de l'implémentation
