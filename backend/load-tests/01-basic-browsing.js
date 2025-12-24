// Basic Load Test: Anonymous User Browsing
// This simulates users browsing your site without logging in
// Tests: Homepage, Categories, Projects, Services

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Configuration: Gradually ramp up users
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users over 30 seconds
    { duration: '1m', target: 20 },    // Stay at 20 users for 1 minute
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users for 1 minute
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users for 2 minutes
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],

  // Performance thresholds - test fails if these are exceeded
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests should be under 2s
    http_req_failed: ['rate<0.05'],     // Error rate should be less than 5%
    errors: ['rate<0.05'],              // Custom error rate under 5%
  },
};

// CHANGE THIS to your production URL or use environment variable
const BASE_URL = __ENV.API_URL || 'http://localhost:5003/api';

export default function () {
  // Simulate a user browsing your site

  // 1. Load categories (like visiting homepage)
  let response = http.get(`${BASE_URL}/categories`);
  let success = check(response, {
    'categories loaded': (r) => r.status === 200,
    'categories has data': (r) => r.json('categories') !== undefined,
  });
  errorRate.add(!success);
  sleep(1); // User reads the page for 1 second

  // 2. Browse projects
  response = http.get(`${BASE_URL}/projects?limit=20&sortBy=newest`);
  success = check(response, {
    'projects loaded': (r) => r.status === 200,
    'projects response time OK': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!success);
  sleep(2); // User scrolls through projects for 2 seconds

  // 3. Filter projects by category (simulating category click)
  response = http.get(`${BASE_URL}/projects?limit=20&sortBy=newest&search=`);
  success = check(response, {
    'filtered projects loaded': (r) => r.status === 200,
  });
  errorRate.add(!success);
  sleep(1);

  // 4. Browse services
  response = http.get(`${BASE_URL}/services?sortBy=rating&limit=10`);
  success = check(response, {
    'services loaded': (r) => r.status === 200,
  });
  errorRate.add(!success);
  sleep(2);

  // 5. Get featured services (like homepage carousel)
  response = http.get(`${BASE_URL}/services?featured=true&sortBy=rating`);
  success = check(response, {
    'featured services loaded': (r) => r.status === 200,
  });
  errorRate.add(!success);
  sleep(1);

  // 6. Load public freelancer profiles
  response = http.get(`${BASE_URL}/users/public?role=FREELANCER&limit=10&sortBy=rating`);
  success = check(response, {
    'freelancers loaded': (r) => r.status === 200,
  });
  errorRate.add(!success);
  sleep(1);
}

// Summary handler - prints results at the end
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors;

  return `
${indent}Test Summary:
${indent}=============
${indent}Total Requests: ${data.metrics.http_reqs.values.count}
${indent}Failed Requests: ${data.metrics.http_req_failed.values.passes || 0}
${indent}
${indent}Response Times:
${indent}  - Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
${indent}  - Median (p50): ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms
${indent}  - 95th percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
${indent}  - 99th percentile: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
${indent}  - Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
${indent}
${indent}Virtual Users:
${indent}  - Max Concurrent: ${data.metrics.vus_max.values.max}
${indent}
${indent}Data Transferred:
${indent}  - Received: ${(data.metrics.data_received.values.count / 1024 / 1024).toFixed(2)} MB
${indent}  - Sent: ${(data.metrics.data_sent.values.count / 1024).toFixed(2)} KB
  `;
}
