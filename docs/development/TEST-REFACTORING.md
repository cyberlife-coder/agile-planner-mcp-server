# Plan de refactorisation des tests - Agile Planner MCP Server

Ce document liste les tests qui nécessitent une refactorisation pour résoudre les problèmes d'asynchronisme et autres erreurs. Il sert de guide pour améliorer la qualité et la fiabilité des tests.

## Problèmes identifiés

### 1. Asynchronisme et timeouts

Les tests end-to-end échouent souvent à cause d'opérations asynchrones non correctement gérées. Ces erreurs apparaissent comme :
- "Cannot log after tests are done"
- "A worker process has failed to exit gracefully"
- Timeouts lorsque des promesses ne sont pas proprement résolues

### 2. Erreurs de parsing liées aux caractères français

Certains fichiers contiennent des caractères accentués qui causent des erreurs de parsing :
- `tests/backlog-generator.test.js` (ligne 108) : "Unexpected token erreur"
- `tests/integration/cli-integration.test.js` (ligne 54) : "Unexpected token exécution"

## Tests à refactoriser

| Fichier | Problème | Priorité | Assigné à |
|---------|----------|----------|-----------|
| `tests/integration/mcp.e2e.test.js` | Asynchronisme | Haute | - |
| `tests/integration/mcp.ultra-minimal.test.js` | Asynchronisme | Haute | - |
| `tests/integration/isolated/generateFeature-cli.test.js` | Asynchronisme | Moyenne | - |
| `tests/integration/isolated/generateBacklog-cli.test.js` | Asynchronisme | Moyenne | - |
| `tests/backlog-generator.test.js` | Tokens français | Basse | - |
| `tests/integration/cli-integration.test.js` | Tokens français | Basse | - |

## Approche recommandée

### Pour les problèmes d'asynchronisme :

1. **Améliorer la gestion des promesses** :
   ```javascript
   // Avant
   test('should generate a backlog', () => {
     const result = generateBacklog();
     expect(result).toBeDefined();
   });
   
   // Après
   test('should generate a backlog', async () => {
     const result = await generateBacklog();
     expect(result).toBeDefined();
   });
   ```

2. **Utiliser `done` avec timeout explicit** :
   ```javascript
   test('should handle async operations', (done) => {
     someAsyncOperation().then(result => {
       expect(result).toBe('expected');
       done();
     });
   }, 10000); // timeout explicite en ms
   ```

3. **Nettoyer les ressources** :
   ```javascript
   let server;
   
   beforeEach(() => {
     server = startServer();
   });
   
   afterEach(() => {
     server.close(); // Crucial pour éviter les fuites
   });
   ```

### Pour les erreurs de parsing :

1. **Échapper les caractères spéciaux** :
   ```javascript
   // Avant
   expect(result).toContain("L'exécution a échoué");
   
   // Après
   expect(result).toContain("L\\'exécution a échoué");
   // ou
   expect(result).toContain(`L'exécution a échoué`);
   ```

2. **Utiliser des caractères ASCII lorsque possible** :
   ```javascript
   // Avant
   const errorMessage = "L'opération a échoué";
   
   // Après
   const errorMessage = "L'operation a echoue";
   ```

## Tests à ajouter

- [ ] Test unitaire pour `adaptResultForMarkdown`
- [ ] Test unitaire pour `validateFeatureParams`
- [ ] Test d'intégration pour le workflow complet de génération via CLI
- [ ] Test E2E ultra-minimal pour la compatibilité multi-LLM

## Suivi des progrès

Mettez à jour ce document au fur et à mesure que les tests sont refactorisés en ajoutant des check [x] dans les cases à cocher et en mettant à jour la colonne "Assigné à".
