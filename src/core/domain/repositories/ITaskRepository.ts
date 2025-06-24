import { Task, TaskFilters, TaskSortOptions } from '../entities/Task';

export interface ITaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  findByFilters?(filters: TaskFilters, sortOptions?: TaskSortOptions): Promise<Task[]>;
  create(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
  count?(filters?: TaskFilters): Promise<number>;
}