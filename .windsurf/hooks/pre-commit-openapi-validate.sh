#!/bin/sh
# Hook pre-commit : Valide le schéma OpenAPI avant tout commit
# Bloque le commit si le schéma n'est pas valide

OPENAPI_FILE="openapi/openapi.yaml"

if ! command -v swagger-cli >/dev/null 2>&1; then
  echo "[HOOK] swagger-cli non trouvé. Installer avec : npm install -g swagger-cli"
  exit 1
fi

if [ ! -f "$OPENAPI_FILE" ]; then
  echo "[HOOK] Fichier $OPENAPI_FILE introuvable. Commit bloqué."
  exit 1
fi

swagger-cli validate "$OPENAPI_FILE"
if [ $? -ne 0 ]; then
  echo "[HOOK] Schéma OpenAPI invalide. Commit bloqué."
  exit 1
fi

echo "[HOOK] Schéma OpenAPI valide. Commit autorisé."
exit 0
