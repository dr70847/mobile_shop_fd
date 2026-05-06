#!/usr/bin/env node

const newman = require('newman');
const config = require('./newman.config');
const fs = require('fs');
const path = require('path');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

console.log('🚀 Starting MobileShop API Tests with Newman...');
console.log(`📊 Collection: ${config.collection}`);
console.log(`🌍 Environment: ${config.environment}`);
console.log(`📁 Reports will be saved to: ${reportsDir}`);

newman.run(config, (err, summary) => {
    if (err) {
        console.error('❌ Newman run error:', err);
        process.exit(1);
    }

    console.log('\n📈 Test Summary:');
    console.log(`   Total requests: ${summary.run.stats.requests.total}`);
    console.log(`   Successful: ${summary.run.stats.requests.successful}`);
    console.log(`   Failed: ${summary.run.stats.requests.failed}`);
    
    console.log('\n📊 Assertions:');
    console.log(`   Total: ${summary.run.stats.assertions.total}`);
    console.log(`   Passed: ${summary.run.stats.assertions.passed}`);
    console.log(`   Failed: ${summary.run.stats.assertions.failed}`);

    console.log('\n⏱️  Performance:');
    console.log(`   Average response time: ${Math.round(summary.run.timings.average)}ms`);
    console.log(`   Total run time: ${Math.round(summary.run.timings.completed - summary.run.timings.started)}ms`);

    if (summary.run.failures.length > 0) {
        console.log('\n❌ Failed Tests:');
        summary.run.failures.forEach((failure, index) => {
            console.log(`   ${index + 1}. ${failure.error.name || 'Unknown Error'}`);
            console.log(`      Request: ${failure.source.request.method} ${failure.source.request.url}`);
            console.log(`      Error: ${failure.error.message || 'No message'}`);
        });
    }

    console.log('\n📄 Reports generated:');
    console.log(`   HTML: ${config.reporter.html.export}`);
    console.log(`   JSON: ${config.reporter.json.export}`);

    // Exit with appropriate code
    const exitCode = summary.run.failures.length > 0 ? 1 : 0;
    process.exit(exitCode);
});
