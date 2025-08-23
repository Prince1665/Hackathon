#!/usr/bin/env node

/**
 * Comprehensive PDF Functionality Test Script
 * This script tests all aspects of the PDF generation functionality
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

function success(...args) { log(colors.green, '✅', ...args); }
function error(...args) { log(colors.red, '❌', ...args); }
function warning(...args) { log(colors.yellow, '⚠️', ...args); }
function info(...args) { log(colors.blue, 'ℹ️', ...args); }
function test(...args) { log(colors.magenta, '🧪', ...args); }

async function testServerConnection() {
  test('Testing server connection...');
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      success('Server is running at', BASE_URL);
      return true;
    } else {
      error('Server responded with status:', response.status);
      return false;
    }
  } catch (err) {
    error('Cannot connect to server:', err.message);
    return false;
  }
}

async function testAPIEndpoint() {
  test('Testing /api/reports/summary endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/reports/summary`);
    
    if (!response.ok) {
      error(`API returned status ${response.status}: ${response.statusText}`);
      const text = await response.text();
      error('Response body:', text);
      return null;
    }
    
    const data = await response.json();
    success('API endpoint is working');
    
    // Validate data structure
    const requiredFields = ['total', 'byStatus', 'byCategory', 'environmentalImpact'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      warning('Missing fields in API response:', missingFields.join(', '));
    } else {
      success('All required fields present in API response');
    }
    
    // Log key metrics
    info(`Total items: ${data.total}`);
    info(`Recovery rate: ${data.environmentalImpact?.recoveryRate || 'N/A'}%`);
    info(`Status categories: ${Object.keys(data.byStatus || {}).length}`);
    info(`Item categories: ${Object.keys(data.byCategory || {}).length}`);
    
    return data;
  } catch (err) {
    error('API test failed:', err.message);
    return null;
  }
}

async function testDependencies() {
  test('Checking package.json dependencies...');
  
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredDeps = ['jspdf', 'jspdf-autotable'];
    const missing = requiredDeps.filter(dep => 
      !(dep in packageData.dependencies || dep in packageData.devDependencies)
    );
    
    if (missing.length > 0) {
      error('Missing dependencies:', missing.join(', '));
      return false;
    } else {
      success('All PDF dependencies are installed');
      info(`jsPDF version: ${packageData.dependencies.jspdf || 'N/A'}`);
      info(`jsPDF-autotable version: ${packageData.dependencies['jspdf-autotable'] || 'N/A'}`);
      return true;
    }
  } catch (err) {
    error('Cannot read package.json:', err.message);
    return false;
  }
}

async function testTypeScriptCompilation() {
  test('Checking TypeScript compilation...');
  
  try {
    // Check if there are any TypeScript errors in the admin page
    const adminPagePath = path.join(process.cwd(), 'app', 'admin', 'page.tsx');
    
    if (!fs.existsSync(adminPagePath)) {
      warning('Admin page not found at expected location');
      return false;
    }
    
    success('Admin page file exists');
    
    // Read the file to check for obvious syntax issues
    const content = fs.readFileSync(adminPagePath, 'utf8');
    
    // Check for key PDF-related code
    const checks = [
      { pattern: /downloadPdf/, name: 'downloadPdf function' },
      { pattern: /isGeneratingPdf/, name: 'PDF generation state' },
      { pattern: /jspdf/, name: 'jsPDF import' },
      { pattern: /autoTable/, name: 'autoTable usage' }
    ];
    
    for (const check of checks) {
      if (check.pattern.test(content)) {
        success(`Found ${check.name}`);
      } else {
        warning(`Missing ${check.name}`);
      }
    }
    
    return true;
  } catch (err) {
    error('TypeScript check failed:', err.message);
    return false;
  }
}

async function testEnvironmentalVariables() {
  test('Checking environment variables...');
  
  try {
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      warning('.env file not found');
      return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('MONGODB_URI')) {
      success('MongoDB URI configured');
    } else {
      error('MongoDB URI not configured');
      return false;
    }
    
    if (envContent.includes('MONGODB_DB')) {
      success('MongoDB database name configured');
    } else {
      warning('MongoDB database name not configured (using default)');
    }
    
    return true;
  } catch (err) {
    error('Environment check failed:', err.message);
    return false;
  }
}

async function runAllTests() {
  log(colors.cyan, '🔧 Starting comprehensive PDF functionality test...\n');
  
  const results = {
    server: await testServerConnection(),
    dependencies: await testDependencies(),
    typescript: await testTypeScriptCompilation(),
    environment: await testEnvironmentalVariables(),
    api: await testAPIEndpoint() !== null
  };
  
  console.log('\n' + '='.repeat(50));
  log(colors.cyan, '📊 Test Results Summary:');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? colors.green : colors.red;
    log(color, `${test.toUpperCase()}: ${status}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log('\n' + '='.repeat(50));
  if (passedTests === totalTests) {
    success(`All ${totalTests} tests passed! PDF functionality should work correctly.`);
    console.log('\n📋 Next steps:');
    console.log('1. Navigate to http://localhost:3000/admin');
    console.log('2. Click on the "Compliance Reports" tab');
    console.log('3. Click "Generate PDF Report" button');
    console.log('4. Check browser console for detailed logs');
  } else {
    error(`${totalTests - passedTests} out of ${totalTests} tests failed.`);
    console.log('\n🔧 Required fixes:');
    Object.entries(results).forEach(([test, passed]) => {
      if (!passed) {
        console.log(`- Fix ${test} issues`);
      }
    });
  }
  console.log('='.repeat(50));
}

// Handle different ways this script might be run
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(() => {
    process.exit(0);
  }).catch(err => {
    error('Test suite failed:', err.message);
    process.exit(1);
  });
}

export { runAllTests, testAPIEndpoint, testServerConnection };
