# Guide d'intégration MCP (Model Context Protocol)

**Date de dernière modification:** 12/05/2025  
**Version:** 1.7.2

## Introduction

Ce guide détaille comment intégrer Agile Planner en tant que serveur MCP (Model Context Protocol) avec différents clients LLM comme Claude.ai, Cursor et Windsurf IDE. Le protocole MCP permet aux grands modèles de langage (LLM) d'interagir avec des outils externes pour étendre leurs capacités.

## Prérequis

- Node.js v18 ou supérieur
- Une clé API OpenAI ou Groq (définie dans `.env`)
- Un client compatible MCP (Claude.ai, Cursor, Windsurf IDE)

## Installation rapide

```bash
# Installation globale
npm install -g agile-planner

# Installation locale
npm install agile-planner
```

## Configuration

### 1. Configuration de l'environnement

Créez un fichier `.env` à la racine de votre projet:

```env
# Clé API (OpenAI ou Groq)
OPENAI_API_KEY=sk-votre-clé-api-openai
# OU
GROQ_API_KEY=gsk-votre-clé-api-groq

# Mode de journalisation (debug, info, warn, error)
LOG_LEVEL=info

# Chemin de sortie par défaut pour les backlogs
DEFAULT_OUTPUT_PATH=./.agile-planner-backlog
```

### 2. Options de configuration avancées

Le fichier `config.json` à la racine du projet permet des configurations plus avancées:

```json
{
  "defaultProvider": "openai",
  "openaiModel": "gpt-4-turbo",
  "groqModel": "llama3-70b-8192",
  "temperature": 0.7,
  "maxTokens": 4096,
  "batchSize": 3,
  "timeout": 60000
}
```

## Utilisation en tant que serveur MCP

### Intégration MCP via stdio

Le mode stdio est le mode principal pour l'intégration MCP, permettant à un client LLM de communiquer avec Agile Planner via l'entrée/sortie standard.

```bash
# Lancer en mode MCP stdio
agile-planner --mcp

# Ou si installé localement
npx agile-planner --mcp
```

### Communication JSON-RPC 2.0

La communication entre le client LLM et Agile Planner suit le protocole JSON-RPC 2.0:

#### 1. Initialisation

```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "version": "0.1"
  },
  "id": 1
}
```

#### 2. Réponse d'initialisation

```json
{
  "jsonrpc": "2.0",
  "result": {
    "name": "agile-planner",
    "version": "1.7.2",
    "vendor": "Agile Planner Team",
    "capabilities": {
      "tools": {
        "definitions": [
          {
            "name": "generateBacklog",
            "description": "Génère un backlog Agile complet avec epics, features et user stories",
            "parameters": {
              "type": "object",
              "properties": {
                "projectName": {
                  "type": "string",
                  "description": "Nom du projet"
                },
                "projectDescription": {
                  "type": "string",
                  "description": "Description détaillée du projet"
                },
                "outputPath": {
                  "type": "string",
                  "description": "Chemin où générer les fichiers markdown"
                }
              },
              "required": ["projectName", "projectDescription"]
            }
          },
          {
            "name": "generateFeature",
            "description": "Génère une feature isolée avec ses user stories",
            "parameters": {
              "type": "object",
              "properties": {
                "featureDescription": {
                  "type": "string",
                  "description": "Description détaillée de la feature"
                },
                "businessValue": {
                  "type": "string",
                  "description": "Valeur métier de la feature (optionnel)"
                },
                "storyCount": {
                  "type": "integer",
                  "description": "Nombre de user stories à générer (1-10, par défaut 3)"
                },
                "iterationName": {
                  "type": "string",
                  "description": "Nom de l'itération (optionnel)"
                },
                "epicName": {
                  "type": "string",
                  "description": "Nom de l'epic contenant la feature (optionnel)"
                },
                "outputPath": {
                  "type": "string",
                  "description": "Chemin où générer les fichiers markdown (optionnel)"
                }
              },
              "required": ["featureDescription"]
            }
          },
          {
            "name": "getStatus",
            "description": "Vérifie le statut du serveur",
            "parameters": {
              "type": "object",
              "properties": {}
            }
          }
        ]
      }
    }
  },
  "id": 1
}
```

