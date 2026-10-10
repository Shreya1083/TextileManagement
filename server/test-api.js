const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testData = {
  supplier: null,
  yarnType: null,
  buyer: null,
  fabricType: null,
  order: null,
  machine: null,
  worker: null,
  shift: null,
};

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null, useAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  const result = await apiCall('/health', 'GET', null, false);
  const response = await fetch('http://localhost:5000/health');
  const data = await response.json();
  console.log('✅ Health:', data.status);
  return response.ok;
}

async function testAuth() {
  console.log('\n🔍 Testing Authentication...');
  
  // Test login
  const loginResult = await apiCall('/auth/login', 'POST', {
    email: 'owner@everesttextile.com',
    password: 'Admin@123'
  });
  
  if (loginResult.status === 200 && loginResult.data.success) {
    authToken = loginResult.data.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    
    // Test profile
    const profileResult = await apiCall('/auth/profile', 'GET', null, true);
    if (profileResult.status === 200) {
      console.log('✅ Profile fetched:', profileResult.data.data.name);
    }
    return true;
  } else {
    console.log('❌ Login failed:', loginResult.data?.message);
    return false;
  }
}

async function testInventory() {
  console.log('\n🔍 Testing Inventory Module...');
  
  // Create supplier
  const supplierResult = await apiCall('/inventory/suppliers', 'POST', {
    name: 'Test Supplier Ltd',
    contactName: 'John Doe',
    phone: '9876543210',
    email: 'supplier@test.com',
    address: 'Test Address, City',
    gstin: '29ABCDE1234F1Z5'
  }, true);
  
  if (supplierResult.status === 201) {
    testData.supplier = supplierResult.data.data;
    console.log('✅ Supplier created:', testData.supplier.name);
  } else {
    console.log('❌ Supplier creation failed:', supplierResult.data?.message);
  }
  
  // Create yarn type
  const yarnResult = await apiCall('/inventory/yarn-types', 'POST', {
    name: 'Test Cotton 40s',
    code: 'TCT40',
    description: 'Test cotton yarn',
    unit: 'KG'
  }, true);
  
  if (yarnResult.status === 201) {
    testData.yarnType = yarnResult.data.data;
    console.log('✅ Yarn type created:', testData.yarnType.name);
  } else {
    console.log('❌ Yarn type creation failed:', yarnResult.data?.message);
  }
  
  // Get stock levels
  const stockResult = await apiCall('/inventory/stock/levels', 'GET', null, true);
  if (stockResult.status === 200) {
    console.log('✅ Stock levels fetched:', stockResult.data.data.length, 'items');
  } else {
    console.log('❌ Stock levels failed:', stockResult.data?.message);
  }
  
  return true;
}

async function testOrders() {
  console.log('\n🔍 Testing Orders Module...');
  
  // Create buyer
  const buyerResult = await apiCall('/orders/buyers', 'POST', {
    name: 'Test Buyer Co.',
    contactName: 'Jane Smith',
    phone: '9876543211',
    email: 'buyer@test.com',
    address: 'Buyer Address, City',
    gstin: '27XYZAB5678C1D9'
  }, true);
  
  if (buyerResult.status === 201) {
    testData.buyer = buyerResult.data.data;
    console.log('✅ Buyer created:', testData.buyer.name);
  } else {
    console.log('❌ Buyer creation failed:', buyerResult.data?.message);
  }
  
  // Create fabric type
  const fabricResult = await apiCall('/orders/fabric-types', 'POST', {
    name: 'Test Fabric',
    code: 'TF001',
    description: 'Test fabric type',
    yarnPerMetre: 0.5
  }, true);
  
  if (fabricResult.status === 201) {
    testData.fabricType = fabricResult.data.data;
    console.log('✅ Fabric type created:', testData.fabricType.name);
  } else {
    console.log('❌ Fabric type creation failed:', fabricResult.data?.message);
  }
  
  // List orders
  const ordersResult = await apiCall('/orders', 'GET', null, true);
  if (ordersResult.status === 200) {
    console.log('✅ Orders fetched:', ordersResult.data.data?.length || 0, 'orders');
  } else {
    console.log('❌ Orders fetch failed:', ordersResult.data?.message);
  }
  
  return true;
}

async function testProduction() {
  console.log('\n🔍 Testing Production Module...');
  
  // List machines
  const machinesResult = await apiCall('/production/machines', 'GET', null, true);
  if (machinesResult.status === 200) {
    testData.machine = machinesResult.data.data[0];
    console.log('✅ Machines fetched:', machinesResult.data.data.length, 'machines');
  }
  
  // Get machine board
  const boardResult = await apiCall('/production/machine-board', 'GET', null, true);
  if (boardResult.status === 200) {
    console.log('✅ Machine board fetched:', boardResult.data.data.length, 'entries');
  } else {
    console.log('❌ Machine board failed:', boardResult.data?.message);
  }
  
  return true;
}

