import { Task } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';

export class UpdateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(id: string, params: Partial<Pick<Task, 'title' | 'description' | 'completed' | 'pic' | 'startDate' | 'endDate'>>): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    // Update fields as needed
    if (params.title !== undefined) {
      task.updateTitle(params.title);
    }
    if (params.description !== undefined) {
      task.updateDescription(params.description);
    }
    if (params.completed !== undefined && params.completed !== task.completed) {
      task.toggleCompleted();
    }
    if (params.pic !== undefined) {
      task.pic = params.pic;
      task.updatedAt = new Date().toISOString();
    }
    if (params.startDate !== undefined) {
      task.startDate = params.startDate;
      task.updatedAt = new Date().toISOString();
    }
    if (params.endDate !== undefined) {
      task.endDate = params.endDate;
      task.updatedAt = new Date().toISOString();
    }
    
    return await this.taskRepository.update(task);
  }
}