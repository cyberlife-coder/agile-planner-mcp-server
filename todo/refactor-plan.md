# Refactor Plan: Réduction de la complexité cognitive de generateBacklog

## Fichier concerné
- `server/lib/backlog-generator.js` (fonction `generateBacklog` ligne 418)

## Objectif
Réduire la complexité cognitive (>26) sous le seuil de 15, en respectant les règles Wave 8 :
- max 50 lignes/fonction
- 1 responsabilité/fonction
- TDD systématique
- Documentation et découpage clair

---

## Plan détaillé (10 étapes, checklist)

- [ ] **1. Analyse de la fonction et de ses responsabilités**
  - Cartographier chaque bloc logique (validation, API, harmonisation, gestion erreurs)
- [ ] **2. Cartographie des branches et imbrications**
  - Identifier tous les if/for/try/catch et leurs responsabilités
- [ ] **3. Découpage en responsabilités atomiques**
  - Proposer des sous-fonctions : param processing, message building, model selection, backlog generation, harmonisation, gestion d’erreur
- [ ] **4. Préparation des tests unitaires (TDD)**
  - Écrire des tests pour chaque sous-fonction à extraire (mock API, cas d’erreur, harmonisation)
- [ ] **5. Extraction de processBacklogParams et validation**
  - Extraire la validation des paramètres
- [ ] **6. Extraction de createApiMessages, determineModel, createBacklogSchema**
  - Extraire la construction des messages, du modèle, du schéma
- [ ] **7. Extraction de attemptBacklogGeneration**
  - Extraire la logique d’appel API + gestion des retours
- [ ] **8. Extraction de l’harmonisation des stories**
  - Extraire le for imbriqué sur epics/features/stories en fonction dédiée
- [ ] **9. Extraction et centralisation de la gestion d’erreur**
  - Unifier la gestion des erreurs dans une fonction utilitaire
- [ ] **10. Mise à jour de la doc, du changelog, et suppression du plan**
  - Mettre à jour README, CHANGELOG, incrémenter la version, supprimer ce fichier une fois la refacto terminée

---

## Justification
La fonction actuelle mélange trop de responsabilités (validation, appel API, harmonisation, gestion d’erreur), ce qui nuit à la lisibilité, à la testabilité et à la maintenabilité. Le découpage proposé permet de garantir la robustesse, la clarté et la conformité aux standards Wave 8.

---

## Suivi (cocher chaque étape terminée)

- [ ] 1. Analyse de la fonction et de ses responsabilités
- [ ] 2. Cartographie des branches et imbrications
- [ ] 3. Découpage en responsabilités atomiques
- [ ] 4. Préparation des tests unitaires (TDD)
- [ ] 5. Extraction de processBacklogParams et validation
- [ ] 6. Extraction de createApiMessages, determineModel, createBacklogSchema
- [ ] 7. Extraction de attemptBacklogGeneration
- [ ] 8. Extraction de l’harmonisation des stories
- [ ] 9. Extraction et centralisation de la gestion d’erreur
- [ ] 10. Mise à jour de la doc, du changelog, suppression du plan
