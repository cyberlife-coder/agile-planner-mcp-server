const nock = require('nock');

// Provide dummy API key so api-client selects OpenAI
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

// Mock the OpenAI chat completions endpoint
nock('https://api.openai.com')
  .post('/v1/chat/completions')
  .reply(200, {
    choices: [
      {
        message: {
          content: JSON.stringify({
            projectName: 'Mock Project',
            projectDescription: 'Mock Description',
            epics: [],
            orphan_stories: []
          })
        }
      }
    ]
  })
  .persist();
