import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["admin", "user"]).default("user"),
  company_id: z.string().uuid("Company ID deve ser um UUID válido").optional(),
});

// Company schemas
export const createCompanySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
});

// Device schemas
export const createDeviceSchema = z.object({
  imei: z.string().min(15, "IMEI deve ter pelo menos 15 caracteres"),
  name: z.string().optional(),
  sim_number: z.string().optional(),
  company_id: z.string().uuid("Company ID deve ser um UUID válido").optional(),
  model_id: z.string().uuid("Model ID deve ser um UUID válido").optional(),
});

export const updateDeviceSchema = z.object({
  name: z.string().optional(),
  sim_number: z.string().optional(),
  company_id: z.string().uuid("Company ID deve ser um UUID válido").optional(),
  model_id: z.string().uuid("Model ID deve ser um UUID válido").optional(),
});

// Location schemas
export const createLocationSchema = z.object({
  device_id: z.string().uuid("Device ID deve ser um UUID válido"),
  latitude: z.number().min(-90).max(90, "Latitude deve estar entre -90 e 90"),
  longitude: z
    .number()
    .min(-180)
    .max(180, "Longitude deve estar entre -180 e 180"),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  raw_payload: z.any().optional(),
});

// Command schemas
export const createCommandSchema = z.object({
  device_id: z.string().uuid("Device ID deve ser um UUID válido"),
  command_type: z.string().min(1, "Tipo de comando é obrigatório"),
  payload: z.any().optional(),
});

// Geofence schemas
export const createGeofenceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  coordinates: z
    .array(z.array(z.number()))
    .min(3, "Geofence deve ter pelo menos 3 pontos"),
  company_id: z.string().uuid("Company ID deve ser um UUID válido").optional(),
});

// Alert schemas
export const createAlertSchema = z.object({
  device_id: z.string().uuid("Device ID deve ser um UUID válido"),
  alert_type: z.string().min(1, "Tipo de alerta é obrigatório"),
  message: z.string().min(1, "Mensagem é obrigatória"),
  company_id: z.string().uuid("Company ID deve ser um UUID válido").optional(),
});

export const resolveAlertSchema = z.object({
  resolved_at: z.string().datetime().optional(),
});

// Query schemas
export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default(() => 1),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default(() => 10),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const locationQuerySchema = paginationSchema.extend({
  device_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export const deviceQuerySchema = paginationSchema.extend({
  company_id: z.string().uuid().optional(),
  online: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type CreateCompanyData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyData = z.infer<typeof updateCompanySchema>;
export type CreateDeviceData = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceData = z.infer<typeof updateDeviceSchema>;
export type CreateLocationData = z.infer<typeof createLocationSchema>;
export type CreateCommandData = z.infer<typeof createCommandSchema>;
export type CreateGeofenceData = z.infer<typeof createGeofenceSchema>;
export type CreateAlertData = z.infer<typeof createAlertSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type LocationQuery = z.infer<typeof locationQuerySchema>;
export type DeviceQuery = z.infer<typeof deviceQuerySchema>;
