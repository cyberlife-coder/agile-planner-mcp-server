#!/bin/bash
#
# Hook pre-commit pour vérifier la structure RULE 3
# À installer dans .git/hooks/pre-commit
# Ce script sera exécuté avant chaque commit pour s'assurer que la structure RULE 3 est respectée.
#
# TDD Wave 8 - RULE 6 - Qualité & CI Automatique

echo "🔍 Vérification de la structure RULE 3..."

# Exécuter le script de vérification de structure
node scripts/verify-rule3-structure.js

# Vérifier le résultat
if [ $? -ne 0 ]; then
  echo "❌ La structure RULE 3 n'est pas respectée. Le commit est annulé."
  echo "Veuillez exécuter 'node scripts/verify-rule3-structure.js' pour corriger la structure."
  exit 1
fi

echo "✅ La structure RULE 3 est correcte."
exit 0
