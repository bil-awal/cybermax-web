import { Task, ITask } from '@/core/domain/entities/Task';
import { ITaskRepository } from '@/core/domain/repositories/ITaskRepository';

export class ApiTaskRepository implements ITaskRepository {
  constructor(private apiUrl: string) {}

  async findAll(): Promise<Task[]> {
    const response = await fetch(`${this.apiUrl}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    
    const data: ITask[] = await response.json();
    return data.map(t => Task.fromJSON(t));
  }

  async findById(id: string): Promise<Task | null> {
    const response = await fetch(`${this.apiUrl}/tasks/${id}`);
    if (!response.ok) return null;
    
    const data: ITask = await response.json();
    return Task.fromJSON(data);
  }

  async create(task: Task): Promise<Task> {
    const response = await fetch(`${this.apiUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task.toJSON()),
    });
    
    if (!response.ok) throw new Error('Failed to create task');
    
    const data: ITask = await response.json();
    return Task.fromJSON(data);
  }

  async update(task: Task): Promise<Task> {
    const response = await fetch(`${this.apiUrl}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task.toJSON()),
    });
    
    if (!response.ok) throw new Error('Failed to update task');
    
    const data: ITask = await response.json();
    return Task.fromJSON(data);
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/tasks/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete task');
  }
}