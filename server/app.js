// Express server pour Agile Planner MCP Server
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();

// Charger le schéma OpenAPI YAML
const openapiDocument = YAML.load(path.join(__dirname, '../openapi/openapi.yaml'));

// Exposer la documentation interactive sur /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

// Endpoint MCP minimal (à compléter selon les besoins réels)
app.post('/mcp/generateBacklog', express.json(), (req, res) => {
  // TODO: Appeler la logique réelle de génération
  res.json({ backlog: {}, status: 'success' });
});

app.post('/mcp/generateFeature', express.json(), (req, res) => {
  // TODO: Appeler la logique réelle de génération
  res.json({ feature: {}, status: 'success' });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API MCP Server running on http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});
