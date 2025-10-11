const http = require('http');

console.log('Testing backend API...');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/users/debug',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log('\n=== BACKEND RESPONSE ===');
            console.log('Success:', jsonData.success);
            console.log('Total users:', jsonData.total);
            console.log('Users without card:', jsonData.withoutCard);
            console.log('Users with card:', jsonData.withCard);

            if (jsonData.users) {
                console.log('\n=== USER LIST ===');
                jsonData.users.forEach((user, index) => {
                    console.log(`${index + 1}. ${user.fullName} - RFID: ${user.rfid_uid || 'NULL'}`);
                });
            }
        } catch (e) {
            console.log('Response is not JSON:');
            console.log(data.substring(0, 200));
        }
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
});

req.end();
