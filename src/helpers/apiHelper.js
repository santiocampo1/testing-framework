const axios = require('axios');
const baseURL = process.env.API_URL;

const api = axios.create({
    baseURL,
    timeout: 10000, // 10s timeout
    headers: {
        'Accept-Language': 'en',
        'Country-Code': 'US',
    },
});

async function generateToken() {
    try {
        const response = await api.post('/auth/generate_token');
        return response.data.token;
    } catch (error) {
        throw new Error(`Token generation failed: ${error.message}`);
    }
}

async function validateUser(userKey) {
    try {
        const response = await api.get('/auth/validate_user', {
            params: { userKey },
        });
        return response.data;
    } catch (error) {
        throw new Error(`Validate user failed: ${error.message}`);
    }
}

async function getBalance(userId, userKey, token) {
    try {
        const response = await api.get('/auth/get_user_balance', {
            params: { userId, userKey },
            headers: { token },
        });
        return response.data.money;
    } catch (error) {
        throw new Error(`Get balance failed: ${error.message}`);
    }
}

async function getFixtures(tournamentId) {
    try {
        const response = await api.get('/sports/fixtures', {
            params: { tournamentId },
        });
        return response.data;
    } catch (error) {
        throw new Error(`Get fixtures failed: ${error.message}`);
    }
}

async function getOdds(sportId, tournamentId, fixtureId, marketType) {
    try {
        const response = await api.get('/sports/odds', {
            params: { sportId, tournamentId, fixtureId, amount: 1 },
        });
        if (response.data.status === 'Inactive') {
            throw new Error('Odds inactive for this fixture');
        }
        let marketKey = marketType.toLowerCase();
        if (marketType === '1X2') {
            marketKey = 'result';
        } else if (marketType === 'Spread') {
            marketKey = 'handicap';
        }
        const marketData = response.data[marketKey];
        if (!marketData) {
            throw new Error(`Market ${marketType} not available`);
        }
        const options = marketData.options;
        if (!options || Object.keys(options).length === 0) {
            throw new Error('No options available in market');
        }
        let betId = null;
        let oddValue = null;
        for (const key in options) {
            const option = options[key];
            if (option.name && option.name.toLowerCase().includes('home')) {  
                betId = key;  
                oddValue = option.odd;  
                break;
            }
        }
        if (!oddValue) {
            const firstKey = Object.keys(options)[0];
            const firstOption = options[firstKey];
            betId = firstKey;
            oddValue = firstOption.odd;
        }
        if (!oddValue) {
            throw new Error('No odd value found in options');
        }
        return { betId, odd: oddValue };
    } catch (error) {
        throw new Error(`Get odds failed: ${error.message}`); 
    }
}

async function getTournaments(sportId) {
    try {
        const response = await api.get('/sports/tournaments', {
            params: { sport_id: sportId, with_active_fixtures: true, language: 'en' },
        });
        return response.data;
    } catch (error) {
        throw new Error(`Get tournaments failed: ${error.message}`);
    }
}

async function placeBet(body, token) {
    try {
        const response = await api.post('/place-bet', body, { headers: { token } });
        return response.data;
    } catch (error) {
        throw new Error(`Place bet failed: ${error.message}`);
    }
}

module.exports = {
    generateToken,
    validateUser,
    getBalance,
    getFixtures,
    getOdds,
    getTournaments,
    placeBet,
};