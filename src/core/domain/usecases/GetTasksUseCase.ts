import { Task } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';

export class GetTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(): Promise<Task[]> {
    // Repository now returns Task instances directly, no need to map
    return await this.taskRepository.findAll();
  }
}