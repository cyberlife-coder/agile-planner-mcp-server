---
description: Workflow Git - Agile Planner
---

# Workflow Git - Agile Planner

## Description
Ce workflow définit les pratiques Git standardisées pour le projet Agile Planner, assurant un historique de code propre, une collaboration efficace et une gestion rigoureuse des versions. Il couvre l'ensemble du cycle de vie du code, de la création de branches à la fusion, en passant par les conventions de commit et la gestion des releases. Ce workflow est essentiel pour maintenir la traçabilité des changements, faciliter les revues de code et assurer la qualité du code à chaque étape du développement.

## Objectif
Standardiser les pratiques Git pour maintenir un historique propre, faciliter la collaboration et assurer la qualité du code à chaque étape du développement.

## Branches principales
- `main` : Code de production stable et testé
- `develop` : Branche d'intégration pour les fonctionnalités terminées
- `feature/*` : Branches de développement pour chaque fonctionnalité
- `bugfix/*` : Branches pour corriger des bugs
- `refactor/*` : Branches dédiées aux refactorisations

## Workflow de développement

### 1. Création d'une branche de fonctionnalité
```bash
# Mettre à jour la branche develop
git checkout develop
git pull origin develop

# Créer une nouvelle branche de fonctionnalité
git checkout -b feature/nom-explicite-de-la-fonctionnalite
```

### 2. Développement avec commits atomiques
- Faire des commits fréquents et atomiques (une seule responsabilité par commit)
- Utiliser des messages de commit clairs et descriptifs suivant la convention :
  ```
  type: description concise

  Description détaillée si nécessaire
  ```
  Types : `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`

### 3. Préparation du commit
```bash
# Vérifier les modifications
git status
git diff

# Ajouter les fichiers modifiés
git add <fichiers>

# Avant de commiter, vérifier :
# 1. Mise à jour des fichiers .md
# 2. Mise à jour du CHANGELOG.md si nécessaire
# 3. Mise à jour de la version dans package.json si nécessaire
```

### 4. Commit avec message conventionnel
```bash
# Pour une nouvelle fonctionnalité
git commit -m "feat: implémentation de la fonctionnalité X"

# Pour une correction de bug
git commit -m "fix: résolution du problème Y"

# Pour une refactorisation
git commit -m "refactor: amélioration de la structure du module Z"

# Pour la documentation
git commit -m "docs: mise à jour du guide d'utilisation"

# Pour les tests
git commit -m "test: ajout de tests pour la fonctionnalité X"
```

### 5. Synchronisation régulière avec develop
```bash
# Mettre à jour la branche develop locale
git checkout develop
git pull origin develop

# Revenir sur la branche de fonctionnalité et rebaser
git checkout feature/nom-explicite-de-la-fonctionnalite
git rebase develop

# Résoudre les conflits si nécessaire
```

### 6. Tests avant Pull Request
```bash
# Exécuter les tests unitaires
npm test

# Vérifier la qualité du code
npm run lint

# S'assurer que tous les tests passent et que le code est conforme aux standards
```

### 7. Création d'une Pull Request
- Titre clair et descriptif
- Description détaillée des modifications
- Référence aux issues concernées
- Liste des tests effectués
- Capture d'écran si pertinent

### 8. Review et merge
- Au moins un reviewer doit approuver la PR
- Tous les tests automatisés doivent passer
- Après approbation, utiliser "Squash and merge" pour conserver un historique propre

### 9. Nettoyage après merge
```bash
# Supprimer la branche locale après merge
git checkout develop
git pull origin develop
git branch -d feature/nom-explicite-de-la-fonctionnalite

# Supprimer la branche distante si nécessaire
git push origin --delete feature/nom-explicite-de-la-fonctionnalite
```

## Gestion des versions

### Préparation d'une release
```bash
# Créer une branche de release
git checkout develop
git checkout -b release/vX.Y.Z

# Mettre à jour la version et le CHANGELOG
# Effectuer les derniers tests et corrections

# Merger dans main ET develop
git checkout main
git merge --no-ff release/vX.Y.Z -m "chore: release vX.Y.Z"
git tag -a vX.Y.Z -m "Version X.Y.Z"
git push origin main --tags

git checkout develop
git merge --no-ff release/vX.Y.Z -m "chore: prepare next development iteration"
git push origin develop

# Supprimer la branche de release
git branch -d release/vX.Y.Z
```

## Outils MCP à utiliser
- `sequential-thinking` pour planifier les étapes de refactorisation ou de développement complexe
- `context7` pour vérifier les meilleures pratiques Git et les conventions de commit
- `brave-search` pour :
  - Rechercher des solutions à des problèmes Git spécifiques
  - Explorer les workflows Git adaptés à des situations particulières
  - Se tenir informé des évolutions des bonnes pratiques Git

## Validation
- Historique Git propre et lisible
- Branches feature courtes et focalisées
- Messages de commit informatifs et standardisés
- Documentation et CHANGELOG à jour
- Tests passant à chaque étape importante