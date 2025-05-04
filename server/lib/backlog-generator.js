const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Initializes the OpenAI or GROQ client based on available API key
 * @param {string} openaiKey - OpenAI API key
 * @param {string} groqKey - GROQ API key
 * @returns {OpenAI} Initialized client instance
 */
function initializeClient(openaiKey, groqKey) {
  if (openaiKey) {
    return new OpenAI({ apiKey: openaiKey });
  } else if (groqKey) {
    return new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
  } else {
    throw new Error('No API key provided for OpenAI or GROQ');
  }
}

/**
 * Generates a backlog from the project description
 * @param {string} project - Project description
 * @param {Object} client - Initialized OpenAI/GROQ client
 * @returns {Promise<Object>} Generated backlog in JSON format
 */
async function generateBacklog(project, client) {
  // No need for text normalization anymore
  
  // Build the optimized prompt for GPT-4o
  const messages = [
    {
      role: "system",
      content: `# ROLE
You are a Senior Agile Expert specialized in product backlog creation, with 15+ years of experience leading innovative digital projects. You excel in strategic decomposition of initiatives into actionable items according to agile best practices.

# TASK
Decompose the provided project into a complete, structured agile backlog ready for implementation.

# RESPONSE FORMAT
Respond ONLY with a valid JSON object following exactly this structure (without explanations, comments, or additional text):

\`\`\`json
{
  "epic": {
    "title": "Concise and impactful Epic title",
    "description": "Detailed description explaining the global vision, business impact and measurable objectives"
  },
  "mvp": [
    {
      "id": "US001",
      "title": "Precise, value-oriented User Story title",
      "description": "As a [specific persona], I want [precisely described feature], so that [measurable business benefit]",
      "acceptance_criteria": [
        "GIVEN [specific initial context], WHEN [specific action], THEN [verifiable expected result]",
        "GIVEN [other context], WHEN [action], THEN [result]"
      ],
      "tasks": [
        "Technical task 1 with action verb + expected result + quality criteria",
        "Technical task 2 (estimable between 2-8h of work)"
      ],
      "priority": "HIGH | MEDIUM | LOW"
    }
  ],
  "iterations": [
    {
      "name": "Iteration 1 - [Thematic focus]",
      "goal": "Measurable objective for this iteration",
      "stories": [
        {
          "id": "US005",
          "title": "User Story title",
          "description": "As a [persona], I want [feature], so that [benefit]",
          "acceptance_criteria": [
            "GIVEN [context], WHEN [action], THEN [result]"
          ],
          "tasks": [
            "Technical task 1",
            "Technical task 2"
          ],
          "priority": "HIGH | MEDIUM | LOW",
          "dependencies": ["US001"] 
        }
      ]
    }
  ]
}
\`\`\`

# QUALITY CRITERIA
1. <INVEST>: Each User Story must be Independent, Negotiable, Valuable, Estimable, Small enough and Testable
2. <PERSONAS>: Use specific and consistent personas (not generic "user")
3. <CRITERIA>: Exhaustive, testable and automatable acceptance criteria
4. <TASKS>: Precise, estimable and single-focus technical tasks
5. <PRIORITIZATION>: MVP contains only essential features
6. <CONSISTENCY>: Consistent business vocabulary throughout the backlog
7. <AMBITION>: Propose innovative but realistic solutions
8. <DEPENDENCIES>: Clearly identify dependencies between stories`
    },
    {
      role: "user",
      content: `# PROJECT DESCRIPTION
${project}

# EXPECTED DELIVERABLES
- A complete and ambitious backlog with:
  * A clear and strategic Epic
  * A defined MVP with 3-5 essential User Stories
  * 2-3 Future iterations with their User Stories
  * Precise Gherkin acceptance criteria
  * Detailed technical tasks

Produce a valid JSON that I can use directly.`
    }
  ];

  try {
    // Determine which model to use based on the client
    const isOpenAI = client.baseURL === undefined || client.baseURL.includes('openai.com');
    const model = isOpenAI ? "gpt-4o" : "llama3-70b-8192";

    // Call OpenAI/GROQ API with optimized parameters
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" },
      max_tokens: 8192
    });

    // Retrieve the response
    const content = completion.choices[0].message.content;
    const parsedContent = JSON.parse(content);
    
    // Return the parsed content (no text processing needed)
    return parsedContent;
  } catch (error) {
    console.error(chalk.red('Error generating backlog:'), error);
    throw error;
  }
}

module.exports = {
  initializeClient,
  generateBacklog
};
