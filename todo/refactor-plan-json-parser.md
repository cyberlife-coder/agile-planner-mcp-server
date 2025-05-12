# Refactor Plan: server/lib/utils/json-parser.js#parseJsonResponse

## 1. Introduction & Goal

- **File:** `server/lib/utils/json-parser.js`
- **Function:** `parseJsonResponse`
- **Current Issue:** Cognitive Complexity of 31 (SonarQube MEMORY[cd412282...]), exceeding the recommended limit of 15.
- **Objective:** Refactor `parseJsonResponse` to reduce Cognitive Complexity to 15 or less, improve readability, maintainability, and testability, while ensuring all existing functionality is preserved.

## 2. Guiding Principles

- **TDD (Test-Driven Development):** Write tests before refactoring each part (RULE 1).
- **Single Responsibility Principle:** Each function should do one thing well.
- **Readability & Maintainability:** Code should be clear and easy to understand.
- **Max 50 Lines per Function:** Adhere to project rules (CODE RULE).
- **KISS (Keep It Simple, Stupid):** Avoid unnecessary complexity.

## 3. Current Functionality Overview

The `parseJsonResponse` function attempts to extract a JSON object from a string using three methods in sequence:
1. Direct `JSON.parse()` of the entire content.
2. Extraction from a markdown code block (e.g., ```json ... ``` or ``` ... ```) followed by `JSON.parse()`.
3. Extraction of the first string resembling a JSON object (e.g., `{...}`) followed by `JSON.parse()`.
It includes debug logging capabilities.

## 4. Proposed High-Level Structure

The refactoring will involve breaking down the main function into smaller, focused helper functions, potentially using a "chain of extractors" or "strategy" pattern.

```javascript
// Conceptual Structure
function parseJsonResponse(content, debug = false) {
    // 1. Initial checks (e.g., empty content) - Guard Clause
    // 2. Debug log for input content (if debug is true)

    const extractors = [
        tryDirectParse,
        tryParseFromMarkdown,
        tryParseFirstJsonObject
        // Potentially add more extractors in the future if needed
    ];

    for (const extractor of extractors) {
        try {
            const result = extractor(content, debug);
            if (result !== null) { // Assuming extractors return null if they can't parse their specific target
                // Debug log success for this extractor (if debug is true)
                return result;
            }
        } catch (error) {
            // Log error specific to this extractor if debug is true, then continue
            if (debug) {
                console.error(`Extractor ${extractor.name} failed: ${error.message}`);
            }
        }
    }

    // 3. If all extractors fail, throw a comprehensive error
    // Debug log final failure (if debug is true)
    throw new Error('Unable to find or parse valid JSON content.');
}

// Helper/Extractor functions (each returns parsed object or null):
// function tryDirectParse(content, debug) { /* ... */ }
// function tryParseFromMarkdown(content, debug) { /* ... */ }
// function tryParseFirstJsonObject(content, debug) { /* ... */ }
```

## 5. Detailed Test Plan (TDD)

A test suite (e.g., `json-parser.test.js`) will be created/updated with the following test cases:

- **Valid Inputs:**
    - `[ ] it('should parse a perfectly valid JSON string')`
    - `[ ] it('should parse JSON from a markdown ```json ... ``` block')`
    - `[ ] it('should parse JSON from a generic markdown ``` ... ``` block if it contains valid JSON')`
    - `[ ] it('should extract and parse the first valid JSON object from a mixed string (JSON at start)')`
    - `[ ] it('should extract and parse the first valid JSON object from a mixed string (JSON in middle)')`
    - `[ ] it('should extract and parse the first valid JSON object from a mixed string (JSON at end)')`
    - `[ ] it('should handle JSON with various whitespace arrangements within markdown/generic blocks')`
- **Invalid/Edge Case Inputs:**
    - `[ ] it('should throw an error for empty content')`
    - `[ ] it('should throw an error for null content')`
    - `[ ] it('should throw an error if no valid JSON is found after all attempts')`
    - `[ ] it('should correctly handle malformed JSON within a ```json ... ``` block (and proceed to next extractor)')`
    - `[ ] it('should correctly handle malformed JSON within a generic ``` ... ``` block (and proceed to next extractor)')`
    - `[ ] it('should correctly handle malformed JSON in a generic object extraction attempt (and proceed to next extractor)')`
    - `[ ] it('should handle content with markdown delimiters but no actual JSON content inside')`
    - `[ ] it('should handle content with partial/broken JSON objects')`
