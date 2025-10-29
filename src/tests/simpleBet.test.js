const fs = require('fs');
const path = require('path');
const { generateToken, getBalance, placeBet } = require('../helpers/apiHelper');

describe('Simple Bet E2E Flow', () => {
    let config;

    beforeAll(() => {
        const configPath = path.join(__dirname, '../config/simpleBet.json');
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        config.userId = config.userId || process.env.DEFAULT_USER_ID;
        config.userKey = config.userKey || process.env.DEFAULT_USER_KEY;
    });

    it('should complete simple bet flow successfully', async () => {
        const token = await generateToken();
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

        const initialBalance = await getBalance(config.userId, config.userKey, token);
        expect(initialBalance).toBeGreaterThanOrEqual(config.stake);

        const odd = config.odd;
        const betIdValue = config.bet_id;
        const fixtureId = config.fixture_id;
        const tournamentId = config.tournament_id;

        const betBody = {
            user: {
                userKey: config.userKey,
                id: config.userId
            },
            betInfo: {
                amount: config.stake.toString(),
                betId: [{
                    betId: betIdValue.toString(),
                    fixtureId: fixtureId.toString(),
                    odd: odd.toString(),
                    sportId: config.sport_id.toString(),
                    tournamentId: tournamentId.toString()
                }],
                source: 'mock'
            }
        };
        const betResponse = await placeBet(betBody, token);
        expect(betResponse.betId).toBeDefined();

        const finalBalance = await getBalance(config.userId, config.userKey, token);
        expect(finalBalance).toBeCloseTo(initialBalance - config.stake, 2);

        // Additional validations
        const potentialWinnings = config.stake * odd;
        expect(betResponse.possibleWin).toBeCloseTo(potentialWinnings, 2);
    }, 30000);
});