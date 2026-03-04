const http = require('http');
// Reuse credentials to get token
const data = JSON.stringify({ email: 'admin@acronaviation.com', password: 'admin123' });
const req = http.request({
    hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, res => {
    let body = ''; res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const token = JSON.parse(body).token;
        if (!token) return console.error('No token');
        
        http.get({ hostname: 'localhost', port: 4000, path: '/api/forum/posts', headers: { 'Authorization': `Bearer ${token}` } }, res2 => {
            let b2 = ''; res2.on('data', c => b2 += c);
            res2.on('end', () => console.log('Forum Posts:', b2.substring(0, 200)));
        });
        
        http.get({ hostname: 'localhost', port: 4000, path: '/api/admin/posts', headers: { 'Authorization': `Bearer ${token}` } }, res3 => {
            let b3 = ''; res3.on('data', c => b3 += c);
            res3.on('end', () => console.log('Admin Posts:', b3.substring(0, 200)));
        });
    });
});
req.write(data); req.end();