- **Debug Logging (Conceptual - may require spies/mocks or visual inspection):**
    - `[ ] it('should call debug logs when debug=true and direct parse is attempted')`
    - `[ ] it('should call debug logs when debug=true and markdown parse is attempted')`
    - `[ ] it('should call debug logs when debug=true and generic object parse is attempted')`
    - `[ ] it('should call debug logs for successful extraction method when debug=true')`
    - `[ ] it('should call debug logs for final failure when debug=true')`

## 6. Step-by-Step Refactoring Process (Iterative TDD)

- **[ ] Step 1: Setup & Base Cases**
    - `[ ] Create/Locate `json-parser.test.js`.
    - `[ ] Write tests for empty/null input. Implement guard clause in `parseJsonResponse`.
- **[ ] Step 2: `tryDirectParse` Extractor**
    - `[ ] Write tests for perfectly valid JSON string.
    - `[ ] Create `tryDirectParse(content, debug)` helper function.
    - `[ ] Integrate `tryDirectParse` into `parseJsonResponse` logic. Ensure tests pass.
- **[ ] Step 3: `tryParseFromMarkdown` Extractor**
    - `[ ] Write tests for JSON in ```json ...``` and ``` ... ``` blocks (valid and malformed JSON).
    - `[ ] Create `tryParseFromMarkdown(content, debug)` helper function.
    - `[ ] Integrate `tryParseFromMarkdown`. Ensure tests pass.
- **[ ] Step 4: `tryParseFirstJsonObject` Extractor**
    - `[ ] Write tests for generic `{...}` extraction (valid and malformed, various positions).
    - `[ ] Create `tryParseFirstJsonObject(content, debug)` helper function.
    - `[ ] Integrate `tryParseFirstJsonObject`. Ensure tests pass.
- **[ ] Step 5: Main Function Logic, Error Handling & Debugging**
    - `[ ] Implement the main loop/chain in `parseJsonResponse` to call extractors.
    - `[ ] Write test for "no JSON found" final error. Implement final error throw.
    - `[ ] Review and implement/verify all debug logging as per test plan.
- **[ ] Step 6: Review, Refine & Finalize**
    - `[ ] Ensure all tests pass.
    - `[ ] Verify Cognitive Complexity is <= 15 using a suitable tool or manual assessment.
    - `[ ] Ensure all helper functions and `parseJsonResponse` are <= 50 lines.
    - `[ ] Review code for clarity, comments, and adherence to project standards.

## 7. Key Considerations

- **Error Handling:** Each extractor should ideally return `null` (or a specific signal) if it cannot find/parse its target format, allowing the main function to try the next extractor. Genuine `JSON.parse` errors within an extractor's scope (if it found something to try parsing) can be logged if `debug` is true but shouldn't stop the chain. The final error from `parseJsonResponse` occurs only if all extractors fail.
- **Debug Logging:** Make debug logs clear about which stage/extractor is active.
- **Regex Efficiency:** While current regexes seem okay, keep an eye on performance if very large inputs become common.

## 8. Success Criteria

- Cognitive Complexity of `parseJsonResponse` (and its helpers) is significantly reduced (target <= 15).
- All defined tests pass, covering existing functionality and edge cases.
- Code readability and maintainability are demonstrably improved.
- Adherence to project code style and line limits.

## 9. Task Checklist & Completion (Post-Refactor)

- [ ] 1. All tests implemented and passing.
- [ ] 2. `parseJsonResponse` and helper functions refactored.
- [ ] 3. Cognitive Complexity verified to be within limits.
- [ ] 4. Code reviewed for clarity and standards.
- [ ] 5. `TASKS.md` updated (mark this refactor task as complete).
- [ ] 6. `CHANGELOG.md` updated with refactoring details.
- [ ] 7. This refactor plan file (`refactor-plan-json-parser.md`) deleted (as per RULE 1).

---
*This plan follows the 10-step reflection process outlined in RULE 1 for refactoring without the direct use of the `sequentialThinking` tool.*
