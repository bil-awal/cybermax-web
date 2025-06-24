import { Task } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';

export class UpdateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(id: string, params: Partial<Pick<Task, 'title' | 'description' | 'completed' | 'pic' | 'startDate' | 'endDate'>>): Promise<Task> {
    try {
      console.log('UpdateTaskUseCase: Attempting to update task with ID:', id);
      console.log('UpdateTaskUseCase: Update parameters:', params);
      
      // First, try to find the task
      const task = await this.taskRepository.findById(id);
      
      if (!task) {
        console.error('UpdateTaskUseCase: Task not found in repository:', id);
        
        // Log all available tasks for debugging
        try {
          const allTasks = await this.taskRepository.findAll();
          console.log('UpdateTaskUseCase: Available tasks in repository:', 
            allTasks.map(t => ({ 
              id: t.id, 
              title: t.title, 
              completed: t.completed 
            }))
          );
        } catch (err) {
          console.error('UpdateTaskUseCase: Failed to fetch all tasks for debugging:', err);
        }
        
        throw new Error(`Task with ID ${id} not found in repository`);
      }

      console.log('UpdateTaskUseCase: Found task:', {
        id: task.id,
        title: task.title,
        completed: task.completed,
        currentState: {
          title: task.title,
          description: task.description,
          completed: task.completed,
          pic: task.pic,
          startDate: task.startDate,
          endDate: task.endDate
        }
      });

      // Create a copy of the task to avoid mutating the original
      const taskToUpdate = new Task(
        task.id,
        task.title,
        task.description,
        task.completed,
        new Date(task.createdAt),
        new Date(task.updatedAt),
        task.pic,
        task.startDate,
        task.endDate
      );

      // Update fields as needed
      let hasChanges = false;

      if (params.title !== undefined && params.title !== taskToUpdate.title) {
        console.log('UpdateTaskUseCase: Updating title from', taskToUpdate.title, 'to', params.title);
        taskToUpdate.updateTitle(params.title);
        hasChanges = true;
      }

      if (params.description !== undefined && params.description !== taskToUpdate.description) {
        console.log('UpdateTaskUseCase: Updating description from', taskToUpdate.description, 'to', params.description);
        taskToUpdate.updateDescription(params.description);
        hasChanges = true;
      }

      if (params.completed !== undefined && params.completed !== taskToUpdate.completed) {
        console.log('UpdateTaskUseCase: Toggling completed from', taskToUpdate.completed, 'to', params.completed);
        taskToUpdate.toggleCompleted();
        hasChanges = true;
      }

      if (params.pic !== undefined && params.pic !== taskToUpdate.pic) {
        console.log('UpdateTaskUseCase: Updating pic from', taskToUpdate.pic, 'to', params.pic);
        taskToUpdate.pic = params.pic;
        taskToUpdate.updatedAt = new Date();
        hasChanges = true;
      }

      if (params.startDate !== undefined && params.startDate !== taskToUpdate.startDate) {
        console.log('UpdateTaskUseCase: Updating startDate from', taskToUpdate.startDate, 'to', params.startDate);
        taskToUpdate.startDate = params.startDate;
        taskToUpdate.updatedAt = new Date();
        hasChanges = true;
      }

      if (params.endDate !== undefined && params.endDate !== taskToUpdate.endDate) {
        console.log('UpdateTaskUseCase: Updating endDate from', taskToUpdate.endDate, 'to', params.endDate);
        taskToUpdate.endDate = params.endDate;
        taskToUpdate.updatedAt = new Date();
        hasChanges = true;
      }

      // If no changes detected, return the original task as Task instance
      if (!hasChanges) {
        console.log('UpdateTaskUseCase: No changes detected, returning original task');
        return task; // This should now be a Task instance, not ITask
      }

      console.log('UpdateTaskUseCase: Saving updated task:', {
        id: taskToUpdate.id,
        title: taskToUpdate.title,
        description: taskToUpdate.description,
        completed: taskToUpdate.completed,
        pic: taskToUpdate.pic,
        startDate: taskToUpdate.startDate,
        endDate: taskToUpdate.endDate,
        hasChanges
      });

      // Save the updated task
      const result = await this.taskRepository.update(taskToUpdate);
      
      console.log('UpdateTaskUseCase: Task updated successfully:', {
        id: result.id,
        title: result.title,
        completed: result.completed,
        updatedAt: result.updatedAt
      });

      return result;
      
    } catch (error) {
      console.error('UpdateTaskUseCase: Error updating task:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(`Failed to update task: ${String(error)}`);
    }
  }
}