import { Task } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';

export interface CreateTaskParams {
  title: string;
  description?: string;
  completed?: boolean;
}

export class CreateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(params: CreateTaskParams): Promise<Task> {
    const taskData = {
      ...params,
      completed: params.completed ?? false
    };
    
    const task = Task.create(taskData);
    return await this.taskRepository.create(task);
  }
}