// Authenticated User Load Test
// This simulates logged-in users performing actions
// Tests: Login, Dashboard, Creating Projects, Viewing Messages

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Start with 10 concurrent users
    { duration: '1m', target: 25 },    // Ramp to 25 users
    { duration: '2m', target: 25 },    // Hold at 25 users
    { duration: '30s', target: 50 },   // Spike to 50 users
    { duration: '1m', target: 50 },    // Hold spike
    { duration: '30s', target: 0 },    // Ramp down
  ],

  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% under 3s (auth is slower)
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5003/api';

// Test credentials from your seed data
const TEST_USERS = [
  { email: 'john.client@example.com', password: 'password123', type: 'client' },
  { email: 'mike.dev@example.com', password: 'password123', type: 'freelancer' },
];

export default function () {
  // Pick a random test user
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];

  // 1. LOGIN
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let response = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  let success = check(response, {
    'login successful': (r) => r.status === 200,
    'received token': (r) => r.json('token') !== undefined,
  });
  errorRate.add(!success);

  if (response.status !== 200) {
    console.log(`Login failed: ${response.status} - ${response.body}`);
    return; // Stop this iteration if login fails
  }

  const authToken = response.json('token');
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };

  sleep(1);

  // 2. GET DASHBOARD STATS (authenticated endpoint)
  response = http.get(`${BASE_URL}/users/dashboard/stats`, authHeaders);
  success = check(response, {
    'dashboard stats loaded': (r) => r.status === 200,
  });
  errorRate.add(!success);
  sleep(2);

  // 3. GET USER'S PROJECTS
  response = http.get(`${BASE_URL}/projects/my-projects?status=ALL`, authHeaders);
  success = check(response, {
    'my projects loaded': (r) => r.status === 200,
  });
  errorRate.add(!success);
  sleep(2);

  if (user.type === 'client') {
    // CLIENT-SPECIFIC ACTIONS

    // 4. Browse freelancers
    response = http.get(`${BASE_URL}/users-public?role=FREELANCER&limit=20`, authHeaders);
    success = check(response, {
      'freelancers browsed': (r) => r.status === 200,
    });
    errorRate.add(!success);
    sleep(2);

    // 5. View project applications
    response = http.get(`${BASE_URL}/projects/my-projects?status=OPEN`, authHeaders);
    if (response.status === 200 && response.json('data.data.projects')) {
      const projects = response.json('data.data.projects');
      if (projects.length > 0) {
        const projectId = projects[0].id;
        response = http.get(`${BASE_URL}/applications?projectId=${projectId}`, authHeaders);
        check(response, {
          'applications viewed': (r) => r.status === 200,
        });
      }
    }
    sleep(1);

  } else {
    // FREELANCER-SPECIFIC ACTIONS

    // 4. Browse available projects
    response = http.get(`${BASE_URL}/projects?limit=20&sortBy=newest`, authHeaders);
    success = check(response, {
      'projects browsed': (r) => r.status === 200,
    });
    errorRate.add(!success);
    sleep(2);

    // 5. Check notifications
    response = http.get(`${BASE_URL}/notifications?limit=10`, authHeaders);
    success = check(response, {
      'notifications loaded': (r) => r.status === 200 || r.status === 404,
    });
    errorRate.add(!success);
    sleep(1);
  }

  // 6. GET MESSAGES/CONVERSATIONS
  response = http.get(`${BASE_URL}/messages/conversations`, authHeaders);
  success = check(response, {
    'conversations loaded': (r) => r.status === 200,
  });
  errorRate.add(!success);
  sleep(1);

  // 7. LOGOUT
  response = http.post(`${BASE_URL}/auth/logout`, null, authHeaders);
  check(response, {
    'logout successful': (r) => r.status === 200,
  });
  sleep(1);
}

export function handleSummary(data) {
  console.log('\n========================================');
  console.log('AUTHENTICATED USER LOAD TEST RESULTS');
  console.log('========================================\n');
  console.log(`Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed Requests: ${data.metrics.http_req_failed.values.passes || 0}`);
  console.log(`Error Rate: ${((data.metrics.errors?.values.rate || 0) * 100).toFixed(2)}%`);
  console.log('\nResponse Times:');
  console.log(`  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`  Median: ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms`);
  console.log(`  95th percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  99th percentile: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log(`  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms`);
  console.log('\n========================================\n');

  return {
    'stdout': '',
  };
}
