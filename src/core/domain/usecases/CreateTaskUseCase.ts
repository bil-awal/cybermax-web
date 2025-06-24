import { ITask } from '../entities/Task';
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

  async execute(params: CreateTaskParams): Promise<ITask> {
    // Create task data without auto-generated fields
    const taskData: Omit<ITask, 'id' | 'createdAt' | 'updatedAt'> = {
      title: params.title,
      description: params.description,
      completed: params.completed ?? false,
      pic: params.pic,
      startDate: params.startDate,
      endDate: params.endDate
    };
    
    return await this.taskRepository.create(taskData);
  }
}