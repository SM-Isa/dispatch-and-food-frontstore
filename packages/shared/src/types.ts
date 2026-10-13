import {
  UserRole,
  OrderStatus,
  DeliveryStatus,
  WalletType,
  LedgerDirection,
  PayoutStatus,
  DispatchResponse,
  NotificationChannel,
  PaymentProvider,
} from './enums';
import { AccountCode } from './chart-of-accounts';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  phone_number: string;
  phone_verified_at?: string | null;
  email?: string | null;
  full_name?: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
  slug: string;
  cluster_zone: string;
  location: GeoPoint;
  address_text?: string | null;
  is_active: boolean;
  is_open: boolean;
  logo_url?: string | null;
  banner_url?: string | null;
  phone_number?: string | null;
  commission_bps: number; // e.g. 1500 = 15.00%
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description?: string | null;
  price: number;
  is_available: boolean;
  is_published: boolean;
  image_url?: string | null;
  sort_order: number;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  vendor_id: string;
  product_name: string;
  product_image_url?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  notes?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  vendor_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  platform_fee: number;
  discount: number;
  total_amount: number;
  commission_bps: number;
  payment_reference?: string | null;
  payment_provider?: PaymentProvider | null;
  paid_at?: string | null;
  delivery_address: string;
  delivery_location?: GeoPoint | null;
  notes?: string | null;
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status?: OrderStatus | null;
  to_status: OrderStatus;
  actor_id?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface Rider {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_plate?: string | null;
  guarantor_name?: string | null;
  guarantor_phone?: string | null;
  current_cluster?: string | null;
  is_online: boolean;
  is_approved: boolean;
  last_heartbeat_at?: string | null;
  last_location?: GeoPoint | null;
  rating_avg: number;
  total_deliveries: number;
  commission_bps: number;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  rider_id?: string | null;
  status: DeliveryStatus;
  pickup_address: string;
  pickup_location: GeoPoint;
  dropoff_address: string;
  dropoff_location: GeoPoint;
  distance_meters?: number | null;
  estimated_minutes?: number | null;
  offered_at?: string | null;
  accepted_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  failed_reason?: string | null;
  proof_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiderDispatchAttempt {
  id: string;
  delivery_id: string;
  rider_id: string;
  offered_at: string;
  responded_at?: string | null;
  response: DispatchResponse;
  distance_meters?: number | null;
  offer_round: number;
}

export interface Wallet {
  id: string;
  owner_id?: string | null;
  ledger_type: WalletType;
  currency: string;
  balance: number;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  entry_group_id: string;
  wallet_id: string;
  order_id?: string | null;
  payout_id?: string | null;
  account_code: AccountCode;
  amount: number;
  direction: LedgerDirection;
  currency: string;
  description: string;
  idempotency_key: string;
  balance_after?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface Payout {
  id: string;
  wallet_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  provider: PaymentProvider;
  provider_ref?: string | null;
  bank_code?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  failure_reason?: string | null;
  initiated_by?: string | null;
  initiated_at: string;
  processed_at?: string | null;
  paid_at?: string | null;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  provider: PaymentProvider;
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  signature_valid: boolean;
  processed_at?: string | null;
  process_error?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  vendor_id?: string | null;
  rider_id?: string | null;
  vendor_rating?: number | null;
  rider_rating?: number | null;
  comment?: string | null;
  created_at: string;
}

export interface NotificationOutbox {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  template: string;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'SENT' | 'FAILED';
  attempts: number;
  last_error?: string | null;
  scheduled_at: string;
  sent_at?: string | null;
  created_at: string;
}
