import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
let adminToken = '';
let managerToken = '';
let employeeToken = '';
let goalId = 0;

async function testBackend() {
  try {
    console.log('--- Testing Auth ---');
    // 1. Login Admin
    const adminRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@kanjabung.com',
      password: 'password123'
    });
    adminToken = adminRes.data.token;
    console.log('Admin Logged In');

    // 2. Login Manager
    const managerRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'manager@kanjabung.com',
      password: 'password123'
    });
    managerToken = managerRes.data.token;
    console.log('Manager Logged In');

    // 3. Login Employee
    const employeeRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'employee@kanjabung.com',
      password: 'password123'
    });
    employeeToken = employeeRes.data.token;
    console.log('Employee Logged In');

    console.log('\n--- Testing Admin Routes ---');
    // 4. Get Divisions
    const divisions = await axios.get(`${API_URL}/admin/divisions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Divisions:', divisions.data.length);

    console.log('\n--- Testing Manager Routes ---');
    // 5. Create Goal
    const goalRes = await axios.post(`${API_URL}/goals`, {
      title: 'Q1 Performance',
      description: 'Achieve 100% uptime'
    }, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    goalId = goalRes.data.id;
    console.log('Goal Created:', goalRes.data.title);

    // 6. Get Goals as Manager
    const goalsRes = await axios.get(`${API_URL}/goals`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('Manager Goals:', goalsRes.data.length);

    console.log('\n--- Testing Employee Routes ---');
    // 7. Get Goals as Employee
    const empGoalsRes = await axios.get(`${API_URL}/goals`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('Employee Goals:', empGoalsRes.data.length);

    // 8. Create Task
    const taskRes = await axios.post(`${API_URL}/tasks`, {
      title: 'Fix Server Crash',
      description: 'Investigate logs',
      goalId: goalId
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('Task Created:', taskRes.data.title);

    // 9. Get Tasks as Employee
    const tasksRes = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('Employee Tasks:', tasksRes.data.length);

    console.log('\n--- Test Completed Successfully ---');

  } catch (error: any) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
  }
}

testBackend();
