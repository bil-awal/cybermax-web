#!/bin/bash

# Additional Components Setup Script
# Run this after the main setup script to create all common components

echo "🎨 Creating additional components..."

# Create required directories
mkdir -p \
  src/presentation/components/common/Button \
  src/presentation/components/common/Input \
  src/presentation/components/common/TextArea \
  src/presentation/components/common/Alert \
  src/presentation/components/common/Card \
  src/presentation/components/common/Badge \
  src/presentation/components/common/EmptyState \
  src/presentation/components/common/ErrorState \
  src/presentation/components/common/LoadingState \
  src/presentation/components/features/tasks/TaskForm \
  src/presentation/components/features/tasks/TaskItem \
  src/presentation/components/features/tasks/TaskList

# Button Component
cat > src/presentation/components/common/Button/Button.tsx << 'EOF'
import React from 'react';
import { ButtonProps } from './Button.types';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500',
  };
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };
  
  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabledClasses,
    widthClasses,
    className,
  ].join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
EOF

cat > src/presentation/components/common/Button/Button.types.ts << 'EOF'
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
}
EOF

cat > src/presentation/components/common/Button/index.ts << 'EOF'
export { Button } from './Button';
export type { ButtonProps } from './Button.types';
EOF


# Task Form Component (updated for API)
cat > src/presentation/components/features/tasks/TaskForm/TaskForm.tsx << 'EOF'
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
      } else if (error && typeof error === 'object' && 'message' in error) {
        setMessage({ type: 'error', text: (error as any).message });
      } else {
        setMessage({ type: 'error', text: 'Failed to create task' });
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
EOF

cat > src/presentation/components/features/tasks/TaskForm/index.ts << 'EOF'
export { TaskForm } from './TaskForm';
EOF


# Task Item Component (updated for API)
cat > src/presentation/components/features/tasks/TaskItem/TaskItem.tsx << 'EOF'
import React, { useState } from 'react';
import { Task } from '@/core/domain/entities/Task';
import { Button } from '@/presentation/components/common/Button';
import { Badge } from '@/presentation/components/common/Badge';
import { useTasks } from '@/presentation/hooks/useTasks';
import { formatDistance } from '@/presentation/utils/formatters';

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { toggleTask, deleteTask } = useTasks();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggleTask(task.id);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTask(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`p-4 transition-opacity ${task.completed ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            disabled={isToggling}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-medium ${
            task.completed ? 'line-through text-gray-500' : 'text-gray-900'
          }`}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className={`mt-1 text-sm ${
              task.completed ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {task.description}
            </p>
          )}
          
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <Badge variant={task.completed ? 'success' : 'warning'}>
              {task.completed ? 'Completed' : 'Pending'}
            </Badge>
            <span>Created {formatDistance(task.created_at)}</span>
            {task.updated_at !== task.created_at && (
              <span>Updated {formatDistance(task.updated_at)}</span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <Button
            variant={task.completed ? 'secondary' : 'success'}
            size="small"
            onClick={handleToggle}
            loading={isToggling}
          >
            {task.completed ? 'Undo' : 'Complete'}
          </Button>
          
          <Button
            variant="danger"
            size="small"
            onClick={handleDelete}
            loading={isDeleting}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
EOF

cat > src/presentation/components/features/tasks/TaskItem/index.ts << 'EOF'
export { TaskItem } from './TaskItem';
EOF


# Task List Component (updated for API and search)
cat > src/presentation/components/features/tasks/TaskList/TaskList.tsx << 'EOF'
'use client';

import React, { useMemo } from 'react';
import { Task } from '@/core/domain/entities/Task';
import { TaskItem } from '../TaskItem';
import { Button } from '@/presentation/components/common/Button';
import { Card } from '@/presentation/components/common/Card';
import { EmptyState } from '@/presentation/components/common/EmptyState';
import { ErrorState } from '@/presentation/components/common/ErrorState';
import { LoadingState } from '@/presentation/components/common/LoadingState';
import { useTasks } from '@/presentation/hooks/useTasks';

interface TaskListProps {
  searchResults?: Task[] | null;
  filterCompleted?: boolean;
  sortBy?: 'created_at' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const TaskList: React.FC<TaskListProps> = ({
  searchResults,
  filterCompleted,
  sortBy = 'created_at',
  sortOrder = 'desc',
}) => {
  const { tasks, loading, error, generateReport, refetch, pagination } = useTasks();

  const displayTasks = searchResults || tasks;

  const processedTasks = useMemo(() => {
    let result = [...displayTasks];

    if (filterCompleted !== undefined) {
      result = result.filter(task => task.completed === filterCompleted);
    }

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = Number(a.completed) - Number(b.completed);
          break;
        case 'created_at':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [displayTasks, filterCompleted, sortBy, sortOrder]);

  if (loading && !searchResults) {
    return <LoadingState message="Loading tasks..." />;
  }

  if (error && !searchResults) {
    return (
      <ErrorState
        message={error}
        onRetry={refetch}
      />
    );
  }

  return (
    <Card>
      <Card.Header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            {searchResults ? 'Search Results' : 'Tasks'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {searchResults 
              ? \`Found \${searchResults.length} tasks\`
              : \`\${pagination.total} total • \${pagination.completed} completed • \${pagination.pending} pending\`
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          {searchResults && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => window.location.reload()}
            >
              Clear Search
            </Button>
          )}
          <Button
            variant="secondary"
            size="small"
            onClick={generateReport}
            disabled={displayTasks.length === 0}
            className="flex items-center gap-2"
          >
            <DownloadIcon className="w-4 h-4" />
            Download Report
          </Button>
        </div>
      </Card.Header>

      <Card.Body className="p-0">
        {processedTasks.length === 0 ? (
          <EmptyState
            title={searchResults ? "No tasks found" : "No tasks yet"}
            description={
              searchResults 
                ? "Try a different search query"
                : "Create your first task to get started"
            }
            icon={<TaskIcon className="w-12 h-12 text-gray-400" />}
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {processedTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const TaskIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);
EOF

cat > src/presentation/components/features/tasks/TaskList/index.ts << 'EOF'
export { TaskList } from './TaskList';
EOF


# Common Input Component
cat > src/presentation/components/common/Input/Input.tsx << 'EOF'
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const inputClasses = `
      w-full px-3 py-2 border rounded-md transition-colors
      focus:outline-none focus:ring-2 focus:ring-blue-500
      ${error ? 'border-red-500' : 'border-gray-300'}
      ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
      ${className}
    `;

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
EOF

cat > src/presentation/components/common/Input/index.ts << 'EOF'
export { Input } from './Input';
EOF


echo "✅ Additional components created!"
