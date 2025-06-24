// Task Entity Type Definition (for serialization/API)
export interface ITask {
  id: string;
  title: string;
  description?: string;
  pic?: string; // Person in Charge
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  completed: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Task Class - TIDAK implement ITask secara langsung
export class Task {
  constructor(
    public id: string,
    public title: string,
    public description: string = '',
    public completed: boolean = false,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public pic?: string,
    public startDate?: string,
    public endDate?: string
  ) {}

  static create(data: {
    title: string;
    description?: string;
    completed?: boolean;
    pic?: string;
    startDate?: string;
    endDate?: string;
  }): Task {
    const now = new Date();
    const id = crypto.randomUUID();
    
    return new Task(
      id,
      data.title,
      data.description || '',
      data.completed || false,
      now,
      now,
      data.pic,
      data.startDate,
      data.endDate
    );
  }

  static fromJSON(data: ITask): Task {
    return new Task(
      data.id,
      data.title,
      data.description || '',
      data.completed,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.pic,
      data.startDate,
      data.endDate
    );
  }

  updateTitle(title: string): void {
    this.title = title;
    this.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  toggleCompleted(): void {
    this.completed = !this.completed;
    this.updatedAt = new Date();
  }

  toJSON(): ITask {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      pic: this.pic,
      startDate: this.startDate,
      endDate: this.endDate
    };
  }
}

// Create Task DTO
export interface CreateTaskDTO {
  title: string;
  description?: string;
  pic: string;
  startDate: string;
  endDate: string;
}

// Update Task DTO
export interface UpdateTaskDTO {
  id: string;
  title?: string;
  description?: string;
  pic?: string;
  startDate?: string;
  endDate?: string;
  completed?: boolean;
}

// Task Filter Options
export interface TaskFilters {
  completed?: boolean;
  pic?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

// Task Sort Options
export type TaskSortBy = 'created_at' | 'title' | 'status' | 'due_date' | 'pic';
export type SortOrder = 'asc' | 'desc';

export interface TaskSortOptions {
  sortBy: TaskSortBy;
  sortOrder: SortOrder;
}

// PIC (Person in Charge) Options
export interface PicOption {
  value: string;
  label: string;
}

export const PIC_OPTIONS: PicOption[] = [
  { value: '', label: 'Select Person in Charge' },
  { value: 'Head', label: 'Head' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Intern', label: 'Intern' }
];

// Task Status Types
export type TaskStatus = 'pending' | 'completed' | 'overdue';

export interface TaskStatusInfo {
  type: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  text: string;
}

// Deadline calculation result
export interface DeadlineInfo {
  daysRemaining: number;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  status: TaskStatusInfo;
}

// Task statistics
export interface TaskStatistics {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

// API Response types
export interface TaskResponse {
  data: ITask[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TaskApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Form validation types
export interface TaskFormErrors {
  title?: string;
  pic?: string;
  startDate?: string;
  endDate?: string;
  general?: string;
}

export interface TaskFormState {
  title: string;
  description: string;
  pic: string;
  startDate: string;
  endDate: string;
  loading: boolean;
  errors: TaskFormErrors;
  message?: {
    type: 'success' | 'error';
    text: string;
  };
}