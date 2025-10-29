# Test Plan for ChatBet Mock API Integration

## Endpoint Analysis
I analyzed the available endpoints in the API docs (Swagger UI) and tested several with Postman to validate real responses. Here is a summary of key endpoints to test (focus on auth, sports data, betting, and combos, as they are central to the E2E flows). I ignore health checks and roots as they are not critical for integration.

- **Auth Endpoints**:
  - POST /auth/generate_token: Generates auth token. No params. Response: JSON with "token" (e.g. {"token": "eyuweydfoiwjebwe..."}). Test: Positive (token generated), Negative (if API fails).
  - GET /auth/validate_token: Validates token. Header: token (required). Response: String/JSON confirming validity.
  - GET /auth/get_user_balance: Gets balance. Query: userId (required), userKey (required). Header: token. Response: JSON with "money" (balance), "playableBalance", etc. Tested: Returns object with money as number (e.g. 3782.14).

- **Sports Data Endpoints**:
  - GET /sports: List of sports. No params. Response: Array of objects (e.g. [{"id": "1", "name": "Football"}, ...]). Tested: Returns 5 sports, ID 1 is Football, 3 is Basketball.
  - GET /sports/tournaments: List tournaments by sport. Query: sport_id (default 1), language (default en), with_active_fixtures (default false). Response: JSON array of tournaments. Tested: With with_active_fixtures=true, returns torneos con fixtures, pero no garantiza odds activas.
  - GET /sports/fixtures: Fixtures by tournament. Query: tournamentId (default 566), type (default pre_match), language (en), time_zone (UTC). Response: JSON array of fixtures.
  - GET /sports/odds: Odds for specific fixture. Query: sportId (1), tournamentId (566), fixtureId (27907678), amount (1). Response: JSON with status ('Active' or 'Inactive'), markets like "result" (for 1X2) with "options" as object of IDs with {name, odd}. Tested: Status Inactive en algunos, options con keys numéricas (ej. '6084930271': {name: 'Home', odd: number}).

- **Betting Endpoints**:
  - POST /place-bet: Places simple bet. Headers: accept-language (en), country-code (US), token. Body: JSON with user and betInfo (amount, betId array, source). Response: JSON with "message", "betId", "possibleWin". Tested: Acepta betId como 'home_win' o IDs numéricos, deducta balance.

- **Combo Endpoints**:
  - POST /add-bet-to-combo: Adds bet to combo. Body: JSON with betInfo and betsAdded array.
  - POST /get-combo-odds: Calculates combo odds. Body: JSON with betInfo array and fixture.
  - POST /place-combo-bet: Places combo bet. Body: JSON with betsInfo array, amount, user.


## Identified Test Cases
Table with cases based on flows and tests. Priority: High (critical for flow), Medium (additional validations), Low (optional).

| ID    | Description                                   | Priority | Type              |
| ----- | --------------------------------------------- | -------- | ----------------- |
| TC-01 | Generate valid token                          | High     | Positive          |
| TC-02 | Validate generated token                      | High     | Positive          |
| TC-03 | Get initial balance with valid userId/key     | High     | Positive          |
| TC-04 | List sports and validate existing ID (e.g. 1) | Medium   | Positive          |
| TC-05 | Get tournaments for sport_id with active fixtures | Medium   | Positive          |
| TC-06 | Get fixtures for tournamentId                 | High     | Positive          |
| TC-07 | Get odds for fixture/market, handle structure | High     | Positive          |
| TC-08 | Place simple bet and validate betId           | High     | Positive          |
| TC-09 | Validate balance deduction post-bet           | High     | Positive          |
| TC-10 | Add bets to combo                             | High     | Positive          |
| TC-11 | Calculate combo odds vs manual                | High     | Positive/Negative |
| TC-12 | Place combo bet                               | High     | Positive          |
| TC-13 | Attempt bet with invalid token                | Medium   | Negative          |
| TC-14 | Bet with negative stake or > balance          | Medium   | Negative          |
| TC-15 | Handle "Inactive" odds or null, fallback to hardcode | Medium   | Negative          |

## E2E Flows
Descriptions of flows to automate:

1. **Simple Bet Flow**:
   - Generate token.
   - Get initial balance (use userId/test values from config).
   - Get fixtures for sport/tournament from config (or dynamic with active filter).
   - Get odds for market (e.g. "1X2" – handle if null/Inactive: fallback to hardcoded for mock issues).
   - Build body and place bet.
   - Get final balance and validate deduction + potential winnings (stake * odd).
   - Validations: Token defined, balance updated, betId returned, winnings calc.

2. **Combo Bet Flow**:
   - Generate token.
   - For each selection in config: Get fixture, odds, add to combo.
   - Calculate total odds via API and manual (product of odds, tolerance 0.01).
   - Place combo bet.
   - Validate balance updated, combo_bet_id, winnings.

3. **Error Validation Flow** (new important test):
   - Generate valid token.
   - Attempt simple/combo bet with invalid inputs (e.g. negative stake, nonexistent fixtureId, invalid token).
   - Validate error responses (e.g. 422 Validation Error, details in body).
   - Why important: Ensures error handling in real integration.

## Parameterization Strategy
- Tests will read configs from JSON files in src/config/ (e.g. simpleBet.json, comboBet.json).
- Configurable params: sport_id, tournament_id, fixture_id, market_type, stake, bet_id, odd, selections (array with {sport_id, market}).
- Strategy: Use fs.readFileSync in tests to load JSON. Allow overrides via env or CLI args for flexibility. For mock issues, support hardcoded fallback for odds/fixtures.
- Example simpleBet.json:
  ```json
  {
    "sport_id": 1,
    "tournament_id": 566,
    "fixture_id": 27907678,
    "market_type": "1X2",
    "bet_id": "home_win",
    "odd": 2.5,
    "stake": 100.0,
    "userId": "1858035947",
    "userKey": "1"
  }