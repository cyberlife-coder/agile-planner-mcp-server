FROM node:18-alpine

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY .env.template ./.env.template

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY server ./server
COPY README.md ./

# Créer les dossiers nécessaires et rendre le script exécutable
RUN mkdir -p mvp iterations && \
    chmod +x ./server/index.js

# Exposer le port (à des fins de documentation, pas nécessaire pour un serveur stdio)
EXPOSE 8080

# Point d'entrée - exécute le script en mode CLI par défaut
ENTRYPOINT ["node", "server/index.js"]
