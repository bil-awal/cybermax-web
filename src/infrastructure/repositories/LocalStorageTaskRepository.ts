import { Task, ITask } from '@/core/domain/entities/Task';
import { ITaskRepository } from '@/core/domain/repositories/ITaskRepository';

export class LocalStorageTaskRepository implements ITaskRepository {
  private readonly STORAGE_KEY = 'tasks';

  private getTasks(): Task[] {
    if (typeof window === 'undefined') return [];
    
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    
    const tasks: ITask[] = JSON.parse(data);
    return tasks.map(t => new Task(
      t.id,
      t.title,
      t.description,
      t.completed,
      new Date(t.createdAt),
      new Date(t.updatedAt)
    ));
  }

  private saveTasks(tasks: Task[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(tasks.map(t => t.toJSON()))
    );
  }

  async findAll(): Promise<Task[]> {
    return this.getTasks();
  }

  async findById(id: string): Promise<Task | null> {
    const tasks = this.getTasks();
    return tasks.find(t => t.id === id) || null;
  }

  async create(task: Task): Promise<Task> {
    const tasks = this.getTasks();
    tasks.push(task);
    this.saveTasks(tasks);
    return task;
  }

  async update(task: Task): Promise<Task> {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    
    if (index === -1) {
      throw new Error('Task not found');
    }
    
    tasks[index] = task;
    this.saveTasks(tasks);
    return task;
  }

  async delete(id: string): Promise<void> {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    this.saveTasks(filtered);
  }
}
