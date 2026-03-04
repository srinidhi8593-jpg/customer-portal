const http = require('http');

const data = JSON.stringify({
    email: 'admin@acronaviation.com',
    password: 'admin123'
});

const req = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const token = JSON.parse(body).token;
        if (!token) {
            console.error('No token:', body);
            return;
        }
        
        const req2 = http.request({
            hostname: 'localhost',
            port: 4000,
            path: '/api/admin/posts',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }, res2 => {
            let body2 = '';
            res2.on('data', chunk => body2 += chunk);
            res2.on('end', () => console.log('Admin Posts:', body2));
        });
        req2.end();
        
        const req3 = http.request({
            hostname: 'localhost',
            port: 4000,
            path: '/api/forum/posts',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }, res3 => {
            let body3 = '';
            res3.on('data', chunk => body3 += chunk);
            res3.on('end', () => console.log('Forum Posts:', body3));
        });
        req3.end();
    });
});
req.write(data);
req.end();
