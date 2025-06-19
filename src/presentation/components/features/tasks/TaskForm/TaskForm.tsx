'use client';

import React, { useState } from 'react';
import { Button } from '@/presentation/components/common/Button';
import { Input } from '@/presentation/components/common/Input';
import { TextArea } from '@/presentation/components/common/TextArea';
import { Alert } from '@/presentation/components/common/Alert';
import { Card } from '@/presentation/components/common/Card';
import { useTasks } from '@/presentation/hooks/useTasks';
import { createTaskSchema } from '@/core/application/dto/CreateTaskDTO';
import { ZodError } from 'zod';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
};

export const TaskForm: React.FC = () => {
  const { createTask } = useTasks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async () => {
    setMessage(null);

    try {
      const validatedData = createTaskSchema.parse({ title, description });
      
      setLoading(true);
      await createTask(validatedData);
      
      setTitle('');
      setDescription('');
      setMessage({ type: 'success', text: 'Task created successfully!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      if (error instanceof ZodError) {
        setMessage({ type: 'error', text: error.errors[0].message });
      } else {
        setMessage({ type: 'error', text: getErrorMessage(error) });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <Card.Header>
        <h2 className="text-xl font-semibold">Create New Task</h2>
      </Card.Header>
      <Card.Body>
        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
            disabled={loading}
          />
          
          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description (optional)"
            rows={3}
            disabled={loading}
          />
          
          {message && (
            <Alert 
              variant={message.type}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}
          
          <Button
            variant="primary"
            fullWidth
            loading={loading}
            onClick={handleSubmit}
          >
            Create Task
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};