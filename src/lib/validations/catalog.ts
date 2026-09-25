import { z } from "zod";

export const catalogSchema = z.object({
  name: z.string().min(3, "Nama katalog minimal 3 karakter"),
  description: z.string().optional(),
  color: z.string().default("from-blue-500 to-indigo-600"),
  icon: z.string().default("FolderOpen"),
  category: z.string().min(2, "Kategori diperlukan"),
});

export const catalogItemSchema = z.object({
  name: z.string().min(3, "Nama item minimal 3 karakter"),
  description: z.string().optional(),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  billingType: z.enum(["one_time", "recurring"]),
  isTaxable: z.boolean().default(true),
  defaultTaxRate: z.number().min(0).max(100).default(11),
});
