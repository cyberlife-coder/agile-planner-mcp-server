/**
 * Test manuel du mode MCP (stdio)
 */
const { spawn } = require('child_process');

// Requête d'initialisation MCP
const initRequest = {
  jsonrpc: '2.0',
  id: 'test-init',
  method: 'initialize',
  params: {
    protocolVersion: '2025-01'
  }
};

// Requête de liste des outils
const toolsListRequest = {
  jsonrpc: '2.0',
  id: 'test-tools',
  method: 'tools/list',
  params: {}
};

// Fonction pour exécuter un test MCP
function testMcp(jsonRequest) {
  return new Promise((resolve) => {
    console.log(`\n=============================================`);
    console.log(`🧪 Test MCP: ${jsonRequest.method}`);
    console.log(`=============================================\n`);
    
    const mcpProcess = spawn('node', ['server/index.js'], {
      env: {
        ...process.env,
        MCP_EXECUTION: 'true'
      }
    });
    
    let responseData = '';
    
    mcpProcess.stdout.on('data', (data) => {
      responseData += data.toString();
    });
    
    mcpProcess.stderr.on('data', (data) => {
      console.log('STDERR:', data.toString());
    });
    
    mcpProcess.on('close', () => {
      console.log('MCP RESPONSE:');
      console.log(responseData);
      
      try {
        const jsonResponse = JSON.parse(responseData);
        console.log('\n✅ Test réussi - Réponse JSON valide\n');
        if (jsonResponse.result && jsonResponse.result.tools) {
          console.log(`Outils disponibles: ${jsonResponse.result.tools.map(t => t.name).join(', ')}`);
        }
      } catch (error) {
        console.log('\n❌ Test échoué - Réponse JSON invalide\n');
        console.error(error.message);
      }
      
      resolve();
    });
    
    // Envoyer la requête
    mcpProcess.stdin.write(JSON.stringify(jsonRequest));
    mcpProcess.stdin.end();
  });
}

// Exécuter les tests en séquence
async function runTests() {
  try {
    await testMcp(initRequest);
    await testMcp(toolsListRequest);
    console.log('\n🎉 Tests MCP terminés\n');
  } catch (error) {
    console.error('❌ Erreur pendant les tests:', error);
  }
}

runTests();
