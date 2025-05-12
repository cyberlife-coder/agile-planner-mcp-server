# Fichiers obsolètes à supprimer après migration complète

Ce document liste les fichiers qui deviendront obsolètes une fois la migration vers le pattern Strategy terminée. Ne supprimez ces fichiers qu'après avoir vérifié que toutes les fonctionnalités ont été correctement migrées et que tous les tests passent.

## Tests redondants

Ces fichiers de test sont redondants avec les nouveaux tests spécifiques aux validateurs :

- `tests/schema-validator.test.js` - Remplacé par les tests spécifiques à chaque validateur
- `tests/isolated/schema-validator.test.js` - Remplacé par les tests spécifiques à chaque validateur

## Fichiers temporaires

Ces fichiers ont été créés temporairement pendant la refactorisation et peuvent être supprimés :

- Tous les fichiers `.bak` et `.new` qui pourraient rester dans le projet

## Migration progressive

Pour garantir une transition en douceur, suivez ces étapes :

1. Migrez progressivement les appels à l'ancien validateur vers la nouvelle Factory
2. Exécutez tous les tests pour vérifier que tout fonctionne correctement
3. Supprimez les fichiers obsolètes listés dans ce document
4. Mettez à jour la documentation et les exemples

## Vérification avant suppression

Avant de supprimer un fichier, assurez-vous que :

- Toutes les fonctionnalités ont été migrées vers la nouvelle architecture
- Tous les tests passent avec la nouvelle implémentation
- Aucune régression n'a été introduite

## Fichiers à conserver

Ces fichiers doivent être conservés même après la migration :

- `server/lib/utils/validators/` - Tous les fichiers dans ce dossier (nouvelle implémentation)
- `tests/isolated/user-story-validator.test.js`, `tests/isolated/feature-validator.test.js`, etc. - Tests spécifiques à chaque validateur
- `examples/validators-usage.js` et `examples/migration-example.js` - Exemples d'utilisation de la nouvelle Factory
