// Register Test Users for Load Testing
// Run this once to create test users in production database

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5003/api';

export default function () {
  console.log(`\n🔧 Registering test users at: ${BASE_URL}\n`);

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Register John Client
  console.log('1. Registering john.client@example.com...');
  let payload = JSON.stringify({
    email: 'john.client@example.com',
    password: 'Password123',
    username: 'johnclient',
    firstName: 'John',
    lastName: 'Client',
    role: 'CLIENT',
  });

  let response = http.post(`${BASE_URL}/auth/register`, payload, params);
  console.log(`   Status: ${response.status}`);
  console.log(`   Response: ${response.body.substring(0, 200)}`);

  let success = check(response, {
    'john.client registered': (r) => r.status === 200 || r.status === 201 || r.body.includes('already exists'),
  });

  if (response.status === 200 || response.status === 201) {
    console.log('   ✅ John Client registered successfully!');
  } else if (response.body.includes('already exists') || response.body.includes('already registered')) {
    console.log('   ℹ️  John Client already exists (this is OK)');
  } else {
    console.log('   ❌ Failed to register John Client');
  }

  // Optional: Register additional test user if needed
  console.log('\n2. Registering jane.client@example.com (backup test user)...');
  payload = JSON.stringify({
    email: 'jane.client@example.com',
    password: 'Password123',
    username: 'janeclient',
    firstName: 'Jane',
    lastName: 'Client',
    role: 'CLIENT',
  });

  response = http.post(`${BASE_URL}/auth/register`, payload, params);
  console.log(`   Status: ${response.status}`);

  if (response.status === 200 || response.status === 201) {
    console.log('   ✅ Jane Client registered successfully!');
  } else if (response.body.includes('already exists')) {
    console.log('   ℹ️  Jane Client already exists (this is OK)');
  } else {
    console.log('   ❌ Failed to register Jane Client');
  }

  console.log('\n✅ Test user registration complete!\n');
  console.log('You can now run load tests with these credentials:');
  console.log('  - john.client@example.com / Password123');
  console.log('  - mike.dev@example.com / Password123');
  console.log('  - jane.client@example.com / Password123\n');
}
