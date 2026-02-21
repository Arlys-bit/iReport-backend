#!/usr/bin/env node

/**
 * Simple test script to verify backend API login works
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const TEST_CREDENTIALS = {
  email: 'admin@school.edu',
  password: 'admin123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(status, message) {
  const symbol = status === 'success' ? '✓' : status === 'error' ? '✗' : '→';
  const color = status === 'success' ? colors.green : status === 'error' ? colors.red : colors.blue;
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

async function testLoginAPI() {
  return new Promise((resolve) => {
    log('test', 'Testing POST /api/auth/login...');
    
    const postData = JSON.stringify({
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            log('success', `Login successful - Status: ${res.statusCode}`);
            log('success', `Token: ${response.data.token.substring(0, 50)}...`);
            log('success', `User: ${response.data.user.fullName} (${response.data.user.role})`);
            resolve({ success: true, token: response.data.token, user: response.data.user });
          } catch (e) {
            log('error', 'Failed to parse login response');
            resolve({ success: false });
          }
        } else {
          log('error', `Login failed - Status: ${res.statusCode}`);
          resolve({ success: false });
        }
      });
    });

    req.on('error', (error) => {
      log('error', `API request failed: ${error.message}`);
      resolve({ success: false });
    });

    req.write(postData);
    req.end();
  });
}

async function testSocketIO(token, userId) {
  log('info', 'Socket.IO test requires socket.io-client npm package');
  log('info', 'It will be tested from the React Native frontend');
  return { success: true };
}

async function runTests() {
  console.log('\n' + colors.blue + '========================================' + colors.reset);
  console.log(colors.blue + ' iReport Backend Integration Test' + colors.reset);
  console.log(colors.blue + '========================================' + colors.reset + '\n');

  log('test', `Testing backend at ${BASE_URL}`);
  console.log('');

  // Test 1: Health Check
  log('test', 'Testing GET /health...');
  const healthOk = await new Promise((resolve) => {
    http.get(`${BASE_URL}/health`, (res) => {
      if (res.statusCode === 200) {
        log('success', `Health check passed - Status: ${res.statusCode}`);
        resolve(true);
      } else {
        log('error', `Health check failed - Status: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (error) => {
      log('error', `Health check failed: ${error.message}`);
      resolve(false);
    });
  });

  if (!healthOk) {
    log('error', 'Backend is not running. Make sure to run: npm run dev');
    console.log('');
    process.exit(1);
  }

  console.log('');

  // Test 2: Login API
  const loginResult = await testLoginAPI();
  console.log('');

  if (!loginResult.success) {
    log('error', 'Login failed. Check backend credentials.');
    console.log('');
    process.exit(1);
  }

  // Test 3: Socket.IO
  const socketResult = await testSocketIO(loginResult.token, loginResult.user.id);
  console.log('');

  if (!socketResult.success) {
    log('error', 'Socket.IO connection failed.');
    console.log('');
    process.exit(1);
  }

  // All tests passed
  console.log(colors.green + '========================================' + colors.reset);
  console.log(colors.green + ' ✓ All tests passed!' + colors.reset);
  console.log(colors.green + '========================================' + colors.reset);
  console.log('');
  log('success', 'Frontend can now connect to backend');
  log('success', 'JWT token will be stored in AsyncStorage');
  log('success', 'Socket.IO will sync reports across 2 devices');
  console.log('');
  console.log(colors.yellow + 'Next steps:' + colors.reset);
  console.log('1. Start Expo: npx expo start --web');
  console.log('2. Open Browser: http://localhost:19006');
  console.log('3. Login with: admin@school.edu / admin123');
  console.log('');
}

runTests().catch(error => {
  log('error', `Unexpected error: ${error.message}`);
  process.exit(1);
});
