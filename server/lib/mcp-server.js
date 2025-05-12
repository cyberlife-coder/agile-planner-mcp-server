/**
 * Implémentation simplifiée d'un serveur MCP pour éviter les problèmes d'importation
 * avec le SDK officiel.
 * 
 * Conformité stricte avec la spécification MCP:
 * - Réponse initialize: uniquement { protocolVersion, capabilities, serverInfo }
 * - Pas de notification initialized côté serveur
 * - tools/list retourne la liste avec inputSchema (pas parameters)
 * - Toutes les erreurs suivent le format JSON-RPC standard
 * - stdin/stdout uniquement pour JSON-RPC, stderr pour les erreurs, console.log pour les logs d'information
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

// Variable globale pour empêcher le processus de se terminer
let keepAliveInterval = null;

// Function to clean up resources and allow process to exit
function cleanupMcpServer() {
  console.log('Cleaning up MCP server resources...');
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('Cleared keepAliveInterval');
  }
}

// Fonction utilitaire pour forcer le nettoyage des références OpenAI
function forceOpenAiClientCleanup() {
  console.log('MCP-SERVER: Tentative de nettoyage des références OpenAI globales');
  try {
    // Nettoyer les références globales qui pourraient avoir été créées
    for (let key in global) {
      if (key.includes('openai') || key.includes('api') || key.includes('client')) {
        console.log(`MCP-SERVER: Nettoyage référence globale: ${key}`);
        global[key] = null;
      }
    }
    
    // Si nous sommes en mode test, forcer la GC si disponible
    if (process.env.AGILE_PLANNER_TEST_MODE === 'true' && global.gc) {
      console.log('MCP-SERVER: Forçage de la garbage collection');
      global.gc();
    }
  } catch (err) {
    console.error('MCP-SERVER: Erreur pendant le nettoyage:', err);
  }
}

class StdioServerTransport {
  constructor() {
    this.handlers = {
      message: null
    };
    
    // Debug - rediriger vers console.log
    console.log('Transport STDIO initialisé');
    
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
          console.log(`Message reçu (${messageStr.length} caractères): ${messageStr.substring(0, 100)}...`);
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
      console.log('Stream stdin terminé - Nettoyage des ressources en cours...');
      // Dans un test E2E, stdin.end() indique la fin de la communication,
      // donc nous devrions permettre au processus de se terminer naturellement
      // en nettoyant les ressources qui le maintiennent en vie
      
      // Vérifier si nous sommes en mode test
      const isTestMode = process.env.AGILE_PLANNER_TEST_MODE === 'true';
      if (isTestMode) {
        console.log('MCP-SERVER: Mode test détecté, nettoyage agressif');
        
        // Nettoyage immédiat pour les modes test
        cleanupMcpServer();
        
        // Forcer le nettoyage des références OpenAI
        forceOpenAiClientCleanup();
        
        // Arrêt immédiat du processus en mode test
        console.log('MCP-SERVER: Arrêt immédiat du processus en mode test');
        process.exit(0);
      } else {
        // Délai court pour permettre à d'autres gestionnaires d'événements de terminer
        setTimeout(() => {
          cleanupMcpServer();
          // Terminer le processus explicitement après un court délai
          // pour permettre aux données stdout de se vider
          setTimeout(() => {
            console.log('Fin du test MCP - Arrêt du processus');
            process.exit(0);
          }, 100);
        }, 100);
      }
    });
    
    process.on('SIGINT', () => {
      console.log('Signal SIGINT reçu - Nettoyage des ressources');
      cleanupMcpServer();
      process.exit(0);
    });
    
    // CRUCIAL: S'assurer que le processus ne se termine jamais pendant le traitement actif
    process.stdin.resume();
    
    // AJOUT: Garder le processus en vie pendant les commandes actives
    if (!keepAliveInterval) {
      keepAliveInterval = setInterval(() => {
        console.log(chalk.blue('MCP KeepAlive - Serveur actif'));
      }, 30000); // Log toutes les 30 secondes pour montrer que le serveur est toujours actif
    }
  }
  
  onMessage(handler) {
    console.log('Gestionnaire de message enregistré');
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
        console.log(`Message envoyé (${Buffer.byteLength(messageStr, 'utf8')} octets)`);
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
    
    console.log(`Serveur MCP '${this.namespace}' créé avec ${this.tools.length} outil(s)`);
  }
  
  /**
   * Gère la méthode d'initialisation MCP
   * @param {Object} message - Message d'initialisation
   * @private
   */
  _handleInitialize(message) {
    this.transport.sendMessage({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '0.1.0',
        capabilities: {
          // Pas de capacités spéciales à déclarer
        },
        serverInfo: {
          name: this.namespace,
          vendor: 'windsurf-agile-planner',
          version: '1.0.0',
        }
      }
    });
    // Pas d'envoi de notification 'initialized' pour se conformer à la spécification
  }
  
  /**
   * Gère la demande de liste d'outils
   * @param {Object} message - Message de demande
   * @private
   */
  _handleToolsList(message) {
    this.transport.sendMessage({
      jsonrpc: '2.0',
      id: message.id,
      result: this.tools.map(tool => {
        // Ne garder que le nom et le schéma pour la conformité MCP
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
          // Note: pas de parameters ici pour la conformité avec MCP
        };
      })
    });
  }
  
  /**
   * Gère une méthode non reconnue
   * @param {Object} message - Message avec méthode inconnue
   * @private
   */
  _handleUnknownMethod(message) {
    console.log(`Méthode non reconnue: ${message.method}`);
    this.transport.sendMessage({
      jsonrpc: '2.0',
      id: message.id,
      error: { 
        code: -32601, 
        message: `Method not found: ${message.method}` 
      } 
    });
  }
  
  /**
   * Gère les erreurs de parsing du message
   * @param {string} messageStr - Message brut
   * @param {Error} error - Erreur générée
   * @private
   */
  _handleParseError(messageStr, error) {
    // Log de l'erreur
    process.stderr.write(`Erreur lors du traitement du message: ${error.message}\n`);
    
    try {
      // Seulement envoyer l'erreur si on a un ID valide dans le message
      if (messageStr && messageStr.length > 0) {
        const parsedMsg = JSON.parse(messageStr);
        if (parsedMsg?.id) {
          // Erreur au format JSON-RPC standard
          this.transport.sendMessage({ 
            jsonrpc: '2.0', 
            id: parsedMsg.id, 
            error: { 
              code: -32700, 
              message: error.message || 'Parse error' 
            } 
          });
        }
      }
    } catch (parseError) {
      // Format invalide, impossible d'extraire un ID - ne pas envoyer d'erreur
      process.stderr.write(`Impossible de parser le message pour extraire un ID: ${parseError.message}\n`);
    }
  }
  
  /**
   * Écoute des messages via le transport spécifié
   * @param {Object} transport - Transport pour la communication
   */
  listen(transport) {
    if (!transport) {
      throw new Error('Transport requis pour MCPServer.listen()');
    }
    this.transport = transport;
    
    // Configuration du traitement des messages
    this.transport.onMessage(async (messageStr) => {
      try {
        const message = JSON.parse(messageStr);
        console.log(`Message traité: ${message.method || 'sans method'} (id: ${message.id || 'sans id'})`);
        
        if (message.method === 'initialize') {
          this._handleInitialize(message);
        } 
        else if (message.method === 'tools/list') {
          this._handleToolsList(message);
        } 
        else if (message.method === 'tools/invoke') {
          // Vérification des paramètres
          if (!message.params) {
            this.transport.sendMessage({
              jsonrpc: '2.0',
              id: message.id,
              error: {
                code: -32602,
                message: 'Invalid params'
              }
            });
            return;
          }
          
          const { name, params } = message.params;
          
          if (!name) {
            this.transport.sendMessage({
              jsonrpc: '2.0',
              id: message.id,
              error: {
                code: -32602,
                message: 'Missing tool name'
              }
            });
            return;
          }
          
          await this.handleInvoke(message.id, name, params || {});
        } 
        else {
          this._handleUnknownMethod(message);
        }
      } catch (error) {
        this._handleParseError(messageStr, error);
      }
      
      // En mode test, s'assurer que nous nettoyons après chaque requête
      if (process.env.AGILE_PLANNER_TEST_MODE === 'true') {
        console.log('MCP-SERVER: Requête traitée en mode test, préparation du nettoyage');
        // Nettoyer les références OpenAI après un court délai
        setTimeout(() => {
          console.log('MCP-SERVER: Nettoyage proactif des références API');
          forceOpenAiClientCleanup();
        }, 200);
      }
    });
    
    console.log(`Serveur MCP '${this.namespace}' en écoute...`);
    
    // Vérifier si nous avons déjà un keepAliveInterval, sinon en créer un
    // pour la durée de cette session seulement
    if (!keepAliveInterval) {
      console.log('Créer un nouvel intervalle pour maintenir le processus actif');
      keepAliveInterval = setInterval(() => {}, 1000);
    }
  }
  
  /**
   * Traite l'erreur d'outil non trouvé
   * @param {string} id - Identifiant de l'invocation
   * @param {string} name - Nom de l'outil non trouvé
   * @private
   */
  _handleToolNotFound(id, name) {
    console.log(`Outil '${name}' non trouvé`);
    this.transport.sendMessage({ 
      jsonrpc: '2.0', 
      id, 
      error: { 
        code: -32601, 
        message: `Method not found: ${name}` 
      } 
    });
  }

  /**
   * Envoie une réponse de succès pour l'invocation
   * @param {string} id - Identifiant de l'invocation
   * @param {string} name - Nom de l'outil
   * @param {any} result - Résultat de l'invocation
   * @private
   */
  _sendSuccessResponse(id, name, result) {
    console.log(`Envoi du résultat de l'outil '${name}'`);
    this.transport.sendMessage({ jsonrpc: '2.0', id, result });
    console.log(`Invocation de l'outil '${name}' terminée avec succès`);
  }

  /**
   * Gère les erreurs d'exécution d'outil
   * @param {string} id - Identifiant de l'invocation
   * @param {string} name - Nom de l'outil
   * @param {Error} error - Erreur survenue
   * @private
   */
  _handleToolExecutionError(id, name, error) {
    // Log de l'erreur
    process.stderr.write(`Erreur lors de l'exécution de l'outil '${name}': ${error.message}\n`);
    
    // Renvoi de l'erreur au client en format MCP standard JSON-RPC
    this.transport.sendMessage({ 
      jsonrpc: '2.0', 
      id, 
      error: { 
        code: -32000, 
        message: error.message || 'Internal error' 
      } 
    });
  }

  /**
   * Gère une invocation d'outil
   * @param {string} id - Identifiant de l'invocation
   * @param {string} name - Nom de l'outil à invoquer
   * @param {Object} params - Paramètres de l'invocation
   */
  async handleInvoke(id, name, params) {
    console.log(`Traitement de l'invocation de l'outil '${name}' avec id '${id}'`);
    
    // Recherche de l'outil dans la liste des outils disponibles
    const tool = this.tools.find(t => t.name === name);
    
    // Si l'outil n'est pas trouvé, envoyer une erreur
    if (!tool) {
      this._handleToolNotFound(id, name);
      return;
    }
    
    try {
      // Exécution de l'outil avec les paramètres fournis
      console.log(`Exécution de l'outil '${name}'...`);
      const result = await tool.handler(params);
      
      // Envoi de la réponse au client
      this._sendSuccessResponse(id, name, result);
    } catch (error) {
      // Gestion des erreurs d'exécution
      this._handleToolExecutionError(id, name, error);
    }
  }
}

// Note: La fonction backlogGeneratorTool a été supprimée car non utilisée

module.exports = {
  MCPServer,
  StdioServerTransport
};
