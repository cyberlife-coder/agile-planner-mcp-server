const { UserStoryValidator } = require('./user-story-validator');
const { FeatureValidator } = require('./feature-validator');
const { EpicValidator } = require('./epic-validator');
const { IterationValidator } = require('./iteration-validator');
const { BacklogValidator } = require('./backlog-validator');

class ValidatorsFactory {
  constructor() {
    this._userStoryValidator = null;
    this._featureValidator = null;
    this._epicValidator = null;
    this._iterationValidator = null;
    this._backlogValidator = null;
  }

  getUserStoryValidator() {
    if (!this._userStoryValidator) {
      this._userStoryValidator = new UserStoryValidator();
    }
    return this._userStoryValidator;
  }

  getFeatureValidator() {
    if (!this._featureValidator) {
      this._featureValidator = new FeatureValidator();
    }
    return this._featureValidator;
  }

  getEpicValidator() {
    if (!this._epicValidator) {
      this._epicValidator = new EpicValidator();
    }
    return this._epicValidator;
  }

  getIterationValidator() {
    if (!this._iterationValidator) {
      this._iterationValidator = new IterationValidator();
    }
    return this._iterationValidator;
  }

  getBacklogValidator() {
    if (!this._backlogValidator) {
      this._backlogValidator = new BacklogValidator();
    }
    return this._backlogValidator;
  }

  validate(data, type) {
    switch(type) {
      case 'userStory':
        return this.getUserStoryValidator().validate(data);
      case 'feature':
        return this.getFeatureValidator().validate(data);
      case 'epic':
        return this.getEpicValidator().validate(data);
      case 'iteration':
        return this.getIterationValidator().validate(data);
      case 'backlog':
        return this.getBacklogValidator().validate(data);
      default:
        throw new Error(`Type de validateur non supporté: ${type}`);
    }
  }
}

// Export d'une instance singleton de la factory
module.exports = new ValidatorsFactory();
