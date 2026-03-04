const http = require('http');

async function test() {
    // 1. Login
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@acronaviation.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    console.log("Login:", loginRes.status, loginData.token ? "Success" : loginData);
    if (!loginData.token) return;

    // 2. Get requests
    const reqsRes = await fetch('http://localhost:4000/api/admin/org-requests', {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    const reqs = await reqsRes.json();
    const pending = reqs.find(r => r.status === 'PENDING');
    if (!pending) {
        console.log("No pending requests found.");
        return;
    }
    console.log("Found pending request:", pending.id);

    // 3. Approve
    const approveRes = await fetch(`http://localhost:4000/api/admin/org-requests/${pending.id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${loginData.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sapBpId: 'BP-TEST-' + Date.now(), currency: 'USD', orgStatus: 'ACTIVE' })
    });
    const approveData = await approveRes.json();
    console.log("Approve response:", approveRes.status, approveData);
}
test();
