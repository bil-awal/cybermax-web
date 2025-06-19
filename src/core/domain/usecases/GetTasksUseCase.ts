import { Task } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';

export class GetTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(): Promise<Task[]> {
    return await this.taskRepository.findAll();
  }
}
