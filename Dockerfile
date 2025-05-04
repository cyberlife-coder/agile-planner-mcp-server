FROM node:18-alpine

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY .env.template ./server/.env.template

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source et les fichiers de documentation
COPY server ./server
COPY README.md ./
COPY README-EN.MD ./
COPY LICENSE ./

# Créer les dossiers nécessaires et rendre le script exécutable
RUN mkdir -p .agile-planner-backlog && \
    chmod +x ./server/index.js

# Variables d'environnement par défaut
ENV MCP_EXECUTION=false
ENV AGILE_PLANNER_OUTPUT_ROOT=/app/.agile-planner-backlog

# Exposer le port (à des fins de documentation, pas nécessaire pour un serveur stdio)
EXPOSE 8080

# Point d'entrée avec possibilité de passer en mode MCP ou CLI
ENTRYPOINT ["node", "server/index.js"]
