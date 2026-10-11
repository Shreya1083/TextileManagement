import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const inventoryItems = await prisma.inventoryItem.findMany()

  // Find a sky blue yarn
  const skyBlueYarn = inventoryItems.find(i => i.color === 'Sky Blue' || i.type.toLowerCase().includes('yarn')) || inventoryItems[0]
  // Find a navy blue yarn
  const navyBlueYarn = inventoryItems.find(i => i.color === 'Navy Blue' || i.type.toLowerCase().includes('yarn')) || inventoryItems[1]
  // Find a dye or chemical
  const chemical = inventoryItems.find(i => i.type.includes('Dye')) || inventoryItems[2]
  
  if (skyBlueYarn) {
    const bom1 = await prisma.bOM.create({
      data: {
        bomId: `BOM-${Date.now()}-1`,
        productName: 'Cotton Voile - Sky Blue Premium',
        fabric: 'Cotton Voile',
        color: 'Sky Blue',
        items: {
          create: [
            {
              inventoryId: skyBlueYarn.id,
              quantity: 0.35 // 0.35kg per meter
            }
          ]
        }
      }
    })
    console.log('Created BOM 1', bom1.bomId)
  }

  if (navyBlueYarn && chemical) {
    const bom2 = await prisma.bOM.create({
      data: {
        bomId: `BOM-${Date.now()}-2`,
        productName: 'Denim - Navy Blue Heavy',
        fabric: 'Denim',
        color: 'Navy Blue',
        items: {
          create: [
            {
              inventoryId: navyBlueYarn.id,
              quantity: 0.6 // 0.6kg per meter
            },
            {
              inventoryId: chemical.id,
              quantity: 0.05 // 0.05kg dye per meter
            }
          ]
        }
      }
    })
    console.log('Created BOM 2', bom2.bomId)
  }

  console.log('Done seeding BOMs.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
