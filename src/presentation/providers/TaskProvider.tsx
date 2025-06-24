'use client';

import React, { createContext, useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  createTask: (params: { 
    title: string; 
    description?: string;
    pic?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  generateReport: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track ongoing operations to prevent race conditions
  const pendingOperations = useRef<Set<string>>(new Set());
  const isInitialized = useRef(false);

  // Initialize repositories and use cases with useMemo to prevent recreation on every render
  const taskRepository = useMemo(() => new LocalStorageTaskRepository(), []);
  const createTaskUseCase = useMemo(() => new CreateTaskUseCase(taskRepository), [taskRepository]);
  const getTasksUseCase = useMemo(() => new GetTasksUseCase(taskRepository), [taskRepository]);
  const updateTaskUseCase = useMemo(() => new UpdateTaskUseCase(taskRepository), [taskRepository]);
  const deleteTaskUseCase = useMemo(() => new DeleteTaskUseCase(taskRepository), [taskRepository]);
  const pdfGenerator = useMemo(() => new PdfGenerator(), []);

  // Enhanced fetch tasks with better error handling
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching tasks from repository...');
      
      const fetchedTasks = await getTasksUseCase.execute();
      console.log('Fetched tasks:', fetchedTasks.map(t => ({ id: t.id, title: t.title, completed: t.completed })));
      
      setTasks(fetchedTasks);
      isInitialized.current = true;
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [getTasksUseCase]);

  // Validate state consistency with storage
  const validateConsistency = useCallback(async () => {
    if (!isInitialized.current) return;
    
    try {
      const storedTasks = await getTasksUseCase.execute();
      const currentTaskIds = new Set(tasks.map(t => t.id));
      const storedTaskIds = new Set(storedTasks.map(t => t.id));
      
      // Check for mismatches
      const hasNewTasks = storedTasks.some(t => !currentTaskIds.has(t.id));
      const hasRemovedTasks = tasks.some(t => !storedTaskIds.has(t.id));
      
      if (hasNewTasks || hasRemovedTasks) {
        console.warn('Task state inconsistency detected, resyncing...');
        setTasks(storedTasks);
        return storedTasks;
      }
      
      return tasks;
    } catch (err) {
      console.error('Consistency validation failed:', err);
      return tasks;
    }
  }, [tasks, getTasksUseCase]);

  const createTask = useCallback(async (params: { 
    title: string; 
    description?: string;
    pic?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      setError(null);
      console.log('Creating task:', params);
      
      const newTask = await createTaskUseCase.execute(params);
      console.log('Task created successfully:', newTask.id);
      
      // Update state optimistically
      setTasks(prev => [...prev, newTask]);
      
      // Validate consistency after a short delay
      setTimeout(validateConsistency, 100);
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task');
      throw err;
    }
  }, [createTaskUseCase, validateConsistency]);

  const toggleTask = useCallback(async (id: string) => {
    // Prevent multiple concurrent operations on the same task
    if (pendingOperations.current.has(id)) {
      console.log('Toggle operation already in progress for task:', id);
      return;
    }

    pendingOperations.current.add(id);
    
    try {
      setError(null);
      console.log('Toggling task:', id);
      console.log('Current tasks in state:', tasks.map(t => ({ id: t.id, title: t.title, completed: t.completed })));
      
      // First, ensure we have the latest state
      const currentTasks = await validateConsistency();
      const task = currentTasks.find(t => t.id === id);
      
      if (!task) {
        console.warn('Task not found in current state, attempting refresh...');
        // Force refresh and try again
        await fetchTasks();
        
        // Get fresh tasks after refetch
        const refreshedTasks = await getTasksUseCase.execute();
        const refreshedTask = refreshedTasks.find(t => t.id === id);
        
        if (!refreshedTask) {
          throw new Error(`Task with ID ${id} not found in storage`);
        }
        
        console.log('Task found after refresh:', refreshedTask);
        // Update state with refreshed tasks
        setTasks(refreshedTasks);
      }
      
      // Get the task again from the current state
      const taskToToggle = task || tasks.find(t => t.id === id);
      if (!taskToToggle) {
        throw new Error(`Task with ID ${id} not found`);
      }
      
      console.log('Toggling task completion:', { 
        id: taskToToggle.id, 
        currentCompleted: taskToToggle.completed, 
        newCompleted: !taskToToggle.completed 
      });
      
      // Execute the update
      const updatedTask = await updateTaskUseCase.execute(id, { 
        completed: !taskToToggle.completed 
      });
      
      console.log('Task updated successfully:', updatedTask);
      
      // Update state with the result
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      
    } catch (err) {
      console.error('Toggle task error:', err);
      setError(`Failed to update task: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Try to recover by refreshing the task list
      try {
        await fetchTasks();
      } catch (refreshErr) {
        console.error('Failed to refresh tasks after error:', refreshErr);
      }
    } finally {
      pendingOperations.current.delete(id);
    }
  }, [tasks, updateTaskUseCase, fetchTasks, getTasksUseCase, validateConsistency]);

  const deleteTask = useCallback(async (id: string) => {
    // Prevent multiple concurrent operations on the same task
    if (pendingOperations.current.has(id)) {
      console.log('Delete operation already in progress for task:', id);
      return;
    }

    pendingOperations.current.add(id);
    
    try {
      setError(null);
      console.log('Deleting task:', id);
      
      // Verify task exists before attempting deletion
      const task = tasks.find(t => t.id === id);
      if (!task) {
        // Try to refresh and check again
        await fetchTasks();
        const refreshedTask = tasks.find(t => t.id === id);
        if (!refreshedTask) {
          throw new Error(`Task with ID ${id} not found`);
        }
      }
      
      await deleteTaskUseCase.execute(id);
      console.log('Task deleted successfully:', id);
      
      // Update state by removing the deleted task
      setTasks(prev => prev.filter(t => t.id !== id));
      
    } catch (err) {
      console.error('Delete task error:', err);
      setError(`Failed to delete task: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Refresh to ensure consistency
      await fetchTasks();
    } finally {
      pendingOperations.current.delete(id);
    }
  }, [tasks, deleteTaskUseCase, fetchTasks]);

  const generateReport = useCallback(async () => {
    try {
      setError(null);
      console.log('TaskProvider: Starting report generation...');
      
      // Get the latest tasks to ensure we have fresh data
      await validateConsistency();
      const currentTasks = await getTasksUseCase.execute();
      
      console.log('TaskProvider: Generating report for', currentTasks.length, 'tasks');
      console.log('TaskProvider: Task data for report:', currentTasks.map(t => ({
        id: t.id,
        title: t.title?.substring(0, 50) + (t.title?.length > 50 ? '...' : ''),
        description: t.description?.substring(0, 50) + (t.description?.length > 50 ? '...' : ''),
        completed: t.completed,
        pic: t.pic
      })));
      
      // Validate tasks before sending to PDF generator
      const validTasks = currentTasks.filter(task => {
        if (!task) {
          console.warn('TaskProvider: Null task found, skipping');
          return false;
        }
        
        if (!task.id || !task.title) {
          console.warn('TaskProvider: Invalid task found:', { id: task.id, title: task.title });
          return false;
        }
        
        return true;
      });
      
      if (validTasks.length === 0) {
        throw new Error('No valid tasks found to generate report');
      }
      
      console.log('TaskProvider: Sending', validTasks.length, 'valid tasks to PDF generator');
      
      // Generate the PDF report
      await pdfGenerator.generateTaskReport(validTasks);
      
      console.log('TaskProvider: Report generated successfully');
      
    } catch (err) {
      console.error('TaskProvider: Failed to generate report:', err);
      setError(`Failed to generate report: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  }, [pdfGenerator, getTasksUseCase, validateConsistency]); // Removed 'tasks' dependency

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initial fetch on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Periodic consistency check (optional - can be removed if not needed)
  useEffect(() => {
    if (!isInitialized.current) return;
    
    const interval = setInterval(() => {
      if (pendingOperations.current.size === 0) {
        validateConsistency();
      }
    }, 30000); // Check every 30 seconds when idle
    
    return () => clearInterval(interval);
  }, [validateConsistency]);

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