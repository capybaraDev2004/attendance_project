const http = require('http');

const API_BASE = 'http://localhost:3001';

function testEndpoint(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: responseData
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('Testing API endpoints...\n');

    try {
        // Test 1: Cards test endpoint
        console.log('1. Testing /api/cards/test');
        const test1 = await testEndpoint('GET', '/api/cards/test');
        console.log(`   Status: ${test1.status}`);
        console.log(`   Response: ${test1.data}\n`);

        // Test 2: Start scan
        console.log('2. Testing /api/cards/start-scan');
        const test2 = await testEndpoint('POST', '/api/cards/start-scan', { userId: 5 });
        console.log(`   Status: ${test2.status}`);
        console.log(`   Response: ${test2.data}\n`);

        // Test 3: Scan status
        console.log('3. Testing /api/cards/scan-status/5');
        const test3 = await testEndpoint('GET', '/api/cards/scan-status/5');
        console.log(`   Status: ${test3.status}`);
        console.log(`   Response: ${test3.data}\n`);

        // Test 4: Cancel scan
        console.log('4. Testing /api/cards/cancel-scan');
        const test4 = await testEndpoint('POST', '/api/cards/cancel-scan', { userId: 5 });
        console.log(`   Status: ${test4.status}`);
        console.log(`   Response: ${test4.data}\n`);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

runTests();
