/**
 * Implémentation simplifiée d'un serveur MCP pour éviter les problèmes d'importation
 * avec le SDK officiel.
 */
const chalk = require('chalk');

// Correction multiplateforme :
// Écriture stricte en UTF-8 sur STDOUT pour Node (Windows/Mac/Linux)
// Utilise Buffer.from(...).toString('utf8') pour garantir l'encodage
function safeWriteJSON(obj) {
  const json = JSON.stringify(obj);
  // Écrit le buffer UTF-8 directement, sans passer par des conversions locales
  process.stdout.write(Buffer.from(json + '\n', 'utf8'));
}

// Compatibilité Node < v0.12 et suppression du doublon
if (process.stdout.setDefaultEncoding) {
  process.stdout.setDefaultEncoding('utf8');
}

class StdioServerTransport {
  constructor() {
    this.handlers = {
      message: null
    };
    
    // Debug - rediriger vers STDERR
    process.stderr.write('Transport STDIO initialisé\n');
    
    // Configuration des flux d'entrée/sortie
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (data) => {
      try {
        const messageStr = data.toString().trim();
        process.stderr.write(`Message reçu (${messageStr.length} caractères): ${messageStr.substring(0, 100)}...\n`);
        
        if (this.handlers.message) {
          this.handlers.message(messageStr);
        } else {
          // Log explicite si aucun gestionnaire de message n'est enregistré
          process.stderr.write('⚠️ Aucun gestionnaire de message enregistré\n');
        }
      } catch (error) {
        process.stderr.write(`Erreur lors du traitement du message entrant: ${error.message}\n`);
      }
    });
    
    process.stdin.on('error', (error) => {
      process.stderr.write(`Erreur sur stdin: ${error.message}\n`);
    });
    
    process.stdin.on('end', () => {
      process.stderr.write('Stream stdin terminé - Gardez le processus en vie pour les prochaines commandes\n');
      // Ne PAS terminer le processus, restez en écoute
    });
    
    // S'assurer que le processus ne se termine pas immédiatement
    process.stdin.resume();
  }
  
  onMessage(handler) {
    process.stderr.write('Gestionnaire de message enregistré\n');
    this.handlers.message = handler;
    return this;
  }
  
  sendMessage(message) {
    try {
      // Sérialiser le message en JSON
      const messageStr = JSON.stringify(message);
      
      // CRITIQUE: Écrire uniquement le JSON sur stdout, sans logs ni rien d'autre
      // Pas de log avant cette ligne - c'est CRUCIAL
      safeWriteJSON(message);
      
      // Attendre suffisamment longtemps que stdout soit envoyé avant de logger sur stderr
      setTimeout(() => {
        // Utilise Buffer.byteLength pour afficher la taille réelle du message envoyé
        process.stderr.write(`Message envoyé (${Buffer.byteLength(messageStr, 'utf8')} octets)\n`);
      }, 100); // Délai plus long pour éviter toute interférence
    } catch (error) {
      // Logger uniquement sur stderr en cas d'erreur
      process.stderr.write(`Erreur d'envoi: ${error.message}\n`);
    }
  }
}

class MCPServer {
  constructor(options) {
    this.namespace = options.namespace;
    this.tools = options.tools || [];
    this.transport = null;
    
    process.stderr.write(`Serveur MCP '${this.namespace}' créé avec ${this.tools.length} outil(s)\n`);
  }
  
  listen(transport) {
    this.transport = transport;
    
    process.stderr.write('Enregistrement du gestionnaire de messages...\n');
    transport.onMessage((messageStr) => {
      try {
        const message = JSON.parse(messageStr);
        process.stderr.write(`Message traité de type: ${message.type}\n`);
        
        // Supporter à la fois 'init' et 'initialize' pour une meilleure compatibilité
        if (message.type === 'initialize' || message.type === 'init') {
          this.handleInitialize();
        } else if (message.type === 'invoke') {
          this.handleInvoke(message.id, message.name, message.params);
        } else {
          process.stderr.write(`Type de message inconnu: ${message.type} - Ignoré\n`);
          // Ne rien faire pour les types inconnus, juste ignorer
        }
      } catch (error) {
        process.stderr.write(`Erreur lors du traitement du message: ${error.message}\n`);
        
        // Gérer l'erreur proprement et envoyer une réponse d'erreur si possible
        try {
          // Seulement envoyer l'erreur si on a un ID valide dans le message
          if (messageStr && messageStr.length > 0) {
            const parsedMsg = JSON.parse(messageStr);
            if (parsedMsg && parsedMsg.id) {
              this.transport.sendMessage({
                type: 'error',
                id: parsedMsg.id,
                error: {
                  message: error.message || 'Erreur de parsing du message'
                }
              });
            }
          }
        } catch (parseError) {
          // Format invalide, impossible d'extraire un ID - ne pas envoyer d'erreur
          process.stderr.write(`Impossible de parser le message pour extraire un ID: ${parseError.message}\n`);
        }
      }
    });
    
    process.stderr.write(`Serveur MCP '${this.namespace}' en écoute...\n`);
    
    // Envoi d'un message de disponibilité (ready)
    this.transport.sendMessage({
      type: 'ready',
      namespace: this.namespace
    });
    
    // Garder le processus en vie explicitement
    setInterval(() => {}, 1000);
  }
  
  handleInitialize() {
    process.stderr.write('Traitement de la requête d\'initialisation...\n');
    
    const toolDefinitions = this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
    
    process.stderr.write(`Envoi de la réponse d'initialisation avec ${toolDefinitions.length} outil(s)\n`);
    
    this.transport.sendMessage({
      type: 'initialize_response',
      namespace: this.namespace,
      tools: toolDefinitions
    });
    
    process.stderr.write('Initialisation terminée avec succès\n');
  }
  
  async handleInvoke(id, name, params) {
    process.stderr.write(`Traitement de l'invocation de l'outil '${name}' avec id '${id}'\n`);
    
    const tool = this.tools.find(t => t.name === name);
    
    if (!tool) {
      process.stderr.write(`Outil '${name}' non trouvé\n`);
      this.transport.sendMessage({
        type: 'invoke_error',
        id,
        error: {
          message: `Outil '${name}' non trouvé`
        }
      });
      return;
    }
    
    try {
      process.stderr.write(`Exécution de l'outil '${name}'...\n`);
      const result = await tool.handler(params);
      
      process.stderr.write(`Envoi du résultat de l'outil '${name}'\n`);
      this.transport.sendMessage({
        type: 'invoke_response',
        id,
        result
      });
      
      process.stderr.write(`Invocation de l'outil '${name}' terminée avec succès\n`);
    } catch (error) {
      // Log de l'erreur
      process.stderr.write(`Erreur lors de l'exécution de l'outil '${name}': ${error.message}\n`);
      
      // Renvoi de l'erreur au client en format MCP standard
      this.transport.sendMessage({
        type: 'invoke_error',
        id,
        error: {
          message: error.message || 'Erreur inconnue lors de l\'exécution'
        }
      });
    }
  }
}

module.exports = {
  MCPServer,
  StdioServerTransport
};
