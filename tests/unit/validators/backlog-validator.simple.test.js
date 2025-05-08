/**
 * Tests simplifiés pour le BacklogValidator
 */
const { BacklogValidator } = require('../../../server/lib/utils/validators/backlog-validator');

describe('BacklogValidator - Tests simplifiés', () => {
  let validator;

  beforeEach(() => {
    validator = new BacklogValidator();
  });

  test('BacklogValidator peut être instancié', () => {
    expect(validator).toBeInstanceOf(BacklogValidator);
  });

  test('BacklogValidator a une méthode validate', () => {
    expect(typeof validator.validate).toBe('function');
  });

  test('BacklogValidator a une méthode validateBacklog', () => {
    expect(typeof validator.validateBacklog).toBe('function');
  });
});
