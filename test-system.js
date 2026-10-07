/**
 * Comprehensive System Testing Script
 * Tests all major functionality
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let tokens = {};
let testResults = [];

// Create axios instance
const api = axios.create({ baseURL: API_URL });

// Helper to add auth header
const withAuth = (role) => ({
  headers: { Authorization: `Bearer ${tokens[role]}` }
});

// Test result logger
const logTest = (testName, status, details = '') => {
  const result = `${status === 'PASS' ? '✅' : '❌'} ${testName}`;
  console.log(result, details ? `(${details})` : '');
  testResults.push({ testName, status, details });
};

// Main testing function
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 COMPREHENSIVE SYSTEM TESTING - March 30, 2026');
  console.log('='.repeat(60) + '\n');

  try {
    // ==================== AUTHENTICATION TESTS ====================
    console.log('\n📋 AUTHENTICATION TESTS');
    console.log('-'.repeat(60));

    // Test 1: Admin Login
    try {
      const adminRes = await api.post('/auth/login', {
        email: 'admin@college.edu',
        password: 'password123'
      });
      tokens.admin = adminRes.data.token;
      logTest('Admin Login', 'PASS', `User: ${adminRes.data.user.name}`);
    } catch (err) {
      logTest('Admin Login', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test 2: Faculty Login
    try {
      const facultyRes = await api.post('/auth/login', {
        email: 'faculty@college.edu',
        password: 'password123'
      });
      tokens.faculty = facultyRes.data.token;
      logTest('Faculty Login', 'PASS', `User: ${facultyRes.data.user.name}`);
    } catch (err) {
      logTest('Faculty Login', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test 3: Student Login
    try {
      const studentRes = await api.post('/auth/login', {
        email: 'student@college.edu',
        password: 'password123'
      });
      tokens.student = studentRes.data.token;
      logTest('Student Login', 'PASS', `User: ${studentRes.data.user.name}`);
    } catch (err) {
      logTest('Student Login', 'FAIL', err.response?.data?.message || err.message);
    }

    // ==================== CLASSROOM TESTS ====================
    console.log('\n📋 CLASSROOM MANAGEMENT TESTS');
    console.log('-'.repeat(60));

    let classroomId = null;

    // Test 4: Create Classroom (Admin only)
    try {
      const createRes = await api.post('/classrooms', {
        department: 'Computer Science',
        year: 2024,
        section: 'A'
      }, withAuth('admin'));
      classroomId = createRes.data.data._id;
      logTest('Create Classroom', 'PASS', `ID: ${classroomId.substring(0, 8)}...`);
    } catch (err) {
      logTest('Create Classroom', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test 5: Get All Classrooms
    try {
      const listRes = await api.get('/classrooms', withAuth('admin'));
      logTest('Get All Classrooms', 'PASS', `Count: ${listRes.data.data?.length || 0}`);
    } catch (err) {
      logTest('Get All Classrooms', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test 6: Get Classroom by ID
    if (classroomId) {
      try {
        const getRes = await api.get(`/classrooms/${classroomId}`, withAuth('admin'));
        logTest('Get Classroom by ID', 'PASS', `Department: ${getRes.data.data.department}`);
      } catch (err) {
        logTest('Get Classroom by ID', 'FAIL', err.response?.data?.message || err.message);
      }
    }

    // ==================== UTILITY TESTS ====================
    console.log('\n📋 UTILITY MANAGEMENT TESTS');
    console.log('-'.repeat(60));

    let utilityId = null;

    // Test 7: Create Utility
    try {
      const createRes = await api.post('/utilities', {
        name: 'Projector',
        type: 'Equipment',
        quantity: 5,
        location: 'CS Lab 1'
      }, withAuth('admin'));
      utilityId = createRes.data.data._id;
      logTest('Create Utility', 'PASS', `ID: ${utilityId.substring(0, 8)}...`);
    } catch (err) {
      logTest('Create Utility', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test 8: Get All Utilities
    try {
      const listRes = await api.get('/utilities', withAuth('admin'));
      logTest('Get All Utilities', 'PASS', `Count: ${listRes.data.data?.length || 0}`);
    } catch (err) {
      logTest('Get All Utilities', 'FAIL', err.response?.data?.message || err.message);
    }

    // ==================== LAB TESTS ====================
    console.log('\n📋 LAB MANAGEMENT TESTS');
    console.log('-'.repeat(60));

    let labId = null;

    // Test 9: Create Lab
    try {
      const createRes = await api.post('/labs', {
        labName: 'Data Structure Lab',
        department: 'Computer Science',
        capacity: 30,
        equipment: 'PCs, Projector'
      }, withAuth('admin'));
      labId = createRes.data.data._id;
      logTest('Create Lab', 'PASS', `ID: ${labId.substring(0, 8)}...`);
    } catch (err) {
      logTest('Create Lab', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test 10: Get All Labs
    try {
      const listRes = await api.get('/labs', withAuth('admin'));
      logTest('Get All Labs', 'PASS', `Count: ${listRes.data.data?.length || 0}`);
    } catch (err) {
      logTest('Get All Labs', 'FAIL', err.response?.data?.message || err.message);
    }

    // ==================== ISSUE TESTS ====================
    console.log('\n📋 ISSUE REPORTING TESTS');
    console.log('-'.repeat(60));

    let issueId = null;

    // Test 11: Create Issue (Student)
    try {
      const createRes = await api.post('/issues', {
        title: 'Projector not working',
        description: 'The projector in CS Lab 1 is not working',
        category: 'Equipment',
        priority: 'High'
      }, withAuth('student'));
      issueId = createRes.data.data._id;
      logTest('Create Issue (Student)', 'PASS', `ID: ${issueId.substring(0, 8)}...`);
    } catch (err) {
      logTest('Create Issue (Student)', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test 12: Get My Issues (Student)
    try {
      const listRes = await api.get('/issues/my', withAuth('student'));
      logTest('Get My Issues (Student)', 'PASS', `Count: ${listRes.data.data?.length || 0}`);
    } catch (err) {
      logTest('Get My Issues (Student)', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test 13: Get All Issues (Admin)
    try {
      const listRes = await api.get('/issues', withAuth('admin'));
      logTest('Get All Issues (Admin)', 'PASS', `Count: ${listRes.data.data?.length || 0}`);
    } catch (err) {
      logTest('Get All Issues (Admin)', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test 14: Update Issue Status (Admin)
    if (issueId) {
      try {
        const updateRes = await api.put(`/issues/${issueId}/status`, {
          status: 'In Progress'
        }, withAuth('admin'));
        logTest('Update Issue Status', 'PASS', `Status: ${updateRes.data.data.status}`);
      } catch (err) {
        logTest('Update Issue Status', 'FAIL', err.response?.data?.message || err.message);
      }
    }

    // Test 15: Add Comment to Issue
    if (issueId) {
      try {
        const commentRes = await api.post(`/issues/${issueId}/comments`, {
          comment: 'We will fix this ASAP'
        }, withAuth('admin'));
        logTest('Add Comment to Issue', 'PASS', `Comment added by Admin`);
      } catch (err) {
        logTest('Add Comment to Issue', 'FAIL', err.response?.data?.message || err.message);
      }
    }

    // ==================== PROJECT TESTS ====================
    console.log('\n📋 PROJECT MANAGEMENT TESTS');
    console.log('-'.repeat(60));

    let projectId = null;

    // Test 16: Create Project (Faculty)
    try {
      const createRes = await api.post('/projects', {
        projectTitle: 'Database Management System',
        subject: 'Database',
        classroomId: classroomId || '000000000000000000000000',
        deadline: new Date(Date.now() + 30*24*60*60*1000),
        maxTeamSize: 4
      }, withAuth('faculty'));
      projectId = createRes.data.data._id;
      logTest('Create Project', 'PASS', `ID: ${projectId.substring(0, 8)}...`);
    } catch (err) {
      logTest('Create Project', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test 17: Get Faculty Projects
    try {
      const listRes = await api.get('/projects/faculty-projects', withAuth('faculty'));
      logTest('Get Faculty Projects', 'PASS', `Count: ${listRes.data.data?.length || 0}`);
    } catch (err) {
      logTest('Get Faculty Projects', 'FAIL', err.response?.data?.message || err.message);
    }

    // ==================== TIMETABLE TESTS ====================
    console.log('\n📋 TIMETABLE MANAGEMENT TESTS');
    console.log('-'.repeat(60));

    // Test 18: Create Timetable
    try {
      const createRes = await api.post('/timetables', {
        department: 'Computer Science',
        year: 2024,
        imageUrl: 'https://example.com/timetable.jpg'
      }, withAuth('admin'));
      logTest('Create Timetable', 'PASS', `ID: ${createRes.data.data._id.substring(0, 8)}...`);
    } catch (err) {
      logTest('Create Timetable', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test 19: Get All Timetables
    try {
      const listRes = await api.get('/timetables', withAuth('admin'));
      logTest('Get All Timetables', 'PASS', `Count: ${listRes.data.data?.length || 0}`);
    } catch (err) {
      logTest('Get All Timetables', 'FAIL', err.response?.data?.message || err.message);
    }

    // ==================== AUTHORIZATION TESTS ====================
    console.log('\n📋 AUTHORIZATION & SECURITY TESTS');
    console.log('-'.repeat(60));

    // Test 20: Student cannot create classroom
    try {
      await api.post('/classrooms', {
        department: 'CS',
        year: 2024,
        section: 'B'
      }, withAuth('student'));
      logTest('Student Cannot Create Classroom', 'FAIL', 'Should be forbidden');
    } catch (err) {
      if (err.response?.status === 403) {
        logTest('Student Cannot Create Classroom', 'PASS', 'Correctly forbidden (403)');
      } else {
        logTest('Student Cannot Create Classroom', 'FAIL', `Wrong status: ${err.response?.status}`);
      }
    }

    // Test 21: Invalid token access
    try {
      await api.get('/classrooms', {
        headers: { Authorization: 'Bearer invalid.token.here' }
      });
      logTest('Invalid Token Rejection', 'FAIL', 'Should be unauthorized');
    } catch (err) {
      if (err.response?.status === 401) {
        logTest('Invalid Token Rejection', 'PASS', 'Correctly rejected (401)');
      } else {
        logTest('Invalid Token Rejection', 'FAIL', `Wrong status: ${err.response?.status}`);
      }
    }

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passCount = testResults.filter(r => r.status === 'PASS').length;
    const failCount = testResults.filter(r => r.status === 'FAIL').length;
    const totalTests = testResults.length;

    console.log(`\n✅ Passed: ${passCount}/${totalTests}`);
    console.log(`❌ Failed: ${failCount}/${totalTests}`);
    console.log(`⏳ Success Rate: ${((passCount/totalTests)*100).toFixed(1)}%\n`);

    if (failCount > 0) {
      console.log('Failed Tests:');
      testResults.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.testName}: ${r.details}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TESTING COMPLETE');
    console.log('='.repeat(60) + '\n');

  } catch (err) {
    console.error('❌ Critical Error:', err.message);
  }
}

// Run tests
runTests();
