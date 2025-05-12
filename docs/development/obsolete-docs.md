# Fichiers de documentation obsolètes

**Date de dernière modification:** 12/05/2025  
**Version:** 1.7.1

Ce document répertorie les fichiers de documentation qui sont devenus obsolètes suite aux refactorisations récentes et à la mise à jour complète de la documentation MCP.

## Fichiers obsolètes à supprimer

Les fichiers suivants peuvent être supprimés car leur contenu a été intégré dans la nouvelle documentation ou n'est plus pertinent :

| Fichier | Raison | Statut |
|---------|--------|--------|
| `docs/development/refactor-tasks.md` | Les tâches ont été complétées ou intégrées dans refactor-docs-plan.md | À supprimer |
| `docs/development/test-roadmap.md` | Le roadmap des tests a été complété | À supprimer |
| `docs/development/test-fix-plan.md` | Plan temporaire, travail terminé | À supprimer |
| `docs/development/test-resolution-strategy.md` | Stratégie déjà appliquée | À supprimer |
| `docs/development/refactor-plan.md` | Plan de refactorisation déjà exécuté | À archiver |
| `docs/architecture.md` | Contenu dupliqué, remplacé par `docs/architecture/architecture.md` | À supprimer |

## Fichiers à conserver

Les fichiers suivants sont toujours pertinents et doivent être conservés :

| Fichier | Raison | Statut |
|---------|--------|--------|
| `docs/architecture/README.md` | Vue d'ensemble de l'architecture | À conserver |
| `docs/architecture/architecture.md` | Documentation principale d'architecture | À conserver et maintenir |
| `docs/architecture/backlog-format.md` | Référence du format de backlog | À conserver et mettre à jour |
| `docs/architecture/design.md` | Documentation des patterns de conception | À conserver |
| `docs/architecture/mcp-server-architecture.md` | Nouvelle documentation MCP | À conserver |
| `docs/architecture/markdown-generation.md` | Nouvelle documentation markdown | À conserver |
| `docs/development/testing-guide.md` | Guide de test toujours pertinent | À conserver |
| `docs/development/obsolete-files.md` | Liste des fichiers de code obsolètes | À conserver |
| `docs/guides/mcp-integration.md` | Nouvelle documentation MCP | À conserver |
| `docs/guides/optimal-usage-guide.md` | Guide d'utilisation toujours pertinent | À conserver |

## Fichiers à mettre à jour

Les fichiers suivants nécessitent une mise à jour pour refléter l'état actuel du projet :

| Fichier | Raison | Statut |
|---------|--------|--------|
| `docs/architecture/backlog-format.md` | Doit être mis à jour avec les détails MCP | À mettre à jour |
| `docs/guides/optimal-usage-guide.md` | Doit inclure des exemples MCP | À mettre à jour |
| `docs/architecture/README.md` | Doit référencer les nouveaux documents | À mettre à jour |
| `docs/guides/README.md` | Doit référencer le guide d'intégration MCP | À mettre à jour |

## Procédure de nettoyage

1. Vérifier que tous les fichiers à supprimer ne contiennent pas d'informations uniques
2. Archiver les fichiers importants dans `.windsurf/archive` si nécessaire
3. Supprimer les fichiers obsolètes listés ci-dessus
4. Mettre à jour les fichiers qui nécessitent des modifications
5. Mettre à jour le CHANGELOG.md pour refléter le nettoyage de la documentation

## Vérification

Avant de supprimer un fichier, assurez-vous que :
- Tout le contenu pertinent a été migré vers la nouvelle documentation
- Le fichier n'est pas référencé ailleurs dans le code ou la documentation
- Il n'y a pas d'information historique importante qui pourrait être utile à l'avenir

## Note sur la conservation des fichiers de documentation

Contrairement aux fichiers de code source, la limite de 500 lignes ne s'applique pas aux fichiers de documentation. Les fichiers de documentation peuvent être aussi longs que nécessaire pour fournir une information complète et détaillée.
