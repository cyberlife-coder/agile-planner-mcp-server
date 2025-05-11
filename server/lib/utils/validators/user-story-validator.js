const { SchemaValidatorStrategy } = require('./schema-validator-strategy');

class UserStoryValidator extends SchemaValidatorStrategy {
  constructor() {
    super();
    this.schema = this.createUserStorySchema();
  }

  createUserStorySchema() {
    return {
      required: ['id', 'title'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        acceptance_criteria: { 
          type: 'array',
          items: { type: 'string' }
        },
        priority: { type: 'string' },
        businessValue: { type: 'string' }
      }
    };
  }

  validate(story) {
    return this.validateAgainstSchema(story, this.schema);
  }
}

module.exports = { UserStoryValidator };
