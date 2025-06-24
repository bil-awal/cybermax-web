import { Task, ITask } from '@/core/domain/entities/Task';
import { ITaskRepository } from '@/core/domain/repositories/ITaskRepository';

export class LocalStorageTaskRepository implements ITaskRepository {
  private readonly storageKey = 'tasks';

  /**
   * Safely read and parse data from localStorage
   */
  private async safeReadStorage(): Promise<ITask[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        console.log('LocalStorageTaskRepository: No tasks found in localStorage');
        return [];
      }
      
      const data = JSON.parse(stored);
      
      // Validate that data is an array
      if (!Array.isArray(data)) {
        console.warn('LocalStorageTaskRepository: Invalid data format in localStorage, resetting...');
        localStorage.removeItem(this.storageKey);
        return [];
      }
      
      // Validate each task object
      const validatedTasks = data.filter(item => {
        if (!item || typeof item !== 'object') {
          console.warn('LocalStorageTaskRepository: Invalid task object found, skipping:', item);
          return false;
        }
        
        // Check required fields
        if (!item.id || !item.title || typeof item.completed !== 'boolean') {
          console.warn('LocalStorageTaskRepository: Task missing required fields, skipping:', item);
          return false;
        }
        
        return true;
      });
      
      if (validatedTasks.length !== data.length) {
        console.warn(`LocalStorageTaskRepository: Filtered out ${data.length - validatedTasks.length} invalid tasks`);
        // Save the cleaned data back to localStorage
        await this.safeWriteStorage(validatedTasks);
      }
      
