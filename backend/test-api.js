const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  try {
    const testEmail = `testuser_${Date.now()}@example.com`;
    console.log(`[1] Testing Registration with ${testEmail}`);
    

    let res = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: 'password123'
    });
    console.log('✅ Registration Successful!');
    const { accessToken } = res.data.data.tokens;
    const { user } = res.data.data;


    console.log('[2] Testing Login');
    res = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: 'password123'
    });
    console.log('✅ Login Successful!');


    console.log('[3] Testing Create Workspace');
    res = await axios.post(`${API_URL}/workspaces`, {
      name: 'Test Workspace'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Workspace Creation Successful!');
    const workspaceId = res.data.data.id;


    console.log('[4] Testing Create Meeting');
    res = await axios.post(`${API_URL}/meetings`, {
      title: 'Test Meeting',
      workspace: workspaceId,
      scheduledStartTime: new Date(Date.now() + 86400000).toISOString()
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Meeting Creation Successful!');
    const meetingId = res.data.data.id;


    console.log('[5] Testing Create Task');
    res = await axios.post(`${API_URL}/tasks`, {
      content: 'Fix bugs',
      workspace: workspaceId,
      meeting: meetingId
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Task Creation Successful!');

    console.log('\n🎉 ALL TESTS PASSED! The API is working perfectly with Supabase/Prisma.');
  } catch (err) {
    console.error('\n❌ TEST FAILED');
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

runTests();
