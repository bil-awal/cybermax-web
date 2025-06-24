import { Task } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';

export class GetTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(): Promise<Task[]> {
    const taskData = await this.taskRepository.findAll();
    return taskData.map(data => new Task(
      data.id,
      data.title,
      data.description,
      data.completed,
      data.startDate ? new Date(data.startDate) : undefined,
      data.endDate ? new Date(data.endDate) : undefined
    ));
  }
}