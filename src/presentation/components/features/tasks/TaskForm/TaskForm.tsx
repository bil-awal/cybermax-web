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

// Enhanced PIC options with better structure
const picOptions = [
  { value: '', label: 'Select Person in Charge' },
  { value: 'Head', label: 'Head' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Intern', label: 'Intern' }
];

// Custom Select Component to replace missing SelectInput
interface SelectInputProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  id?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

const SelectInput: React.FC<SelectInputProps> = ({
  options,
  value,
  onChange,
  id,
  name,
  className,
  disabled,
  required
}) => (
  <select
    id={id}
    name={name}
    value={value}
    onChange={onChange}
    className={className}
    disabled={disabled}
    required={required}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const TaskForm: React.FC = () => {
  const { createTask } = useTasks();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pic, setPic] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Enhanced validation function
  const validateForm = (): string | null => {
    if (!title.trim()) {
      return 'Title is required';
    }
    
    if (!pic) {
      return 'Person in Charge is required';
    }
    
    if (!startDate) {
      return 'Start Date is required';
    }
    
    if (!endDate) {
      return 'End Date is required';
    }
    
    // Validate date logic
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Please enter valid dates';
    }
    
    if (start > end) {
      return 'End Date must be after Start Date';
    }
    
    // More flexible date validation - allow today or future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    
    if (start < today) {
      return 'Start Date cannot be in the past';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    setMessage(null);

    try {
      // Client-side validation first
      const validationError = validateForm();
      if (validationError) {
        setMessage({ type: 'error', text: validationError });
        return;
      }

      // Prepare task data including all fields
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined, // Handle empty description
        pic,
        startDate,
        endDate
      };

      // Validate with schema if available
      let validatedData;
      try {
        validatedData = createTaskSchema.parse(taskData);
      } catch (schemaError) {
        // If schema validation fails, use the original data
        console.warn('Schema validation failed, using original data:', schemaError);
        validatedData = taskData;
      }
      
      setLoading(true);
      await createTask(validatedData);
      
      // Reset form fields
      setTitle('');
      setStartDate('');
      setEndDate('');
      setPic('');
      setDescription('');
      setMessage({ type: 'success', text: 'Task created successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error creating task:', error);
      
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        setMessage({ 
          type: 'error', 
          text: `${firstError.path.join('.')}: ${firstError.message}` 
        });
      } else {
        setMessage({ type: 'error', text: getErrorMessage(error) });
      }
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date validation
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Clear error message when user starts typing
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (message?.type === 'error') {
      setMessage(null);
    }
  };

  const handlePicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPic(e.target.value);
    if (message?.type === 'error') {
      setMessage(null);
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // Auto-adjust end date if it's before new start date
    if (endDate && newStartDate > endDate) {
      setEndDate(newStartDate);
    }
    
    if (message?.type === 'error') {
      setMessage(null);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    if (message?.type === 'error') {
      setMessage(null);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
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
            onChange={handleTitleChange}
            placeholder="Enter task title"
            required
            disabled={loading}
            className={!title.trim() && message?.type === 'error' ? 'border-red-500' : ''}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Person in Charge <span className="text-red-500">*</span>
            </label>
            <SelectInput 
              options={picOptions}
              value={pic}
              onChange={handlePicChange}
              id="pic"
              name="pic"
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                !pic && message?.type === 'error' 
                  ? 'border-red-500' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={handleStartDateChange}
              placeholder="Select start date"
              disabled={loading}
              required
              min={getTodayDate()}
              className={!startDate && message?.type === 'error' ? 'border-red-500' : ''}
            />

            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={handleEndDateChange}
              placeholder="Select end date"
              disabled={loading}
              required
              min={startDate || getTodayDate()}
              className={!endDate && message?.type === 'error' ? 'border-red-500' : ''}
            />
          </div>
          
          <TextArea
            label="Description (Optional)"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Enter task description..."
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
            disabled={loading || !title.trim() || !pic || !startDate || !endDate}
          >
            {loading ? 'Creating Task...' : 'Create Task'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};