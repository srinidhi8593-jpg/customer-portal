const axios = require('axios');
async function test() {
    try {
        const res = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin@acronaviation.com',
            password: 'admin123'
        });
        console.log("LOGIN SUCCESS", res.data);
    } catch(err) {
        console.error("LOGIN FAILED", err.response ? err.response.data : err.message);
    }
}
test();
