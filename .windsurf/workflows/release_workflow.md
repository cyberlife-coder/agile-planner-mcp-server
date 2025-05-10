---
description:  Workflow de Préparation de Release - Agile Planner
---

# Workflow de Préparation de Release - Agile Planner

## Description
Ce workflow standardise le processus de préparation et de publication d'une nouvelle version du projet Agile Planner. Il assure que toute la documentation est à jour, que les tests sont complets, que le CHANGELOG est mis à jour et que le versionnement suit les règles SemVer. Ce workflow est essentiel pour maintenir la qualité et la traçabilité des versions publiées, tout en facilitant l'adoption par les utilisateurs grâce à une documentation claire des changements.

## Utilisation dans Wave 8
Dans Wave 8, ce workflow peut être déclenché manuellement lorsque vous êtes prêt à créer une nouvelle version, ou automatiquement lorsque vous créez une branche release/*. Windsurf vous guidera à travers chaque étape et vérifiera que toutes les conditions sont remplies avant de finaliser la release.

## Déclencheur
- Avant de créer une nouvelle version
- Après avoir terminé un ensemble de fonctionnalités ou corrections

## Étapes
1. **Vérification des tests**
   - Exécuter tous les tests unitaires et d'intégration
   - S'assurer que la couverture de tests est adéquate (min. 80%)
   - Corriger les tests qui échouent avant de continuer

2. **Mise à jour de la documentation**
   - Mettre à jour **tous** les fichiers `.md` du projet
   - Vérifier que les exemples sont à jour et fonctionnels
   - Mettre à jour les guides d'utilisation si nécessaire

3. **Mise à jour du CHANGELOG.md**
   - Ajouter une nouvelle section pour la version à venir
   - Documenter toutes les nouvelles fonctionnalités, améliorations et corrections
   - Organiser les changements par catégorie (Nouvelles fonctionnalités, Améliorations, Corrections)
   - Inclure des références aux issues ou PRs si applicable

4. **Mise à jour de la version**
   - Déterminer le type de changement selon SemVer:
     - MAJOR: changements incompatibles avec les versions précédentes
     - MINOR: nouvelles fonctionnalités rétrocompatibles
     - PATCH: corrections de bugs rétrocompatibles
   - Mettre à jour la version dans `package.json`
   - Mettre à jour toute autre référence à la version dans le code

5. **Vérification des dépendances**
   - S'assurer que toutes les dépendances sont à jour et sécurisées
   - Vérifier que `package.json` contient toutes les dépendances nécessaires
   - Exécuter `npm audit` pour identifier les vulnérabilités potentielles

6. **Préparation du tag Git**
   - Créer un commit avec le message "Release vX.Y.Z"
   - Créer un tag Git avec la nouvelle version
   - Préparer les notes de release pour GitHub/GitLab

## Validation
- Tous les tests passent
- La documentation est à jour
- Le CHANGELOG.md reflète tous les changements
- La version est correctement incrémentée
- Toutes les dépendances sont à jour et sécurisées

## Outils MCP à utiliser
- `sequential-thinking` pour vérifier que toutes les étapes ont été suivies
- `context7` pour vérifier les meilleures pratiques de versioning
