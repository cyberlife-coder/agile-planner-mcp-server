# Plan de refactorisation - Agile Planner MCP Server

Ce document détaille les éléments du code qui nécessitent une refactorisation pour réduire la complexité cognitive et améliorer la maintenabilité, conformément à RULE 1 et RULE 4 du projet.

## Problèmes de complexité cognitive identifiés

### 1. Fonction `createRule3Structure` - mcp-router.js

**Problème :** Complexité cognitive > 15 (limite SonarQube)  
**Lint ID :** 7ef1bfef-7230-4fed-a02e-e61e3339e840

#### Plan de refactorisation (TDD)

1. Créer des tests unitaires pour chaque aspect de la fonction :
   - Test de validation des paramètres d'entrée
   - Test de création de la structure de base
   - Test de création des dossiers d'epic, features et user stories
   - Test de génération des slugs
   - Test de création des fichiers README et Info

2. Décomposer en fonctions plus petites :
   ```javascript
   // Au lieu de tout faire dans createRule3Structure
   function createRule3Structure(backlogDir, adaptedResult, epicToUse) {
     const params = validateRule3Params(backlogDir, epicToUse, adaptedResult);
     if (!params) return null;
     
     const baseCreated = createBaseDirectories(params.validBacklogDir);
     if (!baseCreated) return null;
     
     const slugs = generateSlugs(epicToUse, adaptedResult.feature);
     const paths = buildDirectoryPaths(params.validBacklogDir, slugs);
     
     createFeatureDirectories(paths);
     createInfoFiles(paths, adaptedResult, epicToUse);
     
     return slugs;
   }
   ```

### 2. Expression régulière dans `_getSlugifyFunction` - mcp-router.js

**Problème :** Précédence des opérateurs non explicite  
**Lint ID :** e004be1d-33bc-401b-9356-f7f74ff465ba

#### Solution recommandée

```javascript
// Avant
return lowerCase.replace(/[^a-z0-9]+/g, '-').replace(/^(-)|(-)$/g, '');

// Après (avec parenthèses explicites)
return lowerCase.replace(/[^a-z0-9]+/g, '-').replace(/(^-)|(-$)/g, '');
```

### 3. Fonction `parseJsonResponse` - json-parser.js

**Problème :** Complexité cognitive de 31 (plus du double de la limite)  
**Lint ID :** 4aef1b1a-e476-4b16-8ae0-5da4f62d9058

#### Plan de refactorisation (TDD)

1. Créer un ensemble complet de tests avec différents types d'entrées :
   - JSON valide
   - JSON avec format markdown
   - JSON malformé
   - Réponse non-JSON
   - Cas limites et exceptions

2. Décomposer en petites fonctions avec responsabilité unique :
   ```javascript
   function parseJsonResponse(content) {
     // Tenter le parsing direct
     const directResult = tryDirectParse(content);
     if (directResult.success) return directResult.data;
     
     // Essayer d'extraire JSON depuis markdown
     const markdownResult = extractJsonFromMarkdown(content);
     if (markdownResult.success) return markdownResult.data;
     
     // Autres stratégies de récupération
     const recoveryResult = attemptJsonRecovery(content);
     if (recoveryResult.success) return recoveryResult.data;
     
     // Échec, mais retourner le meilleur effort possible
     return constructFallbackResponse(content);
   }
   ```

## Échéancier proposé

| Tâche | Priorité | Estimation |
|-------|----------|------------|
| Tests pour `createRule3Structure` | Haute | 1 jour |
| Refactorisation de `createRule3Structure` | Haute | 2 jours |
| Correction de l'expression régulière | Moyenne | 0.5 jour |
| Tests pour `parseJsonResponse` | Haute | 1 jour |
| Refactorisation de `parseJsonResponse` | Haute | 2 jours |

## Alignement sur les règles du projet

- Cette refactorisation suit le principe TDD (RULE 1)
- Vise à respecter la limite de 50 lignes par fonction (RULE 4)
- Améliore la lisibilité et la maintenance du code (RULE 4)
- Permet un meilleur support multi-LLM (Windsurf, Claude, Cursor)

## Mesures de succès

- Réduction de la complexité cognitive sous la limite de 15
- Aucun avertissement de linting
- Maintien ou amélioration de la couverture de code
- Documentation claire des modules
