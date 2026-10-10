import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const firstNames = ['Amit', 'Rahul', 'Sanjay', 'Vikas', 'Mohan', 'Raju', 'Ajay', 'Deepak', 'Manoj', 'Prakash', 'Sunil', 'Anil', 'Ramesh', 'Suresh', 'Dinesh', 'Vinod', 'Rajesh', 'Kamlesh', 'Brijesh', 'Mukesh']
const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Verma', 'Yadav', 'Gupta', 'Chauhan', 'Thakur', 'Mishra']
const roles = ['Spinner Operator', 'Weaver', 'Dyer', 'Finisher', 'Quality Inspector', 'Store Keeper', 'Helper']
const depts = ['Production', 'QC', 'Store', 'Admin']
const shifts = ['Morning', 'Afternoon', 'Night']

async function main() {
  const workers = []
  for (let i = 1; i <= 25; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)]
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)]
    const name = fn + ' ' + ln
    const role = roles[Math.floor(Math.random() * roles.length)]
    const dept = depts[Math.floor(Math.random() * depts.length)]
    const shift = shifts[Math.floor(Math.random() * shifts.length)]
    const rfidUid = Math.random().toString(16).substring(2,10).toUpperCase().match(/.{1,2}/g).join(':')
    const wage = Math.floor(Math.random() * 400) + 400

    workers.push({
      workerId: 'W-' + (100 + i).toString().padStart(3, '0'),
      name: name,
      role: role,
      dept: dept,
      wage: wage,
      basis: 'daily',
      shift: shift,
      contact: '+91' + Math.floor(1000000000 + Math.random() * 9000000000),
      email: fn.toLowerCase() + '@everest.com',
      rfidUid: rfidUid
    })
  }

  await prisma.worker.createMany({
    data: workers
  })

  console.log('Seeded 25 workers successfully!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
