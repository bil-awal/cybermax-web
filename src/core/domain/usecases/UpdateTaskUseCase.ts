import { Task } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';

export class UpdateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(id: string, params: Partial<Pick<Task, 'title' | 'description' | 'completed'>>): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    if (params.title !== undefined) task.title = params.title;
    if (params.description !== undefined) task.description = params.description;
    if (params.completed !== undefined) task.completed = params.completed;
    
    task.updatedAt = new Date();
    
    return await this.taskRepository.update(task);
  }
}
