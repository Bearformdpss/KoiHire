// Quick Health Check - Run this first to diagnose issues
// This makes a few test requests to see what's failing

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5003/api';

export default function () {
  console.log(`\n🔍 Testing API at: ${BASE_URL}\n`);

  // Test 1: Health endpoint
  console.log('1. Testing health endpoint...');
  let response = http.get(BASE_URL.replace('/api', '/health'));
  console.log(`   Status: ${response.status}`);
  console.log(`   Body: ${response.body}`);
  check(response, { 'health check OK': (r) => r.status === 200 });

  sleep(1);

  // Test 2: Categories endpoint
  console.log('\n2. Testing categories endpoint...');
  response = http.get(`${BASE_URL}/categories`);
  console.log(`   Status: ${response.status}`);
  console.log(`   Body: ${response.body.substring(0, 500)}`); // First 500 chars
  check(response, { 'categories OK': (r) => r.status === 200 });

  sleep(1);

  // Test 3: Projects endpoint
  console.log('\n3. Testing projects endpoint...');
  response = http.get(`${BASE_URL}/projects?limit=5`);
  console.log(`   Status: ${response.status}`);
  console.log(`   Body: ${response.body.substring(0, 500)}`);
  check(response, { 'projects OK': (r) => r.status === 200 });

  sleep(1);

  // Test 4: Services endpoint
  console.log('\n4. Testing services endpoint...');
  response = http.get(`${BASE_URL}/services?limit=5`);
  console.log(`   Status: ${response.status}`);
  console.log(`   Body: ${response.body.substring(0, 500)}`);
  check(response, { 'services OK': (r) => r.status === 200 });

  sleep(1);

  // Test 5: Public users endpoint
  console.log('\n5. Testing public users endpoint...');
  response = http.get(`${BASE_URL}/users/public?role=FREELANCER&limit=5`);
  console.log(`   Status: ${response.status}`);
  console.log(`   Body: ${response.body.substring(0, 500)}`);
  check(response, { 'users OK': (r) => r.status === 200 });

  console.log('\n✅ Health check complete!\n');
}
