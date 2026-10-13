export enum DispatchEventType {
  OFFER_CREATED = 'dispatch.offer_created',
  OFFER_ACCEPTED = 'dispatch.offer_accepted',
  OFFER_REJECTED = 'dispatch.offer_rejected',
  OFFER_EXPIRED = 'dispatch.offer_expired',
  DISPATCH_ESCALATED = 'dispatch.escalated',
  DISPATCH_FAILED = 'dispatch.failed',
}

export interface DispatchOfferEvent {
  deliveryId: string;
  orderNumber: string;
  riderId: string;
  offerId: string;
  round: number;
  pickupAddress: string;
  dropoffAddress: string;
  distanceMeters: number;
  expiresAt: Date;
}
