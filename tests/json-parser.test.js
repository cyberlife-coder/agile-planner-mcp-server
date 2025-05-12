const { parseJsonResponse } = require('../server/lib/utils/json-parser'); // Adjusted path
const chalk = require('chalk');

describe('parseJsonResponse', () => {
    let originalConsoleError;

    beforeEach(() => {
        originalConsoleError = console.error;
        console.error = jest.fn(); 
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe('Input Validation and Guard Clauses', () => {
        test('should throw an error for empty string input', () => {
            expect(() => parseJsonResponse('')).toThrow('Impossible de trouver un JSON valide dans la réponse: Contenu vide ou non défini');
        });

        test('should throw an error for string with only whitespace', () => {
            expect(() => parseJsonResponse('   ')).toThrow('Impossible de trouver un JSON valide dans la réponse: Contenu vide ou non défini');
        });

        test('should throw an error for null input', () => {
            expect(() => parseJsonResponse(null)).toThrow('Impossible de trouver un JSON valide dans la réponse: Contenu vide ou non défini');
        });

        test('should throw an error for undefined input', () => {
            expect(() => parseJsonResponse(undefined)).toThrow('Impossible de trouver un JSON valide dans la réponse: Contenu vide ou non défini');
        });
    });

    describe('Direct JSON Parsing', () => {
        test('should parse a perfectly valid JSON string', () => {
            const jsonInput = '{"key": "value", "number": 123}';
            const expectedOutput = { key: 'value', number: 123 };
            expect(parseJsonResponse(jsonInput)).toEqual(expectedOutput);
        });

        test('should parse a valid JSON string with leading/trailing whitespace', () => {
            const jsonInput = '  {\n  "key": "value",\n  "number": 123\n}  ';
            const expectedOutput = { key: 'value', number: 123 };
            expect(parseJsonResponse(jsonInput)).toEqual(expectedOutput);
        });
    });

    describe('Markdown Block JSON Parsing', () => {
        test('should parse JSON from a ```json ... ``` block', () => {
            const input = 'Some text before\n```json\n{"key": "markdownValue", "count": 1}\n```\nSome text after';
            const expected = { key: 'markdownValue', count: 1 };
            expect(parseJsonResponse(input)).toEqual(expected);
        });

        test('should parse JSON from a generic ``` ... ``` block', () => {
            const input = '```\n{"key": "genericMarkdown", "bool": true}\n```';
            const expected = { key: 'genericMarkdown', bool: true };
            expect(parseJsonResponse(input)).toEqual(expected);
        });

        test('should return null (and not throw) for malformed JSON within a markdown block, allowing fallback', () => {
            // This test implicitly checks if parseJsonResponse moves to the next strategy
            // For now, assuming it will eventually throw the main "Impossible de trouver" error if no other strategy works
            const input = '```json\n{"key": "malformedValue", count: \n```';
            // If parseJsonResponse is fully refactored with all strategies, this might throw.
            // For now, testing the helper's behavior through the main function.
            // We expect it to proceed and eventually fail if this is the only content.
            expect(() => parseJsonResponse(input)).toThrow('Impossible de trouver un JSON valide dans la réponse');
        });

        test('should handle markdown delimiters with no JSON content inside', () => {
            const input = '```json\n\n```';
            expect(() => parseJsonResponse(input)).toThrow('Impossible de trouver un JSON valide dans la réponse');
        });

        test('should parse JSON from a markdown block with leading/trailing spaces around JSON', () => {
            const input = '```json\n  {"key": "spaced", "id": 42}  \n```';
            const expected = { key: 'spaced', id: 42 };
            expect(parseJsonResponse(input)).toEqual(expected);
        });
    });

    describe('Generic First JSON Object Parsing', () => {
        test('should extract and parse the first valid JSON object from a mixed string (JSON at start)', () => {
            const input = '{"key": "firstObject", "data": [1,2]}Some other text here.';
            const expected = { key: 'firstObject', data: [1,2] };
            expect(parseJsonResponse(input)).toEqual(expected);
        });

        test('should extract and parse the first valid JSON object from a mixed string (JSON in middle)', () => {
            const input = 'Prefix text {"key": "middleObject", "valid": true} Suffix text.';
            const expected = { key: 'middleObject', valid: true };
            expect(parseJsonResponse(input)).toEqual(expected);
        });

        test('should extract and parse the first valid JSON object from a mixed string (JSON at end)', () => {
            const input = 'Some leading garbage text {"key": "endObject", "items": null}';
            const expected = { key: 'endObject', items: null };
            expect(parseJsonResponse(input)).toEqual(expected);
        });

        test('should handle malformed JSON in a generic object extraction attempt and fallback', () => {
            const input = 'Text with {"key": "malformedObject",, "broken": true } here';
            expect(() => parseJsonResponse(input)).toThrow('Impossible de trouver un JSON valide dans la réponse');
        });

        test('should take the first complete object if multiple { } are present', () => {
            const input = 'Content {"first": true} and then {"second": false} more content';
            const expected = { first: true };
            expect(parseJsonResponse(input)).toEqual(expected);
        });
    });

    // More tests will be added here
});