      console.log(`LocalStorageTaskRepository: Loaded ${validatedTasks.length} tasks from localStorage`);
      return validatedTasks;
      
    } catch (error) {
      console.error('LocalStorageTaskRepository: Error reading from localStorage:', error);
      
      // Try to recover by clearing corrupted data
      try {
        localStorage.removeItem(this.storageKey);
        console.log('LocalStorageTaskRepository: Cleared corrupted localStorage data');
      } catch (clearError) {
        console.error('LocalStorageTaskRepository: Failed to clear corrupted data:', clearError);
      }
      
      return [];
    }
  }

  /**
   * Safely write data to localStorage
   */
  private async safeWriteStorage(tasks: ITask[]): Promise<void> {
    try {
      const serialized = JSON.stringify(tasks);
      localStorage.setItem(this.storageKey, serialized);
      console.log(`LocalStorageTaskRepository: Successfully saved ${tasks.length} tasks to localStorage`);
    } catch (error) {
      console.error('LocalStorageTaskRepository: Error writing to localStorage:', error);
      
      // Check if it's a quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please clear some data and try again.');
      }
      
      throw new Error(`Failed to save tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert ITask data to Task entity
   */
  private createTaskFromData(item: ITask): Task {
    try {
      return new Task(
        item.id,
        item.title,
        item.description || '',
        item.completed,
        new Date(item.createdAt),
        new Date(item.updatedAt),
        item.pic,
        item.startDate,
        item.endDate
      );
    } catch (error) {
      console.error('LocalStorageTaskRepository: Error creating Task entity:', error, item);
      throw new Error(`Failed to create task entity for ID ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findAll(): Promise<Task[]> {
    try {
      console.log('LocalStorageTaskRepository: Finding all tasks...');
      const data = await this.safeReadStorage();
      const tasks = data.map(item => this.createTaskFromData(item));
      console.log('LocalStorageTaskRepository: Successfully loaded', tasks.length, 'tasks');
      return tasks;
    } catch (error) {
      console.error('LocalStorageTaskRepository: Error in findAll:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Task | null> {
    try {
      console.log('LocalStorageTaskRepository: Finding task by ID:', id);
      
      if (!id || typeof id !== 'string') {
        console.warn('LocalStorageTaskRepository: Invalid ID provided:', id);
        return null;
      }
      
      const data = await this.safeReadStorage();
      const taskData = data.find(task => task.id === id);
      
      if (!taskData) {
        console.log('LocalStorageTaskRepository: Task not found with ID:', id);
        console.log('LocalStorageTaskRepository: Available task IDs:', data.map(t => t.id));
        return null;
      }
      
      const task = this.createTaskFromData(taskData);
      console.log('LocalStorageTaskRepository: Found task:', { id: task.id, title: task.title });
      return task;
    } catch (error) {
      console.error('LocalStorageTaskRepository: Error in findById:', error);
      throw error;
    }
  }

  async create(task: Task): Promise<Task> {
    try {
      console.log('LocalStorageTaskRepository: Creating task:', { id: task.id, title: task.title });
      
      if (!task || !task.id) {
        throw new Error('Invalid task provided for creation');
      }
      
      const existingTasks = await this.safeReadStorage();
      
      // Check if task with same ID already exists
      if (existingTasks.some(t => t.id === task.id)) {
        throw new Error(`Task with ID ${task.id} already exists`);
      }
      
      const newTasksData = [...existingTasks, task.toJSON()];
      await this.safeWriteStorage(newTasksData);
      
      console.log('LocalStorageTaskRepository: Task created successfully:', task.id);
      return task;
    } catch (error) {
      console.error('LocalStorageTaskRepository: Error in create:', error);
      throw error;
    }
  }

  async update(task: Task): Promise<Task> {
    try {
      console.log('LocalStorageTaskRepository: Updating task:', { id: task.id, title: task.title });
      
      if (!task || !task.id) {
        throw new Error('Invalid task provided for update');
      }
      
      const existingTasks = await this.safeReadStorage();
      const taskIndex = existingTasks.findIndex(t => t.id === task.id);
      
      if (taskIndex === -1) {
        console.error('LocalStorageTaskRepository: Task not found for update:', task.id);
        console.log('LocalStorageTaskRepository: Available task IDs:', existingTasks.map(t => t.id));
        throw new Error(`Task with ID ${task.id} not found for update`);
      }
      
      console.log('LocalStorageTaskRepository: Found existing task at index:', taskIndex);
      console.log('LocalStorageTaskRepository: Updating from:', existingTasks[taskIndex]);
      console.log('LocalStorageTaskRepository: Updating to:', task.toJSON());
      
      const updatedTasks = [...existingTasks];
      updatedTasks[taskIndex] = task.toJSON();
      
      await this.safeWriteStorage(updatedTasks);
      
      console.log('LocalStorageTaskRepository: Task updated successfully:', task.id);
      return task;
    } catch (error) {
      console.error('LocalStorageTaskRepository: Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log('LocalStorageTaskRepository: Deleting task:', id);
      
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid task ID provided for deletion');
      }
      
      const existingTasks = await this.safeReadStorage();
      const taskExists = existingTasks.some(task => task.id === id);
      
      if (!taskExists) {
        console.warn('LocalStorageTaskRepository: Task not found for deletion:', id);
        console.log('LocalStorageTaskRepository: Available task IDs:', existingTasks.map(t => t.id));
        throw new Error(`Task with ID ${id} not found for deletion`);
      }
      
      const filteredTasks = existingTasks.filter(task => task.id !== id);
      await this.safeWriteStorage(filteredTasks);
      
      console.log('LocalStorageTaskRepository: Task deleted successfully:', id);
      console.log('LocalStorageTaskRepository: Remaining tasks:', filteredTasks.length);
    } catch (error) {
      console.error('LocalStorageTaskRepository: Error in delete:', error);
      throw error;
    }
  }

  /**
   * Additional utility method to validate and repair storage if needed
   */
  async validateAndRepairStorage(): Promise<void> {
    try {
      console.log('LocalStorageTaskRepository: Validating storage...');
      const tasks = await this.safeReadStorage();
      console.log('LocalStorageTaskRepository: Storage validation complete, found', tasks.length, 'valid tasks');
    } catch (error) {
      console.error('LocalStorageTaskRepository: Storage validation failed:', error);
      throw error;
    }
  }

  /**
   * Clear all tasks (useful for testing or reset functionality)
   */
  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('LocalStorageTaskRepository: All tasks cleared');
    } catch (error) {
      console.error('LocalStorageTaskRepository: Error clearing tasks:', error);
      throw error;
    }
  }
}