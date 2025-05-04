const { initializeClient, generateBacklog } = require('../server/lib/backlog-generator');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

// Load sample backlog for tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

// No text normalization needed anymore

describe('Backlog Generator', () => {
  describe('initializeClient', () => {
    test('Initializes OpenAI client when OpenAI key is provided', () => {
      const client = initializeClient('fake-openai-key', null);
      expect(client).toBeDefined();
      expect(client.apiKey).toBe('fake-openai-key');
      expect(client.baseURL).toMatch(/openai\.com/);
    });
    
    test('Initializes GROQ client when GROQ key is provided', () => {
      const client = initializeClient(null, 'fake-groq-key');
      expect(client).toBeDefined();
      expect(client.apiKey).toBe('fake-groq-key');
      expect(client.baseURL).toBe('https://api.groq.com/openai/v1');
    });
    
    test('Prioritizes OpenAI key when both are provided', () => {
      const client = initializeClient('fake-openai-key', 'fake-groq-key');
      expect(client).toBeDefined();
      expect(client.apiKey).toBe('fake-openai-key');
      expect(client.baseURL).toMatch(/openai\.com/);
    });
    
    test('Throws an error when no key is provided', () => {
      expect(() => {
        initializeClient(null, null);
      }).toThrow('No API key provided for OpenAI or GROQ');
    });
  });
  
  describe('generateBacklog', () => {
    let mockClient;
    
    beforeEach(() => {
      // Create a mock for the OpenAI client
      mockClient = {
        chat: {
          completions: {
            create: sinon.stub().resolves({
              choices: [
                {
                  message: {
                    content: JSON.stringify(sampleBacklog)
                  }
                }
              ]
            })
          }
        }
      };
    });
    
    test('Correctly generates a backlog from a project description', async () => {
      const projectDescription = 'Creating a library management system';
      
      // Call the generateBacklog function with our mock
      const result = await generateBacklog(projectDescription, mockClient);
      
      // Verify that the function was called with the correct parameters
      expect(mockClient.chat.completions.create.calledOnce).toBe(true);
      
      // Verify that the result is well structured
      expect(result).toHaveProperty('epic');
      expect(result).toHaveProperty('mvp');
      expect(result).toHaveProperty('iterations');
      
      // Verify basic structural properties match sample backlog
      expect(result.epic.title).toBe(sampleBacklog.epic.title);
      expect(result.mvp.length).toBe(sampleBacklog.mvp.length);
      expect(result.iterations.length).toBe(sampleBacklog.iterations.length);
    });
    
    test('Correctly handles API errors', async () => {
      // Configure mock to simulate an error
      mockClient.chat.completions.create.rejects(new Error('API Error'));
      
      const projectDescription = 'Creating a library management system';
      
      // Verify that the error is propagated
      await expect(generateBacklog(projectDescription, mockClient)).rejects.toThrow('API Error');
    });
  });
});
