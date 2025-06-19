import { Task } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';

export interface CreateTaskParams {
  title: string;
  description?: string;
}

export class CreateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(params: CreateTaskParams): Promise<Task> {
    const task = Task.create(params);
    return await this.taskRepository.create(task);
  }
}
