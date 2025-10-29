const fs = require('fs');
const path = require('path');
const { generateToken, placeBet } = require('../helpers/apiHelper');

describe('Error Validation E2E Flow', () => {
    let config;

    beforeAll(() => {
        const configPath = path.join(__dirname, '../config/errorFlow.json');
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        config.userId = config.userId || process.env.DEFAULT_USER_ID;
        config.userKey = config.userKey || process.env.DEFAULT_USER_KEY;
    });

    it('should validate error for invalid bet', async () => {
        const token = await generateToken();
        expect(token).toBeDefined();

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

        await expect(placeBet(betBody, token)).rejects.toThrow();
        await expect(placeBet(betBody, 'invalid_token')).rejects.toThrow(/401/);
    }, 30000);
});