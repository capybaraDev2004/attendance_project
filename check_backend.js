const http = require('http');

console.log('Checking backend server...');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/users',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response:');
        console.log(data);

        try {
            const jsonData = JSON.parse(data);
            console.log('Parsed JSON:');
            console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.log('Not valid JSON - this is the problem!');
            console.log('First 200 characters:', data.substring(0, 200));
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    console.log('Backend is not running on port 3001');
});

req.end();
