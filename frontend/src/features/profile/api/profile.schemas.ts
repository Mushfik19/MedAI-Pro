import { z } from "zod"

export const profileSchema = z.object({
  user_id: z.uuid(),
  email: z.email(),
  first_name: z.string().trim().min(2).max(80),
  last_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(32),
  city: z.string().trim().min(2).max(120),
  date_of_birth: z.iso.date(),
  sex_at_birth: z.enum(["FEMALE", "MALE", "INTERSEX", "PREFER_NOT_TO_SAY"]),
  timezone: z.string().min(1).max(80),
  identity_verified: z.boolean(),
})

export const profileFormSchema = z.object({
  city: z.string().trim().min(2, "Enter your city.").max(120),
  dateOfBirth: z.iso.date("Enter a valid date of birth."),
  email: z.email("Enter a valid email address."),
  firstName: z.string().trim().min(2, "Enter your first name.").max(80),
  lastName: z.string().trim().min(2, "Enter your last name.").max(80),
  phone: z.string().trim().min(8, "Enter a valid phone number.").max(32),
  sexAtBirth: z.enum(["FEMALE", "MALE", "INTERSEX", "PREFER_NOT_TO_SAY"]),
  timezone: z.string().min(1, "Select your timezone.").max(80),
})

export type Profile = z.infer<typeof profileSchema>
export type ProfileFormValues = z.infer<typeof profileFormSchema>
