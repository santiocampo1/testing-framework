# ChatBet API Testing Framework

## Prerequisites
- Node.js version 14 or higher (recommend Node v22). Check with node -v and upgrade if necessary.

## Installation
- Clone the repo.
- Run `npm install`.

## Run Tests
- `npm test`: Run all tests.
- Reports in /reports/test-report.html.

## Modify Parameters
- Edit src/config/simpleBet.json for Simple Bet params.
- Similar for comboBet.json and errorFlow.json.

## Project Structure
- src/helpers: Reusable API functions.
- src/tests: Test files (simpleBet.test.js, comboBet.test.js, errorFlow.test.js).
- src/config: JSON configs for parametrization.
- reports: Generated reports.
- TEST_PLAN.md: Test plan document.