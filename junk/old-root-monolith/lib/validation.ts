import { z } from 'zod'

export const inventoryCreateSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  storageMethodId: z.string().min(1),
  purchasedAt: z.coerce.date(),
  openedAt: z.coerce.date().optional().nullable()
})

export const inventoryUpdateSchema = z.object({
  quantity: z.number().positive().optional(),
  storageMethodId: z.string().min(1).optional(),
  openedAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(500).optional()
})

export const feedbackSchema = z.object({
  inventoryItemId: z.string().min(1),
  userReportedExpiry: z.coerce.date().optional().nullable(),
  freshnessScore1to5: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional()
})

export type InventoryCreate = z.infer<typeof inventoryCreateSchema>
export type InventoryUpdate = z.infer<typeof inventoryUpdateSchema>
export type FeedbackCreate = z.infer<typeof feedbackSchema>
