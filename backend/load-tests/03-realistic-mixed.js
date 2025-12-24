// Realistic Mixed Load Test
// Simulates real-world traffic: 70% browsing, 30% authenticated users
// This is the MAIN test to run before launch

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const browsingDuration = new Trend('browsing_duration');
const authDuration = new Trend('auth_duration');

export const options = {
  stages: [
    // Gradual ramp up simulating real traffic growth
    { duration: '1m', target: 50 },     // Morning traffic
    { duration: '3m', target: 100 },    // Peak hours starting
    { duration: '5m', target: 200 },    // Peak traffic
    { duration: '2m', target: 500 },    // Lunch rush / viral spike
    { duration: '3m', target: 500 },    // Sustained peak
    { duration: '2m', target: 200 },    // Calming down
    { duration: '2m', target: 100 },    // Evening traffic
    { duration: '1m', target: 0 },      // Ramp down
  ],

  thresholds: {
    // These are YOUR success criteria
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],  // 95% under 3s, 99% under 5s
    http_req_failed: ['rate<0.02'],                    // Less than 2% errors
    errors: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5003/api';

// 70% of users just browse, 30% are logged in
const BROWSING_WEIGHT = 70;
const AUTHENTICATED_WEIGHT = 30;

export default function () {
  const userType = Math.random() * 100;

  if (userType < BROWSING_WEIGHT) {
    // BROWSING USER (anonymous)
    browsingFlow();
  } else {
    // AUTHENTICATED USER
    authenticatedFlow();
  }
}

function browsingFlow() {
  const start = Date.now();

  // Homepage visit
  let response = http.get(`${BASE_URL}/categories`);
  let success = check(response, { 'categories loaded': (r) => r.status === 200 });
  errorRate.add(!success);
  sleep(Math.random() * 2 + 1); // Random 1-3s

  // Browse projects
  response = http.get(`${BASE_URL}/projects?limit=20&sortBy=newest`);
  success = check(response, { 'projects loaded': (r) => r.status === 200 });
  errorRate.add(!success);
  sleep(Math.random() * 3 + 2); // Random 2-5s

  // View services
  response = http.get(`${BASE_URL}/services?sortBy=rating&limit=10`);
  success = check(response, { 'services loaded': (r) => r.status === 200 });
  errorRate.add(!success);
  sleep(Math.random() * 2 + 1);

  // Browse freelancers
  response = http.get(`${BASE_URL}/users/public?role=FREELANCER&limit=10`);
  success = check(response, { 'freelancers loaded': (r) => r.status === 200 });
  errorRate.add(!success);

  browsingDuration.add(Date.now() - start);
}

function authenticatedFlow() {
  const start = Date.now();

  // Login
  const users = [
    { email: 'john.client@example.com', password: 'password123' },
    { email: 'mike.dev@example.com', password: 'password123' },
  ];
  const user = users[Math.floor(Math.random() * users.length)];

  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const params = { headers: { 'Content-Type': 'application/json' } };

  let response = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  let success = check(response, { 'login OK': (r) => r.status === 200 });
  errorRate.add(!success);

  if (response.status !== 200) {
    return; // Failed login, abort
  }

  const token = response.json('token');
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  sleep(1);

  // Dashboard
  response = http.get(`${BASE_URL}/users/dashboard/stats`, authHeaders);
  success = check(response, { 'dashboard loaded': (r) => r.status === 200 });
  errorRate.add(!success);
  sleep(Math.random() * 2 + 1);

  // My projects
  response = http.get(`${BASE_URL}/projects/my-projects?status=ALL`, authHeaders);
  success = check(response, { 'projects loaded': (r) => r.status === 200 });
  errorRate.add(!success);
  sleep(Math.random() * 2 + 1);

  // Messages
  response = http.get(`${BASE_URL}/messages/conversations`, authHeaders);
  check(response, { 'messages loaded': (r) => r.status === 200 });
  sleep(1);

  // Logout
  http.post(`${BASE_URL}/auth/logout`, null, authHeaders);

  authDuration.add(Date.now() - start);
}

export function handleSummary(data) {
  const passed = data.metrics.http_req_failed.values.rate < 0.02 &&
                 data.metrics.http_req_duration.values['p(95)'] < 3000;

  console.log('\n' + '='.repeat(60));
  console.log('🚀 REALISTIC LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n📊 OVERALL PERFORMANCE:`);
  console.log(`   Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`   Failed Requests: ${data.metrics.http_req_failed.values.passes || 0}`);
  console.log(`   Success Rate: ${((1 - (data.metrics.http_req_failed.values.rate || 0)) * 100).toFixed(2)}%`);

  console.log(`\n⏱️  RESPONSE TIMES:`);
  console.log(`   Average: ${data.metrics.http_req_duration.values.avg.toFixed(0)}ms`);
  console.log(`   Median (p50): ${data.metrics.http_req_duration.values['p(50)'].toFixed(0)}ms`);
  console.log(`   95th percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms`);
  console.log(`   99th percentile: ${data.metrics.http_req_duration.values['p(99)'].toFixed(0)}ms`);
  console.log(`   Slowest: ${data.metrics.http_req_duration.values.max.toFixed(0)}ms`);

  console.log(`\n👥 CONCURRENT USERS:`);
  console.log(`   Peak Concurrent: ${data.metrics.vus_max.values.max} users`);

  console.log(`\n📦 DATA TRANSFER:`);
  console.log(`   Downloaded: ${(data.metrics.data_received.values.count / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Uploaded: ${(data.metrics.data_sent.values.count / 1024).toFixed(2)} KB`);

  console.log(`\n🎯 TEST VERDICT:`);
  if (passed) {
    console.log(`   ✅ PASSED - Your app can handle the load!`);
  } else {
    console.log(`   ❌ FAILED - Performance issues detected`);
    if (data.metrics.http_req_duration.values['p(95)'] >= 3000) {
      console.log(`   ⚠️  95th percentile response time too high`);
    }
    if (data.metrics.http_req_failed.values.rate >= 0.02) {
      console.log(`   ⚠️  Error rate too high`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  return { 'stdout': '' };
}
