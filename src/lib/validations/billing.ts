import { z } from "zod";

export const billingSchema = z.object({
  clientId: z.string().min(1, "Klien diperlukan"),
  catalogId: z.string().min(1, "Katalog diperlukan"),
  catalogItemId: z.string().min(1, "Item Katalog diperlukan"),
  amount: z.number().min(1, "Amount harus lebih besar dari 0"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  
  subtotal: z.number().min(0, "Subtotal tidak valid"),
  taxTotal: z.number().default(0),
  grandTotal: z.number().min(1, "Grand Total tidak valid"),
  taxDetails: z.array(z.any()).default([]),
});