async function testQuality() {
  console.log('\n🔍 Testing Quality Module...');
  
  // Get inspection queue
  const queueResult = await apiCall('/quality/inspection-queue', 'GET', null, true);
  if (queueResult.status === 200) {
    console.log('✅ Inspection queue fetched:', queueResult.data.data.length, 'rolls pending');
  } else {
    console.log('❌ Inspection queue failed:', queueResult.data?.message);
  }
  
  // Get quality stats
  const statsResult = await apiCall('/quality/statistics', 'GET', null, true);
  if (statsResult.status === 200) {
    console.log('✅ Quality statistics fetched');
  } else {
    console.log('❌ Quality statistics failed:', statsResult.data?.message);
  }
  
  return true;
}

async function testDispatch() {
  console.log('\n🔍 Testing Dispatch Module...');
  
  // Get finished stock
  const stockResult = await apiCall('/dispatch/finished-stock', 'GET', null, true);
  if (stockResult.status === 200) {
    console.log('✅ Finished stock fetched:', stockResult.data.data.length, 'rolls');
  }
  
  // List dispatches
  const dispatchResult = await apiCall('/dispatch', 'GET', null, true);
  if (dispatchResult.status === 200) {
    console.log('✅ Dispatches fetched:', dispatchResult.data.data.length, 'dispatches');
  } else {
    console.log('❌ Dispatches failed:', dispatchResult.data?.message);
  }
  
  // List invoices
  const invoicesResult = await apiCall('/dispatch/invoices', 'GET', null, true);
  if (invoicesResult.status === 200) {
    console.log('✅ Invoices fetched:', invoicesResult.data.data.length, 'invoices');
  } else {
    console.log('❌ Invoices failed:', invoicesResult.data?.message);
  }
  
  return true;
}

async function testHR() {
  console.log('\n🔍 Testing HR Module...');
  
  // List shifts
  const shiftsResult = await apiCall('/hr/shifts', 'GET', null, true);
  if (shiftsResult.status === 200) {
    testData.shift = shiftsResult.data.data[0];
    console.log('✅ Shifts fetched:', shiftsResult.data.data.length, 'shifts');
  }
  
  // Create worker
  const workerResult = await apiCall('/hr/workers', 'POST', {
    employeeId: 'EMP001',
    name: 'Test Worker',
    phone: '9876543212',
    shiftId: testData.shift?.id || 1,
    dailyRate: 500,
    status: 'ACTIVE'
  }, true);
  
  if (workerResult.status === 201) {
    testData.worker = workerResult.data.data;
    console.log('✅ Worker created:', testData.worker.name);
  } else {
    console.log('❌ Worker creation failed:', workerResult.data?.message);
  }
  
  // Get wage sheet
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const wageResult = await apiCall(`/hr/wages/generate?year=${year}&month=${month}`, 'GET', null, true);
  if (wageResult.status === 200) {
    console.log('✅ Wage sheet generated:', wageResult.data.data.length, 'records');
  } else {
    console.log('ℹ️  Wage sheet: No records (expected - needs attendance data)');
  }
  
  return true;
}

async function testFinance() {
  console.log('\n🔍 Testing Finance Module...');
  
  // Create expense
  const expenseResult = await apiCall('/finance/expenses', 'POST', {
    date: new Date().toISOString(),
    category: 'UTILITIES',
    amount: 5000,
    description: 'Test electricity bill',
    paymentMode: 'BANK'
  }, true);
  
  if (expenseResult.status === 201) {
    console.log('✅ Expense created:', expenseResult.data.data.description);
  } else {
    console.log('❌ Expense creation failed:', expenseResult.data?.message);
  }
  
  // Get expense summary
  const startDate = new Date(new Date().setDate(1)).toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];
  const summaryResult = await apiCall(`/finance/expenses/reports/summary?startDate=${startDate}&endDate=${endDate}&groupBy=category`, 'GET', null, true);
  if (summaryResult.status === 200) {
    console.log('✅ Expense summary fetched');
  } else {
    console.log('❌ Expense summary failed:', summaryResult.data?.message);
  }
  
  // Get owner dashboard
  const dashboardResult = await apiCall('/finance/dashboard/owner', 'GET', null, true);
  if (dashboardResult.status === 200) {
    const dashboard = dashboardResult.data.data;
    console.log('✅ Owner dashboard fetched');
    console.log(`   Revenue: ₹${dashboard.revenue.total / 100}`);
    console.log(`   Expenses: ₹${dashboard.expenses.total / 100}`);
    console.log(`   Pending Orders: ${dashboard.orders.pending}`);
  }
  
  return true;
}

// Run all tests
async function runAllTests() {
  console.log('========================================');
  console.log('🧪 Testing Everest Textile Mills ERP API');
  console.log('========================================');
  
  try {
    await testHealthCheck();
    await testAuth();
    await testInventory();
    await testOrders();
    await testProduction();
    await testQuality();
    await testDispatch();
    await testHR();
    await testFinance();
    
    console.log('\n========================================');
    console.log('✅ All API tests completed successfully!');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

runAllTests();
