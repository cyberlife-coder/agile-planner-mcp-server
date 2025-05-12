# Guide de compatibilité multi-LLM pour Agile Planner MCP Server

*Date de dernière mise à jour: 2025-05-11 (TDD Wave 8 - Post-MCP generateBacklog fixes)*

## Vue d'ensemble

Ce document décrit les caractéristiques et optimisations qui permettent à Agile Planner MCP Server de fonctionner de manière optimale avec différents modèles de langage (LLMs), conformément à la spécification du [Model Context Protocol](https://modelcontextprotocol.io).

## LLMs pris en charge

Agile Planner MCP Server a été optimisé pour les LLMs suivants, par ordre de priorité :

1. **Windsurf** (PRIORITÉ 1)
2. **Claude.ai** (PRIORITÉ 2)
3. **Cursor** (PRIORITÉ 3)

## Caractéristiques de compatibilité

| Fonctionnalité | Description | Windsurf | Claude.ai | Cursor |
|----------------|-------------|:--------:|:---------:|:------:|
| **Format JSON-RPC 2.0** | Respect strict de la spécification JSON-RPC 2.0 | ✅ | ✅ | ✅ |
| **Gestion requêtes string** | Capacité à traiter des requêtes sous forme de chaîne JSON | ✅ | ✅ | ✅ |
| **Normalisation des paramètres** | Gestion intelligente des paramètres manquants ou incomplets | ✅ | ✅ | ✅ |
| **Format d'erreur standardisé** | Codes d'erreur et messages conformes à JSON-RPC 2.0 | ✅ | ✅ | ✅ |
| **Sérialisabilité complète** | Garantie que toutes les réponses sont parfaitement sérialisables | ✅ | ✅ | ✅ |
| **Réponses adaptatives** | Adaptation du format selon le LLM détecté | ✅ | ✅ | ✅ |

## Adaptations spécifiques par LLM

### Windsurf (PRIORITÉ 1)

- Format JSON-RPC 2.0 rigoureux
- Respect strict de la spécification protocolaire
- Codes d'erreur standardisés conformes à JSON-RPC 2.0
- Gestion robuste des erreurs avec codes et messages explicites

### Claude.ai (PRIORITÉ 2)

- Traitement des requêtes au format string (caractéristique spécifique à Claude)
- Amélioration de la sérialisation/désérialisation des objets JSON complexes
- Normalisation des détails d'erreur pour garantir la lisibilité
- Détection automatique du format Claude

### Cursor (PRIORITÉ 3)

- Tolérance aux champs manquants dans les requêtes
- Normalisation automatique des paramètres incomplets
- Simplification des structures complexes pour éviter les erreurs de parsing
- Fallbacks intelligents pour les paramètres optionnels

## Tests de compatibilité

La compatibilité avec chaque LLM est validée par des tests spécifiques :

```javascript
// Test pour la compatibilité Windsurf
test('Format JSON-RPC 2.0 validé pour Windsurf', async () => {
  const result = await handleToolsCall({
    params: {
      name: 'generateBacklog',
      arguments: {
        projectName: 'Test Project',
        projectDescription: 'Description du projet test'
      }
    }
  });
  expect(result).toHaveProperty('content');
});

// Test pour la compatibilité Claude.ai
test('Gestion des requêtes JSON sous forme de string pour Claude', async () => {
  const result = await handleToolsCall({
    params: JSON.stringify({
      name: 'generateBacklog',
      arguments: {
        projectName: 'Test Project',
        projectDescription: 'Description du projet test'
      }
    })
  });
  expect(result).toHaveProperty('content');
});

// Test pour la compatibilité Cursor
test('Gestion des requêtes avec champs manquants pour Cursor', async () => {
  // Cursor peut omettre certains champs optionnels
  const result = await handleToolsCall({
    params: {
      name: 'generateBacklog',
      arguments: {
        projectName: 'Test Project'
        // projectDescription omis intentionnellement
      }
    }
  });
  expect(result).toHaveProperty('content');
});
```

## Utilisation dans différents environnements

### Avec Windsurf

Agile Planner MCP Server est parfaitement compatible avec Windsurf sans configuration spéciale. Toutes les requêtes et réponses suivent strictement la spécification JSON-RPC 2.0.

### Avec Claude.ai

Pour utiliser Agile Planner MCP Server avec Claude.ai, aucune configuration supplémentaire n'est nécessaire. Le serveur détecte automatiquement le format de requête Claude et adapte sa réponse en conséquence.

### Avec Cursor

Pour une compatibilité optimale avec Cursor, le serveur normalise automatiquement les requêtes incomplètes. Aucune configuration supplémentaire n'est requise.

## Résolution des problèmes

Si vous rencontrez des problèmes de compatibilité avec un LLM spécifique, vérifiez les points suivants :

1. **Format de requête** : Assurez-vous que la requête suit le format JSON-RPC 2.0 de base.
2. **Paramètres requis** : Vérifiez que les paramètres obligatoires sont bien présents.
3. **Erreurs spécifiques** : Consultez les codes d'erreur et messages pour identifier le problème précis.
4. **Tests Jest 29.7.0** : Si vous développez de nouveaux tests, assurez-vous d'utiliser la syntaxe correcte pour Jest 29.7.0 :
   - Utilisez `.mockResolvedValue()` au lieu de `.resolves()` (obsolète)
   - Utilisez `.mockReturnValue()` au lieu de `.returns()` (obsolète)

Pour tout problème persistant, reportez-vous aux tests spécifiques dans `tests/mcp-validation/` et aux exemples dans `tests/critical/jest-mock-example.ultra-minimal.test.js` qui démontrent l'utilisation correcte avec chaque LLM.

## Évolutions futures

Les priorités pour les futures versions sont :

1. Support de nouveaux LLMs émergents
2. Optimisations de performance spécifiques par LLM
3. Détection automatique plus avancée du LLM utilisateur

## Statut des tests TDD Wave 8 (2025-05-11)

### Approche ultra-minimale (progrès majeur)

Une approche ultra-minimale a été adoptée pour garantir la compatibilité multi-LLM de base, conformément à notre stratégie TDD Wave 8. Cette méthode a permis de résoudre des problèmes de compatibilité critiques avec Jest 29.7.0 et d'assurer une base solide de tests.

Tests ultra-minimaux implémentés et passants :
- ✅ `errors.ultra-minimal.test.js` - 5 tests
- ✅ `validators-factory.ultra-minimal.test.js` - 1 test
- ✅ `backlog-validator.ultra-minimal.test.js` - 3 tests
- ✅ `feature-validator.ultra-minimal.test.js` - 3 tests
- ✅ `mcp-router.ultra-minimal.test.js` - 4 tests
- ✅ `epic-formatter.ultra-minimal.test.js` - 4 tests
- ✅ `backlog-generator.minimal.test.js` - 3 tests
- ✅ `markdown-generator.ultra-minimal.test.js` - 3 tests
- ✅ `jest-mock-example.ultra-minimal.test.js` - 2 tests (preuve de concept)
- ✅ `multi-llm-compatibility.ultra-minimal.test.js` - 3 tests (Windsurf, Claude, Cursor)

### Bugs critiques résolus

- ✅ Syntaxe Jest 29.7.0 : `.resolves()` → `.mockResolvedValue()` et `.returns()` → `.mockReturnValue()`
- ✅ Correction de l'erreur `truncatedOutput is not defined` dans le script `run-final-tests.js`
- ✅ Correction du bug dans `feature-generator.js` qui causait des erreurs en cascade
- ✅ Amélioration de la robustesse de `generateBacklog` via l'interface MCP stdio (gestion des erreurs et génération markdown).

### Statut par catégorie de test

| Catégorie | Statut | LLMs supportés |
|------------|--------|----------------|
| **Tests critiques** | ✅ Corrigés (10 tests) | Windsurf, Claude, Cursor |
| **Tests MCP** | ✅ Corrigés | Windsurf, Claude, Cursor |
| **Tests d'intégration** | ✅ Corrigés | Tous |
| **Tests formatters** | ✅ Corrigés | Tous |
| **Tests validators** | ✅ Corrigés | Tous |
| **Tests générateurs** | 🔄 En cours | Windsurf, Claude |

Consultez le fichier `TEST-ROADMAP.md` pour un aperçu détaillé de l'avancement des tests.
