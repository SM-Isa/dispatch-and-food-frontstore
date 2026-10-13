import { z } from 'zod';

export const PostingSchema = z.object({
  walletId: z.string().uuid(),
  accountCode: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  direction: z.enum(['CREDIT', 'DEBIT']),
  description: z.string().min(1).max(255),
  metadata: z.record(z.unknown()).optional(),
});

export const PostEntryGroupSchema = z.object({
  entryGroupId: z.string().uuid(),
  idempotencyKey: z.string().min(1).max(120),
  orderId: z.string().uuid().optional(),
  payoutId: z.string().uuid().optional(),
  postings: z.array(PostingSchema).min(2),
});

export type PostEntryGroupDto = z.infer<typeof PostEntryGroupSchema>;
