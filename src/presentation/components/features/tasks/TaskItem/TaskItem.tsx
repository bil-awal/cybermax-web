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
            <span>Created {formatDistance(task.createdAt)}</span>
            {task.updatedAt !== task.createdAt && (
              <span>Updated {formatDistance(task.updatedAt)}</span>
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