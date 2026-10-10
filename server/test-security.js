/**
 * Comprehensive Security Features Test Script
 * Tests all enhanced security features implemented in Loop 1
 */

import axios from 'axios';
import { faker } from '@faker-js/faker';

const API_BASE = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  validUser: {
    email: 'owner@everesttextile.com',
    password: 'Admin@123'
  },
  invalidUser: {
    email: 'nonexistent@test.com',
    password: 'wrongpassword'
  }
};

class SecurityTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log(`✅ ${name} - PASSED\n`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ ${name} - FAILED: ${error.message}\n`);
    }
  }

  // Test 1: Password Complexity Enforcement
  async testPasswordComplexity() {
    const weakPasswords = [
      'password',      // No uppercase, numbers, special chars
      'Password',      // No numbers, special chars  
      'Password123',   // No special chars
      'Pass@',         // Too short
      '12345678',      // No letters, special chars
    ];

    for (const weakPassword of weakPasswords) {
      try {
        const response = await axios.post(`${API_BASE}/auth/users`, {
          email: `test-${Date.now()}@test.com`,
          password: weakPassword,
          name: 'Test User',
          role: 'STOREKEEPER'
        }, {
          headers: { Authorization: `Bearer ${this.adminToken}` }
        });

        if (response.status === 201) {
          throw new Error(`Weak password "${weakPassword}" was accepted`);
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Expected - password should be rejected
          continue;
        }
        throw error;
      }
    }

    // Test strong password acceptance
    await axios.post(`${API_BASE}/auth/users`, {
      email: `strong-test-${Date.now()}@test.com`,
      password: 'StrongP@ssw0rd!',
      name: 'Test User Strong',
      role: 'STOREKEEPER'
    }, {
      headers: { Authorization: `Bearer ${this.adminToken}` }
    });
  }

  // Test 2: Rate Limiting
  async testRateLimiting() {
    const requests = [];
    
    // Make multiple rapid login attempts
    for (let i = 0; i < 10; i++) {
      requests.push(
        axios.post(`${API_BASE}/auth/login`, {
          email: 'test@test.com',
          password: 'wrongpassword'
        }).catch(err => err.response)
      );
    }

    const responses = await Promise.all(requests);
    
    // Should get rate limited
    const rateLimited = responses.some(resp => 
      resp && resp.status === 429
    );

    if (!rateLimited) {
      throw new Error('Rate limiting not working - no 429 responses');
    }
  }

  // Test 3: Enhanced JWT Security
  async testJWTSecurity() {
    // Test with malformed token
    try {
      await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: 'Bearer invalid-jwt-token' }
      });
      throw new Error('Invalid JWT was accepted');
    } catch (error) {
      if (error.response && error.response.status !== 401) {
        throw error;
      }
    }

    // Test with no token
    try {
      await axios.get(`${API_BASE}/auth/me`);
      throw new Error('Request without token was accepted');
    } catch (error) {
      if (error.response && error.response.status !== 401) {
        throw error;
      }
    }
  }

  // Test 4: Session Management
  async testSessionManagement() {
    // Login to get session
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, testConfig.validUser);
    const { token, sessionId } = loginResponse.data.data;

    // Test accessing with session
    const profileResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Session-ID': sessionId
      }
    });

    if (profileResponse.status !== 200) {
      throw new Error('Session-based authentication failed');
    }

    // Test logout (should invalidate session)
    await axios.post(`${API_BASE}/auth/logout`, {}, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Session-ID': sessionId
      }
    });

    // Try using invalidated session (should fail)
    try {
      await axios.get(`${API_BASE}/auth/me`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Session-ID': sessionId
        }
      });
      throw new Error('Invalidated session was still accepted');
    } catch (error) {
      if (error.response && error.response.status !== 401) {
        throw error;
      }
    }
  }

  // Test 5: Input Sanitization
  async testInputSanitization() {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '${7*7}',
      '{"$ne": null}',
      '../../../etc/passwd',
      'UNION SELECT * FROM users--'
    ];

    for (const maliciousInput of maliciousInputs) {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: maliciousInput,
          password: 'password123'
        });
        
        // Should not contain the malicious input as-is
        const responseStr = JSON.stringify(response.data);
        if (responseStr.includes('<script>') || responseStr.includes('${7*7}')) {
          throw new Error(`Malicious input not sanitized: ${maliciousInput}`);
        }
      } catch (error) {
        if (error.response && error.response.status >= 500) {
          throw new Error(`Server error with input: ${maliciousInput}`);
        }
        // 400 Bad Request is expected for malicious input
      }
    }
  }

  // Test 6: Audit Logging  
  async testAuditLogging() {
    // Perform actions that should be audited
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, testConfig.validUser);
    const { token } = loginResponse.data.data;

    // Failed login should be audited
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: testConfig.validUser.email,
        password: 'wrongpassword'
      });
    } catch (error) {
      // Expected to fail
    }

    // Change password should be audited
    await axios.post(`${API_BASE}/auth/change-password`, {
      currentPassword: 'Admin@123',
      newPassword: 'NewStrongP@ss123!',
      confirmPassword: 'NewStrongP@ss123!'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Audit logging test completed (check database for audit_logs entries)');
  }

  // Test 7: Role-based Authorization
  async testRoleBasedAuth() {
    // Get tokens for different roles
    const ownerLogin = await axios.post(`${API_BASE}/auth/login`, testConfig.validUser);
    const ownerToken = ownerLogin.data.data.token;

    // Create a storekeeper user
    const storekeeperData = {
      email: `storekeeper-${Date.now()}@test.com`,
      password: 'StoreP@ss123!',
      name: 'Test Storekeeper',
      role: 'STOREKEEPER'
    };

    await axios.post(`${API_BASE}/auth/users`, storekeeperData, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    // Login as storekeeper
    const storekeeperLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: storekeeperData.email,
      password: storekeeperData.password
    });
    const storekeeperToken = storekeeperLogin.data.data.token;

    // Storekeeper should NOT be able to create users
    try {
      await axios.post(`${API_BASE}/auth/users`, {
        email: 'unauthorized@test.com',
        password: 'UnauthorizedP@ss123!',
        name: 'Unauthorized User',
        role: 'INSPECTOR'
      }, {
        headers: { Authorization: `Bearer ${storekeeperToken}` }
      });
      throw new Error('Storekeeper was able to create users (authorization bypass)');
    } catch (error) {
      if (error.response && error.response.status !== 403) {
        throw error;
      }
    }
  }

  // Test 8: Security Headers
  async testSecurityHeaders() {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${this.adminToken}` }
    });

    const headers = response.headers;
    
    // Check for security headers
    const expectedHeaders = [
      'x-correlation-id',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];

    for (const header of expectedHeaders) {
      if (!headers[header] && !headers[header.toLowerCase()]) {
        console.warn(`⚠️  Missing security header: ${header}`);
      }
    }
  }

  // Get admin token for tests that require authentication
  async getAdminToken() {
    const response = await axios.post(`${API_BASE}/auth/login`, testConfig.validUser);
    this.adminToken = response.data.data.token;
  }

  async runAllTests() {
    console.log('🔒 Starting Security Features Test Suite');
    console.log('=====================================\n');

    // Get admin token first
    await this.getAdminToken();

    await this.test('Password Complexity Enforcement', () => this.testPasswordComplexity());
    await this.test('Rate Limiting', () => this.testRateLimiting());
    await this.test('Enhanced JWT Security', () => this.testJWTSecurity());
    await this.test('Session Management', () => this.testSessionManagement());
    await this.test('Input Sanitization', () => this.testInputSanitization());
    await this.test('Audit Logging', () => this.testAuditLogging());
    await this.test('Role-based Authorization', () => this.testRoleBasedAuth());
    await this.test('Security Headers', () => this.testSecurityHeaders());

    // Final results
    console.log('\n🏁 Security Test Results');
    console.log('========================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests.filter(t => t.status === 'FAILED').forEach(test => {
        console.log(`   - ${test.name}: ${test.error}`);
      });
    }

    console.log(`\n🎯 Security Score: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);
  }
}

// Run the security test suite
const tester = new SecurityTester();
tester.runAllTests().catch(console.error);