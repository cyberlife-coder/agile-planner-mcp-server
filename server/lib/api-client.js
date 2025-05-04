/**
 * Module centralisé de gestion des clients API pour Agile Planner
 * Implémente un pattern Singleton pour l'accès aux clients OpenAI et Groq
 */

const { OpenAI } = require('openai');
const chalk = require('chalk');
const { ApiError } = require('./errors');

// Client API singleton
let client = null;
let provider = null;

/**
 * Gestionnaire centralisé des clients API
 */
module.exports = {
  /**
   * Initialise et/ou retourne le client API
   * @param {string} [preferredProvider='auto'] - Fournisseur préféré (openai, groq, auto)
   * @returns {Object} Client API (OpenAI ou Groq) initialisé
   * @throws {ApiError} Si aucune clé API n'est disponible
   */
  getClient(preferredProvider = 'auto') {
    // Si le client est déjà initialisé et qu'on ne force pas un provider spécifique
    if (client && (preferredProvider === 'auto' || preferredProvider === provider)) {
      return client;
    }
    
    // Déterminer le provider à utiliser
    provider = this._determineProvider(preferredProvider);
    
    // Initialiser le client selon le provider retenu
    return this._initializeClient(provider);
  },

  /**
   * Détermine le provider API à utiliser
   * @param {string} preferredProvider - Provider préféré ('auto', 'openai', 'groq')
   * @returns {string} Le provider à utiliser
   * @private
   */
  _determineProvider(preferredProvider) {
    // Si un provider spécifique est demandé
    if (preferredProvider !== 'auto') {
      if (preferredProvider === 'openai' && process.env.OPENAI_API_KEY) {
        return 'openai';
      }
      if (preferredProvider === 'groq' && process.env.GROQ_API_KEY) {
        return 'groq';
      }
      process.stderr.write(chalk.yellow(`[WARN] Le provider '${preferredProvider}' demandé n'est pas disponible. Utilisé le mode auto.\n`));
    }
    
    // En mode auto, utiliser le premier provider disponible
    if (process.env.OPENAI_API_KEY) {
      return 'openai';
    }
    if (process.env.GROQ_API_KEY) {
      return 'groq';
    }
    
    throw new ApiError('Aucune clé API disponible. Définissez OPENAI_API_KEY ou GROQ_API_KEY');
  },

  /**
   * Initialise le client API selon le provider
   * @param {string} provider - Le provider à utiliser
   * @returns {Object} Le client API initialisé
   * @private
   */
  _initializeClient(provider) {
    if (provider === 'openai') {
      client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      process.stderr.write(chalk.green(`[INFO] Client OpenAI initialisé\n`));
      return client;
    }
    
    if (provider === 'groq') {
      // Création d'un client Groq de base
      client = {
        chat: {
          completions: {
            create: async (params) => {
              // Simulation d'une API Groq pour le moment
              // À remplacer par l'implémentation réelle quand disponible
              const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
              });
              return response.json();
            }
          }
        }
      };
      process.stderr.write(chalk.green(`[INFO] Client Groq initialisé\n`));
      return client;
    }
    
    throw new ApiError(`Provider non supporté: ${provider}`);
  },
  
  /**
   * Retourne le provider actuellement utilisé
   * @returns {string|null} Le nom du provider ('openai', 'groq') ou null si aucun n'est initialisé
   */
  getCurrentProvider() {
    return provider;
  },
  
  /**
   * Réinitialise le client (utile pour les tests)
   */
  resetClient() {
    client = null;
    provider = null;
    process.stderr.write(chalk.blue(`[INFO] Client API réinitialisé\n`));
  }
};
