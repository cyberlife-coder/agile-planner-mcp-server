---
description: # Workflow d'Analyse de Qualité - Agile Planner
---

# Workflow d'Analyse de Qualité - Agile Planner

## Déclencheur
- Hebdomadaire (recommandé)
- Avant un commit important
- Avant une release

## Étapes
1. **Analyse de la structure du code**
   - Vérifier que chaque fichier respecte la limite de 500 lignes
   - Vérifier que chaque fonction respecte la limite de 50 lignes
   - Identifier les fichiers qui pourraient bénéficier d'une refactorisation

2. **Analyse des design patterns**
   - Vérifier l'utilisation cohérente des design patterns
   - Identifier les opportunités d'application de patterns (si justifié)
   - S'assurer que les patterns utilisés sont documentés dans `design.md`

3. **Analyse de la couverture des tests**
   - Vérifier que toutes les fonctions avec plus de 3 branches logiques sont testées
   - Identifier les parties du code sans tests adéquats
   - Prioriser l'ajout de tests pour les composants critiques

4. **Analyse de la documentation**
   - Vérifier que tous les fichiers `.md` sont à jour
   - S'assurer que les exemples sont fonctionnels et pertinents
   - Vérifier la cohérence entre le code et la documentation

5. **Création/mise à jour du fichier TASKS.md**
   - Documenter les problèmes identifiés
   - Prioriser les tâches selon leur impact sur la qualité
   - Format recommandé: `- [ ] Description de la tâche *(référence: fichier.js)*`

6. **Vérification de la structure du projet**
   - S'assurer que la structure des fichiers respecte le standard défini (RULE 3)
   - Vérifier que les fichiers sont dans les bons répertoires
   - Identifier les fichiers obsolètes ou redondants

## Validation
- Génération d'un rapport de qualité
- Mise à jour du fichier TASKS.md
- Plan d'action pour résoudre les problèmes identifiés

## Outils MCP à utiliser
- `sequential-thinking` pour analyser méthodiquement chaque aspect du code
- `context7` pour vérifier les meilleures pratiques de qualité de code
- `brave-search` pour :
  - Rechercher les tendances actuelles en matière de qualité de code
  - Identifier les anti-patterns à éviter dans le contexte spécifique du projet
  - Comparer les métriques de qualité avec les standards de l'industrie
  - Découvrir de nouveaux outils d'analyse de code pertinents
