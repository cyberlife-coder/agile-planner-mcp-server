/**
 * Tests TDD pour le module TypeValidator
 * Approche RED-GREEN-REFACTOR
 */
const { TypeValidator } = require('../../../server/lib/utils/validators/type-validator');

describe('TypeValidator - Tests TDD', () => {
  let validator;

  beforeEach(() => {
    // Créer une instance fraîche pour chaque test
    validator = new TypeValidator();
  });

  describe('validate', () => {
    test('devrait valider correctement le type string', () => {
      expect(validator.validate('hello', 'string')).toBe(true);
      expect(validator.validate(123, 'string')).toBe(false);
      expect(validator.validate(null, 'string')).toBe(false);
    });

    test('devrait valider correctement le type number', () => {
      expect(validator.validate(123, 'number')).toBe(true);
      expect(validator.validate(0, 'number')).toBe(true);
      expect(validator.validate('123', 'number')).toBe(false);
      expect(validator.validate(null, 'number')).toBe(false);
    });

    test('devrait valider correctement le type boolean', () => {
      expect(validator.validate(true, 'boolean')).toBe(true);
      expect(validator.validate(false, 'boolean')).toBe(true);
      expect(validator.validate('true', 'boolean')).toBe(false);
      expect(validator.validate(1, 'boolean')).toBe(false);
    });

    test('devrait valider correctement le type array', () => {
      expect(validator.validate([], 'array')).toBe(true);
      expect(validator.validate([1, 2, 3], 'array')).toBe(true);
      expect(validator.validate({}, 'array')).toBe(false);
      expect(validator.validate(null, 'array')).toBe(false);
    });

    test('devrait valider correctement le type object', () => {
      expect(validator.validate({}, 'object')).toBe(true);
      expect(validator.validate({ key: 'value' }, 'object')).toBe(true);
      expect(validator.validate([], 'object')).toBe(false);
      expect(validator.validate(null, 'object')).toBe(false);
    });

    test('devrait retourner false pour un type inconnu', () => {
      expect(validator.validate('value', 'unknown')).toBe(false);
    });
  });

  describe('isDefined', () => {
    test('devrait retourner true pour des valeurs définies', () => {
      expect(validator.isDefined('')).toBe(true);
      expect(validator.isDefined(0)).toBe(true);
      expect(validator.isDefined(false)).toBe(true);
      expect(validator.isDefined(null)).toBe(true);
      expect(validator.isDefined([])).toBe(true);
      expect(validator.isDefined({})).toBe(true);
    });

    test('devrait retourner false pour undefined', () => {
      expect(validator.isDefined(undefined)).toBe(false);
      let undef;
      expect(validator.isDefined(undef)).toBe(false);
    });
  });

  describe('exists', () => {
    test('devrait retourner true pour des valeurs existantes', () => {
      expect(validator.exists('')).toBe(true);
      expect(validator.exists(0)).toBe(true);
      expect(validator.exists(false)).toBe(true);
      expect(validator.exists([])).toBe(true);
      expect(validator.exists({})).toBe(true);
    });

    test('devrait retourner false pour null ou undefined', () => {
      expect(validator.exists(null)).toBe(false);
      expect(validator.exists(undefined)).toBe(false);
      let undef;
      expect(validator.exists(undef)).toBe(false);
    });
  });
});
