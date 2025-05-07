# Workflow TDD - Agile Planner

## Description
Ce workflow guide le développeur à travers le processus de Test-Driven Development (TDD) pour assurer une qualité de code optimale et une couverture de tests complète. Il s'applique à toute nouvelle fonctionnalité, correction de bug ou refactorisation dans le projet Agile Planner. Ce workflow est conçu pour minimiser les régressions, faciliter la maintenance et garantir que le code respecte les standards définis dans les règles du projet.

## Utilisation dans Wave 8
Dans Wave 8, ce workflow peut être déclenché manuellement lors du développement d'une nouvelle fonctionnalité ou automatiquement lorsque vous créez une branche feature/* ou bugfix/*. Windsurf vous guidera à travers chaque étape et vous rappellera les bonnes pratiques à suivre.

## Déclencheur
- Lorsque vous commencez une nouvelle fonctionnalité
- Lorsque vous corrigez un bug
- Lorsque vous refactorisez du code existant

## Étapes
1. **Analyse des besoins**
   - Comprendre clairement ce que la fonctionnalité doit faire
   - Identifier les cas d'utilisation et les cas limites
   - Documenter les exigences dans un fichier temporaire

2. **Écriture des tests**
   - Créer un fichier de test pour la fonctionnalité (si inexistant)
   - Écrire des tests qui échouent pour chaque comportement attendu
   - S'assurer que les tests couvrent tous les cas d'utilisation identifiés

3. **Implémentation du code minimal**
   - Écrire le code minimal pour faire passer les tests
   - Ne pas optimiser prématurément
   - Exécuter les tests après chaque modification significative

4. **Refactorisation**
   - Améliorer la structure du code sans modifier son comportement
   - S'assurer que tous les tests continuent de passer
   - Vérifier que le code respecte les limites (max 500 lignes par fichier, 50 lignes par fonction)

5. **Documentation**
   - Mettre à jour la documentation (commentaires, README, etc.)
   - Ajouter des exemples d'utilisation si nécessaire
   - Mettre à jour le CHANGELOG.md

## Validation
- Tous les tests doivent passer
- Le code doit respecter les règles de style et les bonnes pratiques
- La documentation doit être à jour et complète

## Outils MCP à utiliser
- `sequential-thinking` pour décomposer les problèmes complexes
- `context7` pour vérifier les meilleures pratiques et la documentation
