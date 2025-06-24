import { Task, ITask } from '@/core/domain/entities/Task';
import { ITaskRepository } from '@/core/domain/repositories/ITaskRepository';

export class LocalStorageTaskRepository implements ITaskRepository {
  private readonly storageKey = 'tasks';

  async findAll(): Promise<Task[]> {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];
    
    const data: ITask[] = JSON.parse(stored);
    return data.map(item => new Task({
      id: item.id,
      title: item.title,
      description: item.description,
      completed: item.completed,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      pic: item.pic,
      startDate: item.startDate,
      endDate: item.endDate
    }));
  }

  async findById(id: string): Promise<Task | null> {
    const tasks = await this.findAll();
    return tasks.find(task => task.id === id) || null;
  }

  async create(task: Task): Promise<Task> {
    const tasks = await this.findAll();
    tasks.push(task);
    localStorage.setItem(this.storageKey, JSON.stringify(tasks.map(t => t.toJSON())));
    return task;
  }

  async update(task: Task): Promise<Task> {
    const tasks = await this.findAll();
    const index = tasks.findIndex(t => t.id === task.id);
    
    if (index === -1) {
      throw new Error('Task not found');
    }
    
    tasks[index] = task;
    localStorage.setItem(this.storageKey, JSON.stringify(tasks.map(t => t.toJSON())));
    return task;
  }

  async delete(id: string): Promise<void> {
    const tasks = await this.findAll();
    const filteredTasks = tasks.filter(task => task.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filteredTasks.map(t => t.toJSON())));
  }
}