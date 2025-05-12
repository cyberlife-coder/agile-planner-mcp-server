# Architecture du serveur MCP Agile Planner

**Date de dernière modification:** 12/05/2025  
**Version:** 1.7.1

## Vue d'ensemble

Agile Planner implémente le protocole MCP (Model Context Protocol) qui permet aux assistants IA comme Claude, Cursor et Windsurf IDE d'interagir avec des outils externes. Cette documentation détaille l'architecture et le fonctionnement du serveur MCP.

## Architecture générale

```mermaid
graph TB
    subgraph "Client LLM"
        C[Claude.ai] 
        W[Windsurf IDE]
        CU[Cursor]
    end
    
    subgraph "Agile Planner MCP Server"
        direction TB
        E[MCP Entry Point] --> Router[MCP Router]
        Router --> Tools[Tools Registry]
        
        subgraph "Core Tools"
            Tools --> BacklogGenerator[Backlog Generator]
            Tools --> MarkdownGenerator[Markdown Generator]
            Tools --> StatusChecker[Status Checker]
        end
        
        BacklogGenerator --> OPENAI[OpenAI API]
        BacklogGenerator --> GROQ[Groq API]
        
        MarkdownGenerator --> FileSystem[File System]
    end
    
    C -- "JSON-RPC 2.0" --> E
    W -- "JSON-RPC 2.0" --> E
    CU -- "JSON-RPC 2.0" --> E
```

## Fonctionnement du serveur MCP

Le serveur MCP Agile Planner utilise le protocole JSON-RPC 2.0 pour communiquer avec les clients LLM. Le flux général est le suivant:

### 1. Initialisation

```mermaid
sequenceDiagram
    participant Client as Client LLM
    participant Server as MCP Server
    
    Client->>Server: initialize {version}
    Server->>Server: Vérifier version MCP
    Server-->>Client: {server_info, tools_list}
    Note right of Server: Retourne les informations sur le serveur et les outils disponibles
```

### 2. Appel d'outil

```mermaid
sequenceDiagram
    participant Client as Client LLM
    participant Server as MCP Server
    participant Tools as Tools Registry
    participant Generator as Backlog Generator
    participant LLMAPI as LLM API (OpenAI/Groq)
    
    Client->>Server: tools/call {name, arguments}
    Server->>Tools: Recherche de l'outil
    Tools->>Generator: Appel avec arguments
    Generator->>LLMAPI: Requête de génération
    LLMAPI-->>Generator: Réponse
    Generator-->>Tools: Résultat de la génération
    Tools-->>Server: Résultat traité
    Server-->>Client: {result}
```

## Composants principaux

### MCP Router (`server/lib/mcp-router.js`)

Le routeur MCP est responsable de:
- Recevoir et valider les requêtes JSON-RPC 2.0
- Dispatcher les requêtes vers les handlers appropriés
- Formater les réponses selon la spécification MCP

```javascript
// Exemple simplifié du fonctionnement du routeur MCP
function processRequest(jsonRequest) {
  if (jsonRequest.method === 'initialize') {
    return handleInitialize(jsonRequest);
  } else if (jsonRequest.method === 'tools/list') {
    return handleToolsList(jsonRequest);
  } else if (jsonRequest.method === 'tools/call') {
    return handleToolsCall(jsonRequest);
  } else {
    return createErrorResponse(jsonRequest.id, 'Method not found');
  }
}
```

### Registre d'outils

Les outils disponibles dans Agile Planner MCP incluent:

| Nom | Description | Arguments | Retour |
|-----|-------------|-----------|--------|
| `generateBacklog` | Génère un backlog complet | `projectName`, `projectDescription`, `outputPath` | Structure JSON du backlog |
| `generateFeature` | Génère une feature isolée | `featureTitle`, `featureDescription`, `outputPath` | Structure JSON de la feature |
| `getStatus` | Vérifie le statut du serveur | - | État actuel du serveur |

### Générateur de backlog

Le générateur de backlog est responsable de:
- Construire les prompts pour le LLM (OpenAI/Groq)
- Envoyer les requêtes à l'API appropriée
- Traiter et valider les réponses
- Générer les fichiers markdown correspondants

## Architecture de génération markdown

```mermaid
graph TD
    BacklogJSON[Backlog JSON] --> MarkdownGenerator
    MarkdownGenerator --> EpicFormatter
    MarkdownGenerator --> FeatureFormatter
    MarkdownGenerator --> StoryFormatter
    
    EpicFormatter --> |"epic.md"| FileSystem
    FeatureFormatter --> |"feature.md"| FileSystem
    StoryFormatter --> |"[story-slug].md"| FileSystem
    
    subgraph "Structure de fichiers générée"
        FileSystem --> |".agile-planner-backlog/"| RootDir
        RootDir --> |"epics/"| EpicsDir
        RootDir --> |"orphan-stories/"| OrphanDir
        EpicsDir --> |"[epic-slug]/"| EpicDir
        EpicDir --> |"features/"| FeaturesDir
        FeaturesDir --> |"[feature-slug]/"| FeatureDir
        FeatureDir --> |"user-stories/"| StoriesDir
    end
```

## Modes de fonctionnement

Agile Planner peut fonctionner dans trois modes distincts:

1. **Mode MCP** - Communication via stdio pour intégration avec les LLM
2. **Mode CLI** - Interface en ligne de commande pour utilisation directe
3. **Mode API** - Serveur HTTP pour intégrations personnalisées

Tous les modes partagent le même cœur fonctionnel pour assurer la cohérence.

## Tests et validation

Le système de tests inclut:

- Tests unitaires pour chaque composant
- Tests d'intégration pour le flux complet
- Tests end-to-end spécifiques au protocole MCP

```mermaid
graph LR
    UnitTests --> Composants
    IntegrationTests --> Flows
    E2ETests --> MCPProtocol
    
    subgraph "Tests unitaires"
        Composants --> RouterTest
        Composants --> GeneratorTest
        Composants --> FormatterTest
    end
    
    subgraph "Tests d'intégration"
        Flows --> BacklogFlow
        Flows --> MCPFlow
        Flows --> MarkdownFlow
    end
    
    subgraph "Tests E2E"
        MCPProtocol --> CLITest
        MCPProtocol --> StdioTest
    end
```

## Sécurité et gestion des erreurs

Le serveur MCP inclut plusieurs mécanismes de sécurité:

- Validation des entrées utilisateur
- Gestion des timeouts pour les requêtes LLM
- Logs détaillés pour le débogage
- Mécanismes de reprise sur erreur

## Références

- [Spécification MCP](https://github.com/anthropics/anthropic-cookbook/tree/main/mcp)
- [Documentation JSON-RPC 2.0](https://www.jsonrpc.org/specification)
- [Formats de backlog](./backlog-format.md)
