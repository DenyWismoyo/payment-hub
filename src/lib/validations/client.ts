import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(3, "Nama klien minimal 3 karakter"),
  type: z.enum(["government", "private", "individual"]),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  npwp: z.string().optional().or(z.literal("")),
  organization: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});
