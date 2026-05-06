const newman = require('newman');
const path = require('path');

const config = {
    collection: path.join(__dirname, '../postman/mobile-shop-api.postman_collection.json'),
    environment: path.join(__dirname, '../postman/mobile-shop-environment.postman_environment.json'),
    reporters: ['cli', 'html', 'json'],
    reporter: {
        html: {
            export: path.join(__dirname, '../reports/newman-report.html'),
            template: 'htmlreqres' // Include request and response details
        },
        json: {
            export: path.join(__dirname, '../reports/newman-report.json')
        }
    },
    timeout: 30000, // 30 seconds timeout for each request
    delayRequest: 100, // 100ms delay between requests
    bail: false, // Continue on failure to get full report
    verbose: true
};

module.exports = config;
