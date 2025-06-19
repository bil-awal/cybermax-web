export interface ITask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Task implements ITask {
  constructor(
    public id: string,
    public title: string,
    public description: string = '',
    public completed: boolean = false,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(params: Omit<ITask, 'id' | 'createdAt' | 'updatedAt'>): Task {
    return new Task(
      crypto.randomUUID(),
      params.title,
      params.description || '',
      params.completed || false
    );
  }

  toggle(): void {
    this.completed = !this.completed;
    this.updatedAt = new Date();
  }

  update(params: Partial<Pick<ITask, 'title' | 'description'>>): void {
    if (params.title !== undefined) this.title = params.title;
    if (params.description !== undefined) this.description = params.description;
    this.updatedAt = new Date();
  }

  toJSON(): ITask {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
