import prisma from '../config/database.js';

// to aggregate revenue by month
async function getRevenue() {
  const invoices = await prisma.invoice.findMany();
  // group by month ...
}
console.log('Writing dynamic finance endpoints');
