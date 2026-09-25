import { z } from "zod";

export const settingsSchema = z.object({
  // Profile
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  contactEmail: z.string().email("Email tidak valid"),
  address: z.string().optional(),
  npwp: z.string().optional(),

  // Mayar Integration
  mayarApiKey: z.string().optional(),
  mayarWebhookSecret: z.string().optional(),
  mayarSandboxMode: z.boolean().default(false),

  // Tax Settings
  taxPpnRate: z.number().min(0).max(100).default(12),
  taxPph23Rate: z.number().default(-2),
  taxEnableDefault: z.boolean().default(true),
});

export type SettingsData = z.infer<typeof settingsSchema>;
