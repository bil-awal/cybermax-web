import { Task } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';

export interface CreateTaskParams {
  title: string;
  description?: string;
  completed?: boolean;
  pic?: string;
  startDate?: string;
  endDate?: string;
}

export class CreateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(params: CreateTaskParams): Promise<Task> {
    // Create a new Task instance using the static create method
    const task = Task.create({
      title: params.title,
      description: params.description,
      completed: params.completed,
      pic: params.pic,
      startDate: params.startDate,
      endDate: params.endDate
    });
    
    return await this.taskRepository.create(task);
  }
}