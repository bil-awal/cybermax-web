import { z } from 'zod';

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  completed: z.boolean().optional(),
});

export type UpdateTaskDTO = z.infer<typeof updateTaskSchema>;
