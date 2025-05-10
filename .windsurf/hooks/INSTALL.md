# Installation des Hooks Git pour Agile Planner

Ce guide explique comment installer les hooks Git pour automatiser les vérifications de qualité avant chaque commit/push, conformément à la RULE 6.

## Installation Manuelle

- **Copier les hooks dans le répertoire `.git/hooks`** de votre repo local :

```bash
# Depuis la racine du projet
cp .windsurf/hooks/* .git/hooks/
chmod +x .git/hooks/*
```

## Installation automatique des hooks (Windows/PowerShell)

1. Ouvre un terminal PowerShell à la racine du projet.
2. Exécute :
   powershell -ExecutionPolicy Bypass -File .windsurf/hooks/install-git-hooks.ps1
3. Les hooks sont copiés dans `.git/hooks/` et seront actifs pour tous les commits.

> Les hooks `.sh` sont conservés pour compatibilité Linux/macOS, mais sous Windows utiliser les [.ps1](cci:7://file:///d:/Projets-dev/MCP/AgilePlanner/.windsurf/hooks/pre-commit-lint.ps1:0:0-0:0).

## Hooks Disponibles

### pre-commit
- Vérifie que les fichiers `.md` sont à jour
- S'assure que le CHANGELOG.md est mis à jour avec les modifications
- Exécute les tests unitaires
- Vérifie le linting du code
- Contrôle la taille des fichiers (max 500 lignes)
- Vérifie la conformité à la structure RULE 3
- Valide le schéma OpenAPI

### commit-msg
- Vérifie que les messages de commit suivent la convention :
  - Format : `type: description concise`
  - Types : `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`
  - Description suffisamment détaillée

## Configuration Automatique

Exécute simplement le script d'installation ci-dessus pour mettre à jour tous les hooks.

## Résolution des Problèmes

Si vous rencontrez des erreurs lors des commits :
- Vérifiez que PowerShell est bien installé et accessible.
- Vérifiez que les dépendances (`npm install`, `swagger-cli`...) sont bien en place.
- Consultez les messages d’erreur des hooks pour corriger les problèmes avant de committer.

---

_Dernière mise à jour : 2025-05-10_
