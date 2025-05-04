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
    
    // Correction : traiter chaque message MCP par ligne
    let buffer = '';
    process.stdin.on('data', (data) => {
      buffer += data;
      let lines = buffer.split('\n');
      buffer = lines.pop(); // Garder la dernière ligne incomplète
      for (const line of lines) {
        const messageStr = line.trim();
        if (!messageStr) continue;
        try {
          process.stderr.write(`Message reçu (${messageStr.length} caractères): ${messageStr.substring(0, 100)}...\n`);
          this.handlers.message?.(messageStr);
        } catch (error) {
          process.stderr.write(`Erreur lors du traitement du message entrant: ${error.message}\n`);
        }
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
        process.stderr.write(`Message reçu (méthode): ${message.method}\n`);
        
        if (message.method === 'initialize') {
          const id = message.id;
          process.stderr.write(`Initialize request id: ${id}\n`);
          // Build a spec-compliant initialize result
          const result = {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: this.namespace,
              version: '1.0.0'
            }
          };
          this.transport.sendMessage({ jsonrpc: '2.0', id, result });
          process.stderr.write(`Initialize response sent for id: ${id}\n`);
        } else if (message.method === 'tools/list') {
          const id = message.id;
          const toolsDesc = this.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }));
          this.transport.sendMessage({ jsonrpc: '2.0', id, result: { tools: toolsDesc } });
        } else if (message.method === 'tools/call') {
          const { name, arguments: args } = message.params || {};
          this.handleInvoke(message.id, name, args);
        } else if (this.tools.some(tool => tool.name === message.method)) {
          // Legacy direct-call fallback for older clients
          this.handleInvoke(message.id, message.method, message.params);
        } else {
          process.stderr.write(`Méthode inconnue: ${message.method} - Ignoré\n`);
        }
      } catch (error) {
        // Log de l'erreur
        process.stderr.write(`Erreur lors du traitement du message: ${error.message}\n`);
        
        // Gérer l'erreur proprement et envoyer une réponse d'erreur si possible
        try {
          // Seulement envoyer l'erreur si on a un ID valide dans le message
          if (messageStr && messageStr.length > 0) {
            const parsedMsg = JSON.parse(messageStr);
            if (parsedMsg && parsedMsg.id) {
              this.transport.sendMessage({ jsonrpc: '2.0', id: parsedMsg.id, error: { code: -32700, message: error.message || 'Parse error' } });
            }
          }
        } catch (parseError) {
          // Format invalide, impossible d'extraire un ID - ne pas envoyer d'erreur
          process.stderr.write(`Impossible de parser le message pour extraire un ID: ${parseError.message}\n`);
        }
      }
    });
    
    process.stderr.write(`Serveur MCP '${this.namespace}' en écoute...\n`);
    
    // Garder le processus en vie explicitement
    setInterval(() => {}, 1000);
  }
  
  async handleInvoke(id, name, params) {
    process.stderr.write(`Traitement de l'invocation de l'outil '${name}' avec id '${id}'\n`);
    
    const tool = this.tools.find(t => t.name === name);
    
    if (!tool) {
      process.stderr.write(`Outil '${name}' non trouvé\n`);
      this.transport.sendMessage({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${name}` } });
      return;
    }
    
    try {
      process.stderr.write(`Exécution de l'outil '${name}'...\n`);
      const result = await tool.handler(params);
      
      process.stderr.write(`Envoi du résultat de l'outil '${name}'\n`);
      this.transport.sendMessage({ jsonrpc: '2.0', id, result });
      
      process.stderr.write(`Invocation de l'outil '${name}' terminée avec succès\n`);
    } catch (error) {
      // Log de l'erreur
      process.stderr.write(`Erreur lors de l'exécution de l'outil '${name}': ${error.message}\n`);
      
      // Renvoi de l'erreur au client en format MCP standard
      this.transport.sendMessage({ jsonrpc: '2.0', id, error: { code: -32000, message: error.message || 'Internal error' } });
    }
  }
}

// Définition des outils disponibles pour le serveur MCP
const tools = {
  generateBacklog: async (params) => {
    try {
      // Le vrai générateur de backlog
      const result = await backlogGenerator.generateBacklog(params.project, params.model || 'claude-3-haiku-20240307');
      return {
        success: true,
        result
      };
    } catch (error) {
      // Gestion des erreurs
      process.stderr.write(`Erreur lors de la génération du backlog: ${error.message}\n`);
      return {
        success: false,
        error: {
          message: error.message || 'Erreur inconnue lors de la génération du backlog'
        }
      };
    }
  }
};

module.exports = {
  MCPServer,
  StdioServerTransport
};
