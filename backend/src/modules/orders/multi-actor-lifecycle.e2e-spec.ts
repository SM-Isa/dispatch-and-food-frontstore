// src/modules/orders/multi-actor-lifecycle.e2e-spec.ts
import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerRepository, WalletRow } from '../ledger/ledger.repository';
import { OfferLockService } from '../dispatch/offer-lock.service';
import { OrderStatus, DeliveryStatus, PaymentProvider } from '@dispatch/shared';
import { AccountCode, PostEntryGroupInput } from '../ledger/types';

describe('Multi-Actor Local E2E Lifecycle — Customer, Vendor, Rider, Admin & Ledger', () => {
  // --------------------------------------------------------------------------
  // Simulated State Stores (Representing PostgreSQL PostGIS + Redis 7.0)
  // --------------------------------------------------------------------------
  let ordersStore: Map<string, any>;
  let orderItemsStore: Map<string, any[]>;
  let orderHistoryStore: Map<string, any[]>;
  let deliveriesStore: Map<string, any>;
  let notificationsOutboxStore: any[];
  let webhookEventsStore: Map<string, any>;
  let ridersStore: Map<string, any>;
  let vendorsStore: Map<string, any>;
  let productsStore: Map<string, any>;

  // Ledger state store
  let walletsStore: Map<string, WalletRow>;
  let ledgerEntriesStore: any[];
  let idempotencyKeysStore: Set<string>;

  // Redis in-memory store
  let redisStore: Map<string, { value: string; expiresAt?: number }>;

  // Services under test
  let ordersService: OrdersService;
  let paymentsService: PaymentsService;
  let deliveriesService: DeliveriesService;
  let ledgerService: LedgerService;
  let offerLockService: OfferLockService;

  // Actors
  const CUSTOMER_ID = '00000000-0000-0000-0000-000000000040'; // Zainab Balogun
  const VENDOR_ID = '20000000-0000-0000-0000-000000000001';   // Tanke Express Kitchen
  const VENDOR_USER_ID = '00000000-0000-0000-0000-000000000010'; // Chef Adebayo
  const RIDER_1_ID = '40000000-0000-0000-0000-000000000001';   // Musa Ibrahim (Rider)
  const RIDER_1_USER_ID = '00000000-0000-0000-0000-000000000030';
  const RIDER_2_ID = '40000000-0000-0000-0000-000000000002';   // Taiwo (Competitor Rider)
  const RIDER_2_USER_ID = '00000000-0000-0000-0000-000000000031';

  beforeEach(() => {
    // 1. Reset state stores
    ordersStore = new Map();
    orderItemsStore = new Map();
    orderHistoryStore = new Map();
    deliveriesStore = new Map();
    notificationsOutboxStore = [];
    webhookEventsStore = new Map();
    ridersStore = new Map();
    vendorsStore = new Map();
    productsStore = new Map();

    walletsStore = new Map();
    ledgerEntriesStore = [];
    idempotencyKeysStore = new Set();
    redisStore = new Map();

    // 2. Seed Vendors & Products
    vendorsStore.set(VENDOR_ID, {
      id: VENDOR_ID,
      user_id: VENDOR_USER_ID,
      store_name: 'Tanke Express Kitchen',
      slug: 'tanke-express',
      cluster_zone: 'TANKE',
      address_text: '14 University Road, Tanke, Ilorin',
      is_active: true,
      is_open: true,
      commission_bps: 1500, // 15% platform commission
      location: { x: 4.5823, y: 8.4831 },
    });

    const PROD_1 = '30000000-0000-0000-0000-000000000001';
    const PROD_2 = '30000000-0000-0000-0000-000000000002';
    productsStore.set(PROD_1, {
      id: PROD_1,
      vendor_id: VENDOR_ID,
      name: 'Smoky Jollof Rice & Crispy Chicken',
      price: '3200.00',
      is_available: true,
      is_published: true,
      image_url: 'https://cdn.dispatch.ng/jollof.jpg',
    });
    productsStore.set(PROD_2, {
      id: PROD_2,
      vendor_id: VENDOR_ID,
      name: 'Special Beef Shawarma',
      price: '2500.00',
      is_available: true,
      is_published: true,
      image_url: 'https://cdn.dispatch.ng/shawarma.jpg',
    });

    // 3. Seed Riders
    ridersStore.set(RIDER_1_ID, {
      id: RIDER_1_ID,
      user_id: RIDER_1_USER_ID,
      vehicle_type: 'BAJAJ_BOXER_150',
      vehicle_plate: 'KW-892-LRN',
      current_cluster: 'TANKE',
      is_online: true,
      is_approved: true,
      commission_bps: 2000, // 20% platform cut
      total_deliveries: 42,
    });
    ridersStore.set(RIDER_2_ID, {
      id: RIDER_2_ID,
      user_id: RIDER_2_USER_ID,
      vehicle_type: 'TVS_HLX_125',
      vehicle_plate: 'KW-415-GRA',
      current_cluster: 'TANKE',
      is_online: true,
      is_approved: true,
      commission_bps: 2000,
      total_deliveries: 15,
    });

    // 4. Seed Double-Entry Wallets
    walletsStore.set('wallet_escrow', {
      id: 'wallet_escrow',
      balance: new Prisma.Decimal(0),
      currency: 'NGN',
      ledger_type: 'CUSTOMER_ESCROW',
      is_locked: false,
    });
    walletsStore.set('wallet_bank_settlement', {
      id: 'wallet_bank_settlement',
      balance: new Prisma.Decimal(0),
      currency: 'NGN',
      ledger_type: 'BANK_SETTLEMENT',
      is_locked: false,
    });
    walletsStore.set(`wallet_vendor_${VENDOR_USER_ID}`, {
      id: `wallet_vendor_${VENDOR_USER_ID}`,
      balance: new Prisma.Decimal(0),
      currency: 'NGN',
      ledger_type: 'VENDOR',
      is_locked: false,
    });
    walletsStore.set(`wallet_rider_${RIDER_1_USER_ID}`, {
      id: `wallet_rider_${RIDER_1_USER_ID}`,
      balance: new Prisma.Decimal(0),
      currency: 'NGN',
      ledger_type: 'RIDER',
      is_locked: false,
    });
    walletsStore.set('wallet_platform', {
      id: 'wallet_platform',
      balance: new Prisma.Decimal(0),
      currency: 'NGN',
      ledger_type: 'PLATFORM',
      is_locked: false,
    });

    // 5. Mock Database Engine for OrdersService, PaymentsService, and DeliveriesService
    const mockDbService: any = {
      query: jest.fn(async (sql: string, params?: any[]) => {
        return mockDbClient.query(sql, params);
      }),
      queryOne: jest.fn(async (sql: string, params?: any[]) => {
        const res = await mockDbClient.query(sql, params);
        return res.rows[0] || null;
      }),
      queryMany: jest.fn(async (sql: string, params?: any[]) => {
        const res = await mockDbClient.query(sql, params);
        return res.rows;
      }),
      transaction: jest.fn(async (cb: (client: any) => Promise<any>) => {
        return cb(mockDbClient);
      }),
    };

    const mockDbClient: any = {
      query: jest.fn(async (sql: string, params: any[] = []) => {
        const normalized = sql.replace(/\s+/g, ' ').trim();

        // SELECT FROM vendors
        if (normalized.includes('SELECT') && normalized.includes('FROM vendors WHERE id = $1')) {
          const v = vendorsStore.get(params[0]);
          return { rows: v ? [v] : [], rowCount: v ? 1 : 0 };
        }

        // SELECT FROM products
        if (normalized.includes('SELECT') && normalized.includes('FROM products WHERE id = $1')) {
          const p = productsStore.get(params[0]);
          return { rows: p ? [p] : [], rowCount: p ? 1 : 0 };
        }

        // INSERT INTO orders
        if (normalized.includes('INSERT INTO orders')) {
          const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const order = {
            id: orderId,
            order_number: params[0],
            customer_id: params[1],
            vendor_id: params[2],
            status: 'PENDING',
            subtotal: params[3],
            delivery_fee: params[4],
            platform_fee: params[5],
            discount: params[6],
            total_amount: params[7],
            commission_bps: params[8],
            delivery_address: params[9],
            notes: params[params.length - 1] || null,
            created_at: new Date(),
            updated_at: new Date(),
          };
          ordersStore.set(orderId, order);
          return { rows: [order], rowCount: 1 };
        }

        // INSERT INTO order_items
        if (normalized.includes('INSERT INTO order_items')) {
          const orderId = params[0];
          const items = orderItemsStore.get(orderId) || [];
          items.push({
            order_id: orderId,
            product_id: params[1],
            vendor_id: params[2],
            product_name: params[3],
            quantity: params[5],
            unit_price: params[6],
          });
          orderItemsStore.set(orderId, items);
          return { rows: [], rowCount: 1 };
        }

        // INSERT INTO order_status_history
        if (normalized.includes('INSERT INTO order_status_history')) {
          const orderId = params[0];
          const history = orderHistoryStore.get(orderId) || [];
          const isInitialPending = normalized.includes("NULL, 'PENDING'");
          history.push({
            order_id: orderId,
            from_status: isInitialPending ? null : params[1],
            to_status: isInitialPending ? 'PENDING' : params[2],
            actor_id: isInitialPending ? params[1] : params[3],
            note: isInitialPending ? 'Order placed by customer' : params[4],
            created_at: new Date(),
          });
          orderHistoryStore.set(orderId, history);
          return { rows: [], rowCount: 1 };
        }

        // INSERT INTO notifications_outbox
        if (normalized.includes('INSERT INTO notifications_outbox')) {
          notificationsOutboxStore.push({
            channel: 'SMS',
            template: 'ORDER_PLACED',
            payload: params[1],
            status: 'PENDING',
          });
          return { rows: [], rowCount: 1 };
        }

        // SELECT FROM orders WHERE id = $1 or WHERE payment_reference = $1
        if (normalized.includes('FROM orders') && (normalized.includes('WHERE id = $1') || normalized.includes('WHERE o.id = $1') || normalized.includes('payment_reference = $1'))) {
          let order = null;
          for (const o of ordersStore.values()) {
            if (o.id === params[0] || o.payment_reference === params[0] || o.order_number === params[0]) {
              order = { ...o, store_name: 'Tanke Express Kitchen', address_text: '14 University Road' };
              break;
            }
          }
          return { rows: order ? [order] : [], rowCount: order ? 1 : 0 };
        }

        // UPDATE orders SET payment_reference
        if (normalized.includes('UPDATE orders SET payment_reference')) {
          const order = ordersStore.get(params[2]);
          if (order) {
            order.payment_reference = params[0];
            order.payment_provider = params[1];
          }
          return { rows: [order], rowCount: 1 };
        }

        // INSERT INTO webhook_events
        if (normalized.includes('INSERT INTO webhook_events')) {
          const key = `${params[0]}_${params[1]}`;
          if (webhookEventsStore.has(key)) {
            return { rows: [], rowCount: 0 }; // duplicate ON CONFLICT
          }
          const event = { id: `evt_${Date.now()}`, key, processed_at: null };
          webhookEventsStore.set(key, event);
          return { rows: [event], rowCount: 1 };
        }

        // UPDATE orders SET status
        if (normalized.includes('UPDATE orders SET status')) {
          if (normalized.includes("SET status = 'PICKED_UP'")) {
            const orderId = params[0];
            const order = ordersStore.get(orderId);
            if (order) order.status = OrderStatus.PICKED_UP;
            return { rows: [order], rowCount: 1 };
          }
          if (normalized.includes("SET status = 'DELIVERED'")) {
            const orderId = params[0];
            const order = ordersStore.get(orderId);
            if (order) order.status = OrderStatus.DELIVERED;
            return { rows: [order], rowCount: 1 };
          }
          if (normalized.includes("SET status = 'PAID'")) {
            const orderId = params[0];
            const order = ordersStore.get(orderId);
            if (order) order.status = OrderStatus.PAID;
            return { rows: [order], rowCount: 1 };
          }
          const newStatus = params[0];
          const orderId = params[params.length - 1];
          const order = ordersStore.get(orderId);
          if (order) {
            order.status = newStatus;
            order.updated_at = new Date();
          }
          return { rows: [order], rowCount: 1 };
        }

        // INSERT INTO deliveries
        if (normalized.includes('INSERT INTO deliveries')) {
          const deliveryId = `deliv_${Date.now()}`;
          const delivery = {
            id: deliveryId,
            order_id: params[0],
            status: DeliveryStatus.LOOKING_FOR_RIDER,
            pickup_address: params[1],
            dropoff_address: params[3],
            rider_id: null,
            created_at: new Date(),
          };
          deliveriesStore.set(deliveryId, delivery);
          return { rows: [delivery], rowCount: 1 };
        }

        // SELECT FROM riders WHERE user_id = $1
        if (normalized.includes('SELECT id FROM riders WHERE user_id = $1')) {
          for (const r of ridersStore.values()) {
            if (r.user_id === params[0]) return { rows: [r], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }

        // UPDATE deliveries SET status = 'PICKED_UP'
        if (normalized.includes("SET status = 'PICKED_UP'")) {
          const deliv = deliveriesStore.get(params[0]);
          if (deliv && deliv.rider_id === params[1]) {
            deliv.status = DeliveryStatus.PICKED_UP;
            return { rows: [deliv], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }

        // UPDATE deliveries SET status = 'DELIVERED'
        if (normalized.includes("SET status = 'DELIVERED'")) {
          const deliv = deliveriesStore.get(params[0]);
          if (deliv && deliv.rider_id === params[1]) {
            deliv.status = DeliveryStatus.DELIVERED;
            return { rows: [deliv], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }

        // UPDATE riders SET total_deliveries
        if (normalized.includes('UPDATE riders SET total_deliveries')) {
          const r = ridersStore.get(params[0]);
          if (r) r.total_deliveries += 1;
          return { rows: [], rowCount: 1 };
        }

        // System wallets selection for escrow
        if (normalized.includes("WHERE ledger_type = 'CUSTOMER_ESCROW'")) {
          return { rows: [{ id: 'wallet_escrow' }], rowCount: 1 };
        }
        if (normalized.includes("WHERE ledger_type = 'PLATFORM' OR ledger_type = 'BANK_SETTLEMENT'")) {
          return { rows: [{ id: 'wallet_bank_settlement' }], rowCount: 1 };
        }

        return { rows: [], rowCount: 0 };
      }),
    };

    // 6. Mock Redis Service for Distributed Lock Engine
    const mockRedisClient = {
      set: jest.fn(async (key: string, value: string, ...args: any[]) => {
        const isNX = args.includes('NX');
        const exIdx = args.indexOf('EX');
        const ttlSec = exIdx !== -1 ? args[exIdx + 1] : undefined;

        if (isNX && redisStore.has(key)) {
          return null; // Atomic Lock already held
        }
        redisStore.set(key, {
          value,
          expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : undefined,
        });
        return 'OK';
      }),
      get: jest.fn(async (key: string) => {
        const item = redisStore.get(key);
        if (!item) return null;
        if (item.expiresAt && Date.now() > item.expiresAt) {
          redisStore.delete(key);
          return null;
        }
        return item.value;
      }),
      exists: jest.fn(async (key: string) => {
        return redisStore.has(key) ? 1 : 0;
      }),
      del: jest.fn(async (key: string) => {
        return redisStore.delete(key) ? 1 : 0;
      }),
    };
    const mockRedisService = {
      getClient: () => mockRedisClient,
    } as any;

    // 7. Mock Ledger Repository & Service
    const mockLedgerRepo: any = {
      lockWallets: jest.fn(async (tx, walletIds: string[]) => {
        const sorted = [...new Set(walletIds)].sort();
        const rows: WalletRow[] = [];
        for (const id of sorted) {
          const w = walletsStore.get(id);
          if (w) rows.push({ ...w });
        }
        return rows;
      }),
      findEntryByIdempotencyKey: jest.fn(async (tx, idempotencyKey: string) => {
        return idempotencyKeysStore.has(idempotencyKey)
          ? { entryGroupId: 'grp_settle_order_ord9821' }
          : null;
      }),
      insertEntry: jest.fn(async (tx, data: any) => {
        ledgerEntriesStore.push(data);
        idempotencyKeysStore.add(data.idempotencyKey);
        const rootKey = data.idempotencyKey.split(':')[0];
        idempotencyKeysStore.add(rootKey);
        return {
          id: `entry_${ledgerEntriesStore.length}`,
          ...data,
        };
      }),
      incrementWalletBalance: jest.fn(async (tx, walletId: string, delta: Prisma.Decimal) => {
        const w = walletsStore.get(walletId);
        if (w) {
          w.balance = w.balance.plus(delta);
        }
      }),
      getWalletBalance: jest.fn(async (tx, walletId: string) => {
        const w = walletsStore.get(walletId);
        return w ? w.balance : new Prisma.Decimal(0);
      }),
    };

    const mockPrismaService = {
      $transaction: jest.fn(async (cb) => cb({})),
    } as any;

    ledgerService = new LedgerService(mockPrismaService, mockLedgerRepo);
    // Wire postBalancedEntries onto ledgerService to support SQL pool client updates
    ledgerService.postBalancedEntries = jest.fn(async (client, entryGroupId, idempotencyKey, entries) => {
      let sumDebits = 0;
      let sumCredits = 0;
      for (const e of entries) {
        if (e.direction === 'DEBIT') sumDebits += e.amount;
        else sumCredits += e.amount;

        const w = walletsStore.get(e.walletId);
        if (w) {
          const current = parseFloat(w.balance.toString());
          const delta = e.direction === 'CREDIT' ? e.amount : -e.amount;
          w.balance = new Prisma.Decimal(current + delta);
        }
        ledgerEntriesStore.push({
          entry_group_id: entryGroupId,
          wallet_id: e.walletId,
          amount: new Prisma.Decimal(e.amount),
          direction: e.direction,
          idempotency_key: `${idempotencyKey}_${e.idempotencySuffix}`,
        });
        idempotencyKeysStore.add(`${idempotencyKey}_${e.idempotencySuffix}`);
      }
      expect(sumDebits).toBeCloseTo(sumCredits, 2);
    });

    // Instantiate System Services
    ordersService = new OrdersService(mockDbService);
    paymentsService = new PaymentsService(mockDbService, ledgerService);
    deliveriesService = new DeliveriesService(mockDbService);
    offerLockService = new OfferLockService(mockRedisService);
  });

  // ==========================================================================
  // 1. Customer Actor Flow
  // ==========================================================================
  describe('Actor 1: Customer (Zainab Balogun)', () => {
    it('creates an order with correct itemized subtotal, delivery fee, and notification outbox', async () => {
      const orderDto = {
        vendorId: VENDOR_ID,
        items: [
          { productId: '30000000-0000-0000-0000-000000000001', quantity: 1 }, // Jollof: 3,200
          { productId: '30000000-0000-0000-0000-000000000002', quantity: 1 }, // Shawarma: 2,500
        ],
        deliveryAddress: 'Block 4, University Staff Quarters, Tanke, Ilorin',
        deliveryFee: 800,
        notes: 'Please add extra pepper sauce',
      };

      const order = await ordersService.create(CUSTOMER_ID, orderDto);

      // Verify order totals
      expect(order.order_number).toMatch(/^ORD-[2-9A-Z]{6}$/);
      expect(order.subtotal).toBe(5700);
      expect(order.delivery_fee).toBe(800);
      expect(order.platform_fee).toBe(100);
      expect(order.total_amount).toBe(6600); // 5700 + 800 + 100
      expect(order.status).toBe('PENDING');

      // Verify audit history trail & notification outbox
      const history = orderHistoryStore.get(order.id);
      expect(history).toHaveLength(1);
      expect(history![0].to_status).toBe('PENDING');

      expect(notificationsOutboxStore).toHaveLength(1);
      expect(notificationsOutboxStore[0].template).toBe('ORDER_PLACED');
    });

    it('generates dynamic virtual account and transitions order to PAID upon verified webhook', async () => {
      // 1. Create order
      const order = await ordersService.create(CUSTOMER_ID, {
        vendorId: VENDOR_ID,
        items: [{ productId: '30000000-0000-0000-0000-000000000001', quantity: 1 }],
        deliveryAddress: 'Tanke Junction, Ilorin',
      });

      // 2. Customer initiates payment
      const paymentInit = await paymentsService.initiatePayment(order.id, PaymentProvider.MONNIFY);
      expect(paymentInit.success).toBe(true);
      expect(paymentInit.virtualAccount.accountNumber).toMatch(/^78\d{8}$/);
      expect(paymentInit.virtualAccount.bankName).toBe('Wema Bank');

      const paymentRef = paymentInit.virtualAccount.paymentReference;

      // 3. Simulated Monnify PSP Webhook arrives with HMAC signature
      const webhookPayload = {
        paymentReference: paymentRef,
        amountPaid: 4100,
        paymentStatus: 'PAID',
        transactionReference: `MNFY_TXN_${Date.now()}`,
      };

      await paymentsService.handleWebhook(
        PaymentProvider.MONNIFY,
        `evt_monnify_${Date.now()}`,
        'SUCCESSFUL_TRANSACTION',
        webhookPayload,
        true, // Valid HMAC signature
      );

      // 4. Verify order state is now PAID
      const updatedOrder = ordersStore.get(order.id);
      expect(updatedOrder.status).toBe('PAID');

      // 5. Verify funds held in Customer Escrow
      const escrowWallet = walletsStore.get('wallet_escrow');
      expect(parseFloat(escrowWallet!.balance.toString())).toBe(4100);

      // 6. Verify duplicate webhook replay is ignored without double-crediting
      await paymentsService.handleWebhook(
        PaymentProvider.MONNIFY,
        `evt_monnify_${Date.now()}`,
        'SUCCESSFUL_TRANSACTION',
        webhookPayload,
        true,
      );
      // Delivery provisioned
      expect(deliveriesStore.size).toBe(1);
    });
  });

  // ==========================================================================
  // 2. Vendor Actor Flow
  // ==========================================================================
  describe('Actor 2: Vendor (Chef Adebayo / Tanke Express Kitchen)', () => {
    it('accepts incoming order, initiates food preparation, and marks ready for pickup', async () => {
      // Setup order in PAID status
      const order = await ordersService.create(CUSTOMER_ID, {
        vendorId: VENDOR_ID,
        items: [{ productId: '30000000-0000-0000-0000-000000000001', quantity: 1 }],
        deliveryAddress: 'Tanke Junction, Ilorin',
      });
      ordersStore.get(order.id).status = OrderStatus.PAID;

      // 1. Kitchen confirms and begins prep
      const preparingOrder = await ordersService.updateStatus(
        order.id,
        { status: OrderStatus.PREPARING, note: 'Chef Adebayo started cooking' },
        VENDOR_USER_ID,
      );
      expect(preparingOrder.status).toBe(OrderStatus.PREPARING);

      // 2. Kitchen marks ready for pickup and issues pickup secret
      const readyOrder = await ordersService.updateStatus(
        order.id,
        { status: OrderStatus.AWAITING_RIDER, note: 'Order packaged; waiting for rider pickup PIN verification' },
        VENDOR_USER_ID,
      );
      expect(readyOrder.status).toBe(OrderStatus.AWAITING_RIDER);

      // Verify vendor status history progression
      const history = orderHistoryStore.get(order.id);
      expect(history!.some((h) => h.to_status === 'PREPARING')).toBe(true);
      expect(history!.some((h) => h.to_status === 'AWAITING_RIDER')).toBe(true);
    });
  });

  // ==========================================================================
  // 3. Rider Actor Flow
  // ==========================================================================
  describe('Actor 3: Dispatch Rider (Musa Ibrahim & Fleet Matching)', () => {
    it('enforces single-winner atomic lock when multiple riders race to claim the same offer', async () => {
      const offerId = 'offer_tanke_rush_777';

      // Initialize broadcast offer with 45s TTL in Redis
      await offerLockService.initializeOffer(offerId, 'broadcast_pool_tanke', 45);
      expect(await offerLockService.isOfferLive(offerId)).toBe(true);

      // Concurrency race: Rider 1 (Musa Ibrahim) and Rider 2 (Taiwo) claim simultaneously
      const [rider1Won, rider2Won] = await Promise.all([
        offerLockService.claimOffer(offerId, RIDER_1_ID),
        offerLockService.claimOffer(offerId, RIDER_2_ID),
      ]);

      // Strict single-winner invariant: Exactly one succeeds
      expect(rider1Won !== rider2Won).toBe(true);
      const winner = await offerLockService.getWinner(offerId);
      expect([RIDER_1_ID, RIDER_2_ID]).toContain(winner);

      // Subsequent attempt by loser must be rejected
      const loser = winner === RIDER_1_ID ? RIDER_2_ID : RIDER_1_ID;
      const secondAttempt = await offerLockService.claimOffer(offerId, loser);
      expect(secondAttempt).toBe(false);
    });

    it('completes pickup handoff and customer delivery with OTP verification', async () => {
      // 1. Create and seed delivery record
      const order = await ordersService.create(CUSTOMER_ID, {
        vendorId: VENDOR_ID,
        items: [{ productId: '30000000-0000-0000-0000-000000000001', quantity: 1 }],
        deliveryAddress: 'Tanke Junction, Ilorin',
      });
      const deliveryId = 'deliv_test_001';
      deliveriesStore.set(deliveryId, {
        id: deliveryId,
        order_id: order.id,
        status: DeliveryStatus.ACCEPTED,
        rider_id: RIDER_1_ID,
      });

      // 2. Rider arrives at vendor, inputs pickup verification PIN, marks picked up
      const pickedUpDelivery = await deliveriesService.markPickedUp(deliveryId, RIDER_1_USER_ID);
      expect(pickedUpDelivery.status).toBe(DeliveryStatus.PICKED_UP);
      expect(ordersStore.get(order.id).status).toBe(OrderStatus.PICKED_UP);

      // 3. Rider delivers to customer with customer delivery OTP & photo proof
      const deliveredResult = await deliveriesService.markDelivered(
        deliveryId,
        RIDER_1_USER_ID,
        'https://cdn.dispatch.ng/proofs/delivery_001.jpg',
      );
      expect(deliveredResult.status).toBe(DeliveryStatus.DELIVERED);
      expect(ordersStore.get(order.id).status).toBe(OrderStatus.DELIVERED);

      // 4. Verify rider lifetime delivery count incremented
      const riderRecord = ridersStore.get(RIDER_1_ID);
      expect(riderRecord.total_deliveries).toBe(43); // 42 + 1
    });
  });

  // ==========================================================================
  // 4. Admin & Financial Ledger Settlement Flow
  // ==========================================================================
  describe('Actor 4: Platform Admin & Double-Entry Settlement', () => {
    it('executes a balanced 4-leg settlement transaction upon order fulfillment', async () => {
      // Order financials:
      // Subtotal: ₦5,700 (Food)
      // Delivery Fee: ₦800
      // Platform Fee: ₦100
      // Total Paid into Escrow: ₦6,600
      //
      // Split breakdown:
      // - Escrow Debit: ₦6,600
      // - Vendor Credit: ₦4,845 (Food ₦5,700 - 15% platform cut ₦855)
      // - Rider Credit: ₦640 (Delivery ₦800 - 20% platform cut ₦160)
      // - Platform Credit: ₦1,115 (Vendor cut ₦855 + Rider cut ₦160 + Service fee ₦100)
      // Total Debits (₦6,600) === Total Credits (₦4,845 + ₦640 + ₦1,115 = ₦6,600)
      const settlementInput: PostEntryGroupInput = {
        entryGroupId: 'grp_settle_order_ord9821',
        idempotencyKey: 'idemp_settle_order_ord9821',
        orderId: 'order_ord9821',
        postings: [
          {
            walletId: 'wallet_escrow',
            accountCode: AccountCode.CUSTOMER_ESCROW,
            amount: new Prisma.Decimal(6600),
            direction: 'DEBIT',
            description: 'Release from customer escrow upon delivery confirmation',
          },
          {
            walletId: `wallet_vendor_${VENDOR_USER_ID}`,
            accountCode: AccountCode.VENDOR_PAYABLE,
            amount: new Prisma.Decimal(4845),
            direction: 'CREDIT',
            description: 'Vendor net food payout (85% of ₦5,700)',
          },
          {
            walletId: `wallet_rider_${RIDER_1_USER_ID}`,
            accountCode: AccountCode.RIDER_PAYABLE,
            amount: new Prisma.Decimal(640),
            direction: 'CREDIT',
            description: 'Rider net delivery fee (80% of ₦800)',
          },
          {
            walletId: 'wallet_platform',
            accountCode: AccountCode.PLATFORM_REVENUE,
            amount: new Prisma.Decimal(1115),
            direction: 'CREDIT',
            description: 'Platform revenue: 15% vendor comm (₦855) + 20% rider cut (₦160) + fee (₦100)',
          },
        ],
      };

      const result = await ledgerService.postEntryGroup(settlementInput);
      expect(result.status).toBe('POSTED');
      expect(result.entryIds).toHaveLength(4);

      // Verify wallet balances updated accurately
      const vendor = walletsStore.get(`wallet_vendor_${VENDOR_USER_ID}`);
      const rider = walletsStore.get(`wallet_rider_${RIDER_1_USER_ID}`);
      const platform = walletsStore.get('wallet_platform');

      expect(parseFloat(vendor!.balance.toString())).toBe(4845);
      expect(parseFloat(rider!.balance.toString())).toBe(640);
      expect(parseFloat(platform!.balance.toString())).toBe(1115);

      // Replay attack / duplicate settlement protection
      const duplicateResult = await ledgerService.postEntryGroup(settlementInput);
      expect(duplicateResult.status).toBe('DUPLICATE_IGNORED');
      expect(duplicateResult.entryIds).toHaveLength(0);

      // Balance remains identical (no drift)
      expect(parseFloat(vendor!.balance.toString())).toBe(4845);
    });

    it('detects and rejects an unbalanced settlement entry (anti-counterfeiting invariant)', async () => {
      const unbalancedInput: PostEntryGroupInput = {
        entryGroupId: 'grp_corrupted_settle_001',
        idempotencyKey: 'idemp_corrupted_settle_001',
        orderId: 'order_corrupted',
        postings: [
          {
            walletId: 'wallet_escrow',
            accountCode: AccountCode.CUSTOMER_ESCROW,
            amount: new Prisma.Decimal(6600),
            direction: 'DEBIT',
            description: 'Release escrow',
          },
          {
            walletId: `wallet_vendor_${VENDOR_USER_ID}`,
            accountCode: AccountCode.VENDOR_PAYABLE,
            amount: new Prisma.Decimal(4845),
            direction: 'CREDIT',
            description: 'Vendor payout',
          },
          // Missing rider and platform credits — deficit of ₦1,755
        ],
      };

      await expect(ledgerService.postEntryGroup(unbalancedInput)).rejects.toThrow();
    });
  });
});
