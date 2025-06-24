
import { Task, TaskStatistics, DeadlineInfo, TaskStatusInfo, CreateTaskDTO } from './Task';

/**
 * Date utility functions
 */
export const dateUtils = {
  /**
   * Format date to localized string
   */
  formatDate: (dateString: string | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      };
      
      return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || 'Invalid Date';
    }
  },

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodayString: (): string => {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * Check if date is valid
   */
  isValidDate: (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },

  /**
   * Check if date is in the past
   */
  isPastDate: (dateString: string): boolean => {
    if (!dateString) return false;
    
    const inputDate = new Date(dateString);
    const today = new Date();
    
    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return inputDate < today;
  },

  /**
   * Calculate days difference between two dates
   */
  getDaysDifference: (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};

/**
 * Task validation utilities
 */
export const taskValidation = {
  /**
   * Validate task form data
   */
  validateTaskForm: (data: Partial<CreateTaskDTO>): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // Title validation
    if (!data.title?.trim()) {
      errors.title = 'Title is required';
    } else if (data.title.trim().length < 2) {
      errors.title = 'Title must be at least 2 characters long';
    } else if (data.title.trim().length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }

    // PIC validation
    if (!data.pic) {
      errors.pic = 'Person in Charge is required';
    }

    // Start date validation
    if (!data.startDate) {
      errors.startDate = 'Start Date is required';
    } else if (!dateUtils.isValidDate(data.startDate)) {
      errors.startDate = 'Please enter a valid start date';
    } else if (dateUtils.isPastDate(data.startDate)) {
      errors.startDate = 'Start Date cannot be in the past';
    }

    // End date validation
    if (!data.endDate) {
      errors.endDate = 'End Date is required';
    } else if (!dateUtils.isValidDate(data.endDate)) {
      errors.endDate = 'Please enter a valid end date';
    } else if (data.startDate && dateUtils.getDaysDifference(data.startDate, data.endDate) < 0) {
      errors.endDate = 'End Date must be after Start Date';
    }

    // Description validation (optional but if provided, check length)
    if (data.description && data.description.trim().length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Sanitize task data
   */
  sanitizeTaskData: (data: Partial<CreateTaskDTO>): Partial<CreateTaskDTO> => {
    return {
      ...data,
      title: data.title?.trim() || '',
      description: data.description?.trim() || undefined,
      pic: data.pic?.trim() || '',
      startDate: data.startDate?.trim() || '',
      endDate: data.endDate?.trim() || ''
    };
  }
};

/**
 * Task deadline and status utilities
 */
export const taskStatusUtils = {
  /**
   * Calculate deadline information for a task
   */
  getDeadlineInfo: (task: Task): DeadlineInfo | null => {
    if (!task.endDate) return null;

    try {
      const today = new Date();
      const endDate = new Date(task.endDate);

      if (isNaN(endDate.getTime())) {
        return null;
      }

      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      const diffTime = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isOverdue = daysRemaining < 0;
      const isToday = daysRemaining === 0;
      const isTomorrow = daysRemaining === 1;

      let status: TaskStatusInfo;

      if (task.completed) {
        status = { type: 'success', text: 'Completed' };
      } else if (isOverdue) {
        const overdueDays = Math.abs(daysRemaining);
        status = {
          type: 'danger',
          text: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`
        };
      } else if (isToday) {
        status = { type: 'warning', text: 'Due today' };
      } else if (isTomorrow) {
        status = { type: 'warning', text: 'Due tomorrow' };
      } else if (daysRemaining <= 3) {
        status = { type: 'warning', text: `Due in ${daysRemaining} days` };
      } else if (daysRemaining <= 7) {
        status = { type: 'info', text: `${daysRemaining} days remaining` };
      } else {
        status = { type: 'secondary', text: `${daysRemaining} days remaining` };
      }

      return {
        daysRemaining,
        isOverdue,
        isToday,
        isTomorrow,
        status
      };
    } catch (error) {
      console.error('Error calculating deadline info:', error);
      return null;
    }
  },

  /**
   * Get PIC badge variant
   */
  getPicBadgeVariant: (pic: string | null | undefined): string => {
    if (!pic) return 'secondary';

    const normalizedPic = pic.toLowerCase().trim();
    switch (normalizedPic) {
      case 'head': return 'danger';
      case 'manager': return 'warning';
      case 'supervisor': return 'info';
      case 'staff': return 'primary';
      case 'intern': return 'secondary';
      default: return 'secondary';
    }
  }
};

/**
 * Task statistics utilities
 */
export const taskStatsUtils = {
  /**
   * Calculate task statistics
   */
  calculateStatistics: (tasks: Task[]): TaskStatistics => {
    if (!Array.isArray(tasks)) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completionRate: 0
      };
    }

    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    const overdue = tasks.filter(task => {
      if (task.completed || !task.endDate) return false;
      const deadlineInfo = taskStatusUtils.getDeadlineInfo(task);
      return deadlineInfo?.isOverdue || false;
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate
    };
  }
};

/**
 * Task sorting utilities
 */
export const taskSortUtils = {
  /**
   * Sort tasks by specified criteria
   */
  sortTasks: (
    tasks: Task[], 
    sortBy: 'created_at' | 'title' | 'status' | 'due_date' | 'pic' = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Task[] => {
    if (!Array.isArray(tasks)) return [];

    const sortedTasks = [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          const titleA = a?.title || '';
          const titleB = b?.title || '';
          comparison = titleA.localeCompare(titleB);
          break;

        case 'status':
          const statusA = a?.completed ? 1 : 0;
          const statusB = b?.completed ? 1 : 0;
          comparison = statusA - statusB;
          break;

        case 'due_date':
          const dueDateA = a?.endDate ? new Date(a.endDate).getTime() : 0;
          const dueDateB = b?.endDate ? new Date(b.endDate).getTime() : 0;
          comparison = dueDateA - dueDateB;
          break;

        case 'pic':
          const picA = a?.pic || '';
          const picB = b?.pic || '';
          comparison = picA.localeCompare(picB);
          break;

        case 'created_at':
        default:
          const createdA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const createdB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = createdA - createdB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sortedTasks;
  }
};

/**
 * Task filtering utilities
 */
export const taskFilterUtils = {
  /**
   * Filter tasks based on criteria
   */
  filterTasks: (
    tasks: Task[],
    filters: {
      completed?: boolean;
      pic?: string;
      searchQuery?: string;
      isOverdue?: boolean;
    }
  ): Task[] => {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter(task => {
      // Completion filter
      if (filters.completed !== undefined && task.completed !== filters.completed) {
        return false;
      }

      // PIC filter
      if (filters.pic && task.pic !== filters.pic) {
        return false;
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          task.title,
          task.description,
          task.pic
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Overdue filter
      if (filters.isOverdue !== undefined) {
        const deadlineInfo = taskStatusUtils.getDeadlineInfo(task);
        const isOverdue = deadlineInfo?.isOverdue || false;
        if (isOverdue !== filters.isOverdue) {
          return false;
        }
      }

      return true;
    });
  }
};

/**
 * Export utilities for use in components
 */
export const taskUtils = {
  date: dateUtils,
  validation: taskValidation,
  status: taskStatusUtils,
  stats: taskStatsUtils,
  sort: taskSortUtils,
  filter: taskFilterUtils
};