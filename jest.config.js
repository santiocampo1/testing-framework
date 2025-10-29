module.exports = {
    testEnvironment: 'node',
    reporters: [
        'default',
        ['jest-html-reporters', {
            publicPath: './reports',
            filename: 'test-report.html',
            expand: true,
        }],
    ],
    setupFiles: ['dotenv/config'], 
};