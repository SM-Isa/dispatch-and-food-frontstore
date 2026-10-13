// scripts/load-test-cleanup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('Cleaning up load test artifacts from staging database...');

  // Delete load test order items, deliveries, status history, and orders
  const ordersDeleted = await prisma.$executeRawUnsafe(`
    DELETE FROM order_status_history WHERE order_id IN (
      SELECT id FROM orders WHERE notes LIKE '%Load test%'
    );
    DELETE FROM order_items WHERE order_id IN (
      SELECT id FROM orders WHERE notes LIKE '%Load test%'
    );
    DELETE FROM deliveries WHERE order_id IN (
      SELECT id FROM orders WHERE notes LIKE '%Load test%'
    );
    DELETE FROM orders WHERE notes LIKE '%Load test%';
  `);

  console.log(`Cleaned up orders and associated transactional records: ${ordersDeleted}`);

  // Delete load test products and vendors
  await prisma.$executeRawUnsafe(`
    DELETE FROM products WHERE name LIKE 'Menu Item %';
    DELETE FROM vendors WHERE store_name LIKE 'Load Test Kitchen %';
    DELETE FROM riders WHERE vehicle_plate LIKE 'KW-%-LRN';
    DELETE FROM webhook_events WHERE event_id LIKE 'evt_load_%';
  `);

  console.log('Cleanup completed successfully. Database restored to baseline.');
}

cleanup()
  .catch((e) => {
    console.error('Error during load test cleanup:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
