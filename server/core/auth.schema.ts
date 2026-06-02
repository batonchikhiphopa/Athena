import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[\p{L}\p{N}._ -]+$/u);

const passwordSchema = z.string().min(8).max(1024);

export const setupOwnerSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = setupOwnerSchema;

export type SetupOwnerInput = z.infer<typeof setupOwnerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
