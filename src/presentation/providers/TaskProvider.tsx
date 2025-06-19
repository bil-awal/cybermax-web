'use client';

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Task } from '@/core/domain/entities/Task';
import { LocalStorageTaskRepository } from '@/infrastructure/repositories/LocalStorageTaskRepository';
import { CreateTaskUseCase } from '@/core/domain/usecases/CreateTaskUseCase';
import { GetTasksUseCase } from '@/core/domain/usecases/GetTasksUseCase';
import { UpdateTaskUseCase } from '@/core/domain/usecases/UpdateTaskUseCase';
import { DeleteTaskUseCase } from '@/core/domain/usecases/DeleteTaskUseCase';
import { PdfGenerator } from '@/infrastructure/pdf/PdfGenerator';

interface TaskContextValue {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (params: { title: string; description?: string }) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  generateReport: () => void;
  refetch: () => Promise<void>;
}

export const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize repositories and use cases
  const taskRepository = new LocalStorageTaskRepository();
  const createTaskUseCase = new CreateTaskUseCase(taskRepository);
  const getTasksUseCase = new GetTasksUseCase(taskRepository);
  const updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
  const deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);
  const pdfGenerator = new PdfGenerator();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTasks = await getTasksUseCase.execute();
      setTasks(fetchedTasks);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (params: { title: string; description?: string }) => {
    try {
      const newTask = await createTaskUseCase.execute(params);
      setTasks(prev => [...prev, newTask]);
    } catch (err) {
      setError('Failed to create task');
      throw err;
    }
  }, [createTaskUseCase]);

  const toggleTask = useCallback(async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) throw new Error('Task not found');
      
      const updatedTask = await updateTaskUseCase.execute(id, { completed: !task.completed });
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    } catch (err) {
      setError('Failed to update task');
      console.error(err);
    }
  }, [tasks, updateTaskUseCase]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await deleteTaskUseCase.execute(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
    }
  }, [deleteTaskUseCase]);

  const generateReport = useCallback(() => {
    pdfGenerator.generateTaskReport(tasks);
  }, [tasks, pdfGenerator]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const value: TaskContextValue = {
    tasks,
    loading,
    error,
    createTask,
    toggleTask,
    deleteTask,
    generateReport,
    refetch: fetchTasks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
