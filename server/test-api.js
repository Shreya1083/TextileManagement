const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

const credentials = {
  email: process.env.SMOKE_EMAIL || 'owner@everesttextile.com',
  password: process.env.SMOKE_PASSWORD || 'Admin@123',
};

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = body?.message || body?.error || response.statusText;
    throw new Error(`${options.method || 'GET'} ${path} failed (${response.status}): ${message}`);
  }

  return body;
}

async function main() {
  const health = await fetch(`${BASE_URL}/health`);
  if (!health.ok) {
    throw new Error(`Health check failed (${health.status})`);
  }
  console.log('health OK');

  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  const token = login?.data?.token;
  if (!token) {
    throw new Error('Login response did not include a token');
  }
  console.log('login OK');

  const authHeaders = { Authorization: `Bearer ${token}` };
  const routes = [
    '/auth/me',
    '/inventory/stock',
    '/inventory/stock/ledger',
    '/inventory/yarn-types',
    '/orders/orders',
    '/production/machines',
    '/quality/rolls',
    '/dispatch/finished-stock',
    '/dispatch/dispatches',
    '/dispatch/invoices',
    '/hr/workers',
    '/finance/payments',
    '/analytics/overview',
  ];

  for (const route of routes) {
    await request(route, { headers: authHeaders });
    console.log(`${route} OK`);
  }

  console.log('backend smoke test OK');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
