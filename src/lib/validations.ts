import { z } from "zod";

/**
 * Profile validation schema
 * Used for validating profile updates before sending to the database
 * These constraints match the database validation triggers
 */
export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must be 100 characters or less")
    .optional(),
  bio: z
    .string()
    .max(1000, "Bio must be 1000 characters or less")
    .nullable()
    .optional(),
  phone: z
    .string()
    .max(20, "Phone number must be 20 characters or less")
    .regex(/^[0-9+\-\s()]*$/, "Phone number contains invalid characters")
    .nullable()
    .optional(),
  location: z
    .string()
    .max(200, "Location must be 200 characters or less")
    .nullable()
    .optional(),
  institution: z
    .string()
    .max(200, "Institution must be 200 characters or less")
    .nullable()
    .optional(),
  specialization: z
    .string()
    .max(200, "Specialization must be 200 characters or less")
    .nullable()
    .optional(),
  avatar_url: z
    .string()
    .max(2000, "Avatar URL must be 2000 characters or less")
    .url("Avatar URL must be a valid URL")
    .nullable()
    .optional()
    .or(z.literal("")),
  onboarding_completed: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/**
 * Project event data validation schema
 * Validates the JSONB data field for project events
 */
export const projectEventDataSchema = z.object({
  milestone_title: z.string().max(200).optional(),
  milestone_id: z.string().max(100).optional(),
  file_name: z.string().max(500).optional(),
  confirmed_by: z.string().max(100).optional(),
  user_name: z.string().max(100).optional(),
}).strict();

export type ProjectEventDataInput = z.infer<typeof projectEventDataSchema>;

/**
 * Validates profile update data
 * @param data - The profile update data to validate
 * @returns Validated data or throws validation error
 */
export function validateProfileUpdate(data: unknown): ProfileUpdateInput {
  return profileUpdateSchema.parse(data);
}

/**
 * Validates project event data
 * @param data - The project event data to validate
 * @returns Validated data or throws validation error
 */
export function validateProjectEventData(data: unknown): ProjectEventDataInput {
  return projectEventDataSchema.parse(data);
}

/**
 * Safely validates and returns profile update data with errors
 * @param data - The profile update data to validate
 * @returns Object with success flag, data, and optional error
 */
export function safeValidateProfileUpdate(data: unknown): {
  success: boolean;
  data?: ProfileUpdateInput;
  error?: string;
} {
  const result = profileUpdateSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(i => i.message).join(", ") 
  };
}