#### 3. Appel d'outil (generateBacklog)

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "generateBacklog",
    "arguments": {
      "projectName": "Mon Projet",
      "projectDescription": "Description détaillée du projet",
      "outputPath": "./.agile-planner-backlog/mon-projet"
    }
  },
  "id": 2
}
```

#### 4. Réponse d'appel d'outil

```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "Backlog généré avec succès",
    "outputPath": "./.agile-planner-backlog/mon-projet",
    "backlog": {
      "projectName": "Mon Projet",
      "projectDescription": "Description détaillée du projet",
      "epics": [
        {
          "id": "epic-001",
          "title": "Epic 1",
          "description": "...",
          "features": [...]
        }
      ],
      "orphan_stories": [...]
    }
  },
  "id": 2
}
```

## Intégration avec les clients LLM

### Claude.ai

Claude.ai offre une intégration directe avec les serveurs MCP:

1. Allez dans les paramètres de Claude
2. Sélectionnez "Outils > Gérer les outils"
3. Cliquez sur "Ajouter un outil personnalisé"
4. Entrez la commande de lancement d'Agile Planner: `npx agile-planner --mcp`

### Windsurf IDE

Windsurf IDE permet une intégration très simple:

1. Ouvrez les paramètres de Windsurf IDE
2. Allez dans "IA > Cascade > Serveurs MCP"
3. Ajoutez un nouveau serveur avec:
   - Nom: Agile Planner
   - Commande: `npx agile-planner --mcp`
   - Arguments: `--config=./config.json`
   - Utilisez le champ Description: `Générateur d'artefacts Agile (backlog, features, stories)`

### Cursor

Pour intégrer Agile Planner avec Cursor:

1. Ouvrez les paramètres de Cursor
2. Accédez à "AI > MCP Tools"
3. Ajoutez une nouvelle entrée:
   - Nom: Agile Planner
   - Commande: `npx agile-planner --mcp`

## Exemples d'utilisation 

### Génération d'un backlog via Claude.ai

```
Pouvez-vous générer un backlog pour mon projet d'application de suivi de tâches? 
L'application doit permettre aux utilisateurs de créer des tâches, de les organiser 
en projets, de définir des priorités et des échéances, et de suivre leur progression.
```

### Génération d'une feature via Windsurf IDE

```
Générer une feature détaillée pour un système d'authentification avec connexion 
par email/mot de passe et OAuth (Google, GitHub). Inclure toutes les user stories 
nécessaires pour une implémentation complète.
```

## Résolution des problèmes courants

### Temps d'exécution dépassé

Si vous rencontrez des timeouts lors de la génération:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Timeout lors de la génération du backlog"
  },
  "id": 2
}
```

**Solution**: Augmentez la valeur `timeout` dans `config.json`.

### Erreurs d'API

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Erreur API: Rate limit exceeded"
  },
  "id": 2
}
```

**Solution**: Vérifiez votre clé API et ses limites d'utilisation.

## Bonnes pratiques

1. **Descriptions détaillées** - Fournissez des descriptions de projet détaillées pour obtenir des backlogs plus pertinents
2. **Projets ciblés** - Limitez le scope du projet pour une génération plus précise
3. **Itération** - Utilisez la fusion de backlogs pour raffiner progressivement votre backlog
4. **Validation** - Vérifiez et ajustez toujours les backlogs générés

## Références

- [Architecture MCP d'Agile Planner](../architecture/mcp-server-architecture.md)
- [Format du backlog](../architecture/backlog-format.md)
- [Spécification MCP](https://github.com/anthropics/anthropic-cookbook/tree/main/mcp)
- [Documentation JSON-RPC 2.0](https://www.jsonrpc.org/specification)
