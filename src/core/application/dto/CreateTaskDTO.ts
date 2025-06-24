import { z } from 'zod';

// PIC options validation
const validPicOptions = ['Head', 'Manager', 'Supervisor', 'Staff', 'Intern'] as const;

// Date validation helper
const dateStringSchema = z.string().refine((date) => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}, {
  message: 'Invalid date format'
});

// Custom date validation for future dates
const futureDateSchema = z.string().refine((date) => {
  const inputDate = new Date(date);
  const today = new Date();
  
  // Set hours to 0 for accurate comparison
  inputDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return inputDate >= today;
}, {
  message: 'Date cannot be in the past'
});

// Create Task DTO Schema
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(2, 'Title must be at least 2 characters long')
    .max(100, 'Title must be less than 100 characters')
    .transform(val => val.trim()),
    
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .transform(val => val.trim())
    .optional()
    .or(z.literal('')),
    
  pic: z
    .enum(validPicOptions, {
      errorMap: () => ({ message: 'Please select a valid Person in Charge' })
    }),
    
  startDate: futureDateSchema,
  
  endDate: dateStringSchema
}).refine((data) => {
  // Validate that end date is after start date
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  
  return endDate >= startDate;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate']
});

// Update Task DTO Schema
export const updateTaskSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
  
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters long')
    .max(100, 'Title must be less than 100 characters')
    .transform(val => val.trim())
    .optional(),
    
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .transform(val => val.trim())
    .optional(),
    
  pic: z
    .enum(validPicOptions, {
      errorMap: () => ({ message: 'Please select a valid Person in Charge' })
    })
    .optional(),
    
  startDate: z
    .string()
    .refine((date) => {
      if (!date) return true; // Allow empty for optional updates
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, {
      message: 'Invalid start date format'
    })
    .optional(),
    
  endDate: z
    .string()
    .refine((date) => {
      if (!date) return true; // Allow empty for optional updates
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, {
      message: 'Invalid end date format'
    })
    .optional(),
    
  completed: z.boolean().optional()
}).refine((data) => {
  // Validate date relationship if both dates are provided
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate >= startDate;
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate']
});

// Task Filter Schema
export const taskFilterSchema = z.object({
  completed: z.boolean().optional(),
  pic: z.enum(validPicOptions).optional(),
  searchQuery: z.string().max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isOverdue: z.boolean().optional()
});

// Task Sort Schema
export const taskSortSchema = z.object({
  sortBy: z.enum(['created_at', 'title', 'status', 'due_date', 'pic']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Task ID Schema
export const taskIdSchema = z.object({
  id: z.string().min(1, 'Task ID is required')
});

// Bulk operation schema
export const bulkTaskOperationSchema = z.object({
  taskIds: z.array(z.string().min(1, 'Task ID is required')).min(1, 'At least one task ID is required'),
  operation: z.enum(['complete', 'delete', 'update_pic']),
  data: z.record(z.any()).optional() // Additional data for bulk operations
});

// Export types inferred from schemas
export type CreateTaskDTO = z.infer<typeof createTaskSchema>;
export type UpdateTaskDTO = z.infer<typeof updateTaskSchema>;
export type TaskFilterDTO = z.infer<typeof taskFilterSchema>;
export type TaskSortDTO = z.infer<typeof taskSortSchema>;
export type TaskIdDTO = z.infer<typeof taskIdSchema>;
export type BulkTaskOperationDTO = z.infer<typeof bulkTaskOperationSchema>;

// Validation helper functions
export const validateCreateTask = (data: unknown) => {
  return createTaskSchema.safeParse(data);
};

export const validateUpdateTask = (data: unknown) => {
  return updateTaskSchema.safeParse(data);
};

export const validateTaskFilter = (data: unknown) => {
  return taskFilterSchema.safeParse(data);
};

export const validateTaskSort = (data: unknown) => {
  return taskSortSchema.safeParse(data);
};

export const validateTaskId = (data: unknown) => {
  return taskIdSchema.safeParse(data);
};

export const validateBulkOperation = (data: unknown) => {
  return bulkTaskOperationSchema.safeParse(data);
};

// Error message helper
export const getValidationErrorMessage = (error: z.ZodError): string => {
  const firstError = error.errors[0];
  if (firstError.path.length > 0) {
    return `${firstError.path.join('.')}: ${firstError.message}`;
  }
  return firstError.message;
};

// Schema validation middleware helper
export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): { success: true; data: T } | { success: false; error: string } => {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: getValidationErrorMessage(result.error) };
    }
  };
};