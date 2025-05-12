/**
 * Express server pour Agile Planner MCP Server
 * Permet d'exposer les fonctionnalités via une API REST
 */
const express = require('express');
const path = require('path');

// Import du routeur MCP qui contient la logique métier
const mcpRouter = require('./lib/mcp-router');

// Gestion robuste des dépendances optionnelles
let swaggerUi, YAML;

/**
 * Charge une dépendance de façon sécurisée
 * @param {string} moduleName - Nom du module à charger
 * @returns {Object|null} - Module chargé ou null si erreur
 */
function safeRequire(moduleName) {
  try {
    return require(moduleName);
  } catch (error) {
    console.warn(`Module ${moduleName} non disponible: ${error.message}`);
    return null;
  }
}

// Charger les dépendances optionnelles
swaggerUi = safeRequire('swagger-ui-express');
YAML = safeRequire('yamljs');

// Afficher un message selon la disponibilité
if (swaggerUi && YAML) {
  console.log('Documentation Swagger UI disponible. Accès sur /api-docs.');
} else {
  console.warn('Swagger UI ou YAMLJS non disponibles. La documentation API ne sera pas exposée.');
  console.warn('Pour activer la documentation, exécutez: npm install swagger-ui-express yamljs --save');
}

const app = express();

// Charger et exposer la documentation OpenAPI si les dépendances sont disponibles
if (swaggerUi && YAML) {
  try {
    const openapiDocument = YAML.load(path.join(__dirname, '../openapi/openapi.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
    console.log('Documentation OpenAPI chargée avec succès.');
  } catch (error) {
    console.error('Erreur lors du chargement de la documentation OpenAPI:', error.message);
    // Ajouter une route informative en cas d'erreur de chargement
    app.get('/api-docs', (req, res) => {
      res.status(500).send('Documentation OpenAPI non disponible. Vérifiez le fichier openapi.yaml.');
    });
  }
}

// Middleware pour le parsing JSON des requêtes
app.use(express.json());

// Endpoint MCP pour générer un backlog
app.post('/mcp/generateBacklog', express.json(), async (req, res) => {
  try {
    console.log('Reçu une demande de génération de backlog:', req.body);
    
    // Adapter les paramètres HTTP pour le format attendu par le handler MCP
    const args = {
      projectName: req.body.projectName,
      projectDescription: req.body.projectDescription,
      outputPath: req.body.outputPath || '.agile-planner-backlog'
    };
    
    // Appeler la logique réelle de génération en réutilisant le handler MCP
    const result = await mcpRouter.handleToolsCall({
      params: {
        name: 'generateBacklog',
        arguments: args
      }
    });
    
    // Vérifier si une erreur est présente dans la réponse (format JSON-RPC)
    if (result.error) {
      return res.status(400).json({
        status: 'error',
        message: result.error.message,
        details: result.error.data
      });
    }
    
    // Renvoyer le résultat au format REST approprié
    res.json({
      status: 'success',
      backlog: result.result,
      outputPath: args.outputPath
    });
  } catch (error) {
    console.error('Erreur lors de la génération du backlog:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/mcp/generateFeature', express.json(), async (req, res) => {
  try {
    console.log('Reçu une demande de génération de fonctionnalité:', req.body);
    
    // Adapter les paramètres HTTP pour le format attendu par le handler MCP
    const args = {
      featureDescription: req.body.featureDescription,
      businessValue: req.body.businessValue,
      complexityLevel: req.body.complexityLevel,
      epicId: req.body.epicId,
      backlogDir: req.body.backlogDir || '.agile-planner-backlog',
      outputPath: req.body.outputPath || '.agile-planner-backlog'
    };
    
    // Appeler la logique réelle de génération en réutilisant le handler MCP
    const result = await mcpRouter.handleToolsCall({
      params: {
        name: 'generateFeature',
        arguments: args
      }
    });
    
    // Vérifier si une erreur est présente dans la réponse (format JSON-RPC)
    if (result.error) {
      return res.status(400).json({
        status: 'error',
        message: result.error.message,
        details: result.error.data
      });
    }
    
    // Renvoyer le résultat au format REST approprié
    res.json({
      status: 'success',
      feature: result.result,
      outputPath: args.outputPath
    });
  } catch (error) {
    console.error('Erreur lors de la génération de la fonctionnalité:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Ajouter un middleware pour gérer les erreurs
app.use((err, req, res, _next) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({
    status: 'error',
    message: 'Une erreur interne est survenue',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API MCP Server running on http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`Endpoints disponibles:
  - POST /mcp/generateBacklog
  - POST /mcp/generateFeature
  `); 
});
