# Plan de refactorisation de la documentation Agile Planner

## Contexte
Le projet Agile Planner fonctionne comme un serveur MCP (Model Context Protocol) compatible avec Claude.ai, Cursor et Windsurf IDE. La documentation actuelle est dispersée et ne reflète pas fidèlement l'architecture et le fonctionnement moderne du projet.

## Objectifs
1. Unifier la structure documentaire
2. Mettre à jour les diagrammes Mermaid pour refléter l'architecture MCP
3. Supprimer les documents obsolètes
4. Créer de nouveaux documents ciblés sur l'utilisation MCP
5. Mettre à jour les guides d'utilisation

## Étapes de refactorisation

### Phase 1: Audit et nettoyage
- [x] Identifier tous les fichiers markdown dans le projet
- [x] Analyser les documents obsolètes
- [x] Créer une liste des documents à conserver, à mettre à jour ou à supprimer
- [x] Valider la nouvelle structure documentaire

### Phase 2: Mise à jour des diagrammes
- [x] Créer un diagramme de flux MCP (communication client-serveur)
- [x] Mettre à jour le diagramme d'architecture globale
- [x] Créer un diagramme des composants principaux du serveur MCP
- [x] Créer un diagramme du flux de génération de backlog

### Phase 3: Rédaction des nouveaux documents
- [x] Rédiger `mcp-server-architecture.md`
- [x] Rédiger `markdown-generation.md` 
- [x] Mettre à jour `backlog-format.md`
- [x] Rédiger `mcp-integration.md`

### Phase 4: Mise à jour des guides existants
- [x] Mettre à jour le README principal avec références MCP
- [x] Mettre à jour `optimal-usage-guide.md` pour inclure les scénarios MCP
- [x] Mettre à jour `testing-guide.md` avec les tests MCP

### Phase 5: Finalisation
- [x] Vérifier les liens internes entre documents
- [x] Mettre à jour les dates de modification
- [x] Supprimer les documents obsolètes
- [x] Mettre à jour le CHANGELOG.md

## Priorités de mise à jour

1. **Haute priorité**:
   - Documentation d'architecture MCP
   - Diagrammes de flux MCP
   - Guide d'intégration MCP

2. **Priorité moyenne**:
   - Mise à jour des documents existants
   - Documentation de génération markdown

3. **Priorité basse**:
   - Suppression des documents obsolètes
   - Réorganisation fine de la structure
