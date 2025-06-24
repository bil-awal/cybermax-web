import { ITask, TaskFilters, TaskSortOptions } from '../entities/Task';

export interface ITaskRepository {
  findAll(): Promise<ITask[]>;
  findById(id: string): Promise<ITask | null>;
  findByFilters(filters: TaskFilters, sortOptions?: TaskSortOptions): Promise<ITask[]>;
  create(task: Omit<ITask, 'id' | 'createdAt' | 'updatedAt'>): Promise<ITask>;
  update(id: string, updates: Partial<Omit<ITask, 'id' | 'createdAt'>>): Promise<ITask | null>;
  delete(id: string): Promise<boolean>;
  count(filters?: TaskFilters): Promise<number>;
}