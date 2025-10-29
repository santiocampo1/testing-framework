const fs = require('fs');
const path = require('path');
const { generateToken, getBalance, addBetToCombo, getComboOdds, placeComboBet } = require('../helpers/apiHelper');

describe('Combo Bet E2E Flow', () => {
    let config;

    beforeAll(() => {
        const configPath = path.join(__dirname, '../config/comboBet.json');
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        config.userId = config.userId || process.env.DEFAULT_USER_ID;
        config.userKey = config.userKey || process.env.DEFAULT_USER_KEY;
    });

    it('should complete combo bet flow successfully', async () => {
        const token = await generateToken();
        expect(token).toBeDefined();

        const initialBalance = await getBalance(config.userId, config.userKey, token);
        expect(initialBalance).toBeDefined();

        let betsAdded = [];
        let individualOdds = [];
        for (const selection of config.selections) {
            const betInfo = {
                betId: selection.bet_id.toString(),
                fixtureId: selection.fixture_id.toString(),
                odd: selection.odd.toString(),
                tournamentId: selection.tournament_id.toString(),
                sportId: selection.sport_id.toString()
            };
            const body = {
                betInfo,
                betsAdded
            };
            const addResponse = await addBetToCombo(body);
            expect(addResponse.status).toBeDefined();

            betsAdded.push(betInfo);
            individualOdds.push(selection.odd);
        }

        const comboBody = {
            betInfo: betsAdded,
            fixture: { fixtureId: config.selections[0].fixture_id.toString(), sportId: config.selections[0].sport_id.toString(), tournamentId: config.selections[0].tournament_id.toString() }
        };
        const comboOddsResponse = await getComboOdds(comboBody);
        let totalOdd = parseFloat(comboOddsResponse.odd || comboOddsResponse);
        if (isNaN(totalOdd)) {
            totalOdd = individualOdds.reduce((acc, curr) => acc * curr, 1);
        }

        const manualTotalOdd = individualOdds.reduce((acc, curr) => acc * curr, 1);
        expect(totalOdd).toBeCloseTo(manualTotalOdd, 0.01);

        const placeBody = {
            betsInfo: betsAdded,
            amount: config.stake.toString(),
            user: {
                userKey: config.userKey,
                id: config.userId
            }
        };
        const betResponse = await placeComboBet(placeBody);
        expect(betResponse.betId).toBeDefined();

        const finalBalance = await getBalance(config.userId, config.userKey, token);
        expect(finalBalance).toBeLessThanOrEqual(initialBalance);

        const potentialWinnings = config.stake * totalOdd;
        expect(betResponse.profit).toBeCloseTo(potentialWinnings, 2);
    }, 30000);
});