# Tests Isolés pour Agile Planner MCP (v1.3.0)

Ce répertoire contient des tests unitaires isolés pour les différentes fonctionnalités d'Agile Planner MCP. Ces tests sont conçus pour être exécutés indépendamment du reste de la suite de tests, permettant un développement et un débogage plus rapides.

## Avantages des tests isolés

- **Exécution plus rapide** : Les tests isolés s'exécutent plus rapidement car ils ne dépendent pas de l'ensemble de l'environnement de test
- **Débogage simplifié** : Plus facile d'identifier où se situent les problèmes
- **Développement TDD** : Facilite le développement piloté par les tests
- **Tests unitaires purs** : Se concentre sur une seule fonctionnalité à la fois

## Tests disponibles

| Fichier | Description |
|---------|-------------|
| `format-user-story.test.js` | Tests pour la fonction de formatage des user stories |
| `markdown-formatting.test.js` | Tests généraux pour le formatage markdown |

## Exécution des tests

```bash
# Exécuter tous les tests isolés
npm run test:isolated

# Exécuter uniquement les tests de formatage des user stories
npm run test:user-story

# Exécuter uniquement les tests de formatage markdown
npm run test:markdown
```

## Bonnes pratiques pour les tests isolés

1. **Indépendance** : Chaque test doit pouvoir s'exécuter indépendamment des autres
2. **Rapidité** : Les tests doivent s'exécuter rapidement
3. **Déterminisme** : Les tests doivent produire les mêmes résultats à chaque exécution
4. **Auto-vérification** : Les tests doivent déterminer automatiquement s'ils réussissent ou échouent
5. **Focalisation** : Chaque test doit se concentrer sur une seule fonctionnalité ou aspect

## Ajout de nouveaux tests isolés

Pour ajouter un nouveau test isolé :

1. Créez un fichier `.test.js` dans ce répertoire
2. Importez directement les fonctions à tester (sans mocker l'environnement complet)
3. Écrivez des tests simples et directs
4. Ajoutez un script dans `package.json` si nécessaire

---

Dernière mise à jour : Mai 2025
