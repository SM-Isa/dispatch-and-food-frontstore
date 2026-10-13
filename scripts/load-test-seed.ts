// scripts/load-test-seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding load test data for staging environment...');

  // 1. Create 50 test vendors across Ilorin clusters
  const clusters = ['TANKE', 'GRA', 'CHALLENGE', 'FATE'];
  const vendors = [];

  for (let i = 0; i < 50; i++) {
    const slug = `load-test-vendor-${i}-${Date.now()}`;
    const v = await prisma.vendor.create({
      data: {
        userId: `00000000-0000-0000-0000-${(100 + i).toString().padStart(12, '0')}`,
        storeName: `Load Test Kitchen ${i}`,
        slug,
        clusterZone: clusters[i % clusters.length] as any,
        addressText: `${10 + i} University Road, Ilorin`,
        isActive: true,
        isOpen: true,
        commissionBps: 1500,
        phoneNumber: `+234801111${i.toString().padStart(4, '0')}`,
      },
    });
    vendors.push(v);
  }

  // 2. Create products for each vendor
  const products = [];
  for (const v of vendors) {
    for (let p = 1; p <= 5; p++) {
      const prod = await prisma.product.create({
        data: {
          vendorId: v.id,
          name: `Menu Item ${p} - ${v.storeName}`,
          price: 1500 + p * 500,
          isAvailable: true,
          isPublished: true,
          category: 'Meals',
        },
      });
      products.push(prod);
    }
  }

  // 3. Create 50 test riders
  const riders = [];
  for (let i = 0; i < 50; i++) {
    const r = await prisma.rider.create({
      data: {
        userId: `00000000-0000-0000-0000-${(200 + i).toString().padStart(12, '0')}`,
        vehicleType: 'BAJAJ_BOXER_150',
        vehiclePlate: `KW-${(100 + i)}-LRN`,
        currentCluster: clusters[i % clusters.length] as any,
        isApproved: true,
        isOnline: true,
        commissionBps: 2000,
        guarantorName: `Guarantor ${i}`,
        guarantorPhone: `+234802222${i.toString().padStart(4, '0')}`,
      },
    });
    riders.push(r);
  }

  console.log(`Successfully seeded:`);
  console.log(`  - ${vendors.length} vendors`);
  console.log(`  - ${products.length} products`);
  console.log(`  - ${riders.length} riders`);

  console.log('\n--- Export Environment Variables for k6 ---');
  console.log(`VENDOR_IDS=${vendors.slice(0, 10).map((v) => v.id).join(',')}`);
  console.log(`PRODUCT_IDS=${products.slice(0, 20).map((p) => p.id).join(',')}`);
  console.log(`RIDER_IDS=${riders.slice(0, 10).map((r) => r.id).join(',')}`);
}

seed()
  .catch((e) => {
    console.error('Error during load test seeding:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
