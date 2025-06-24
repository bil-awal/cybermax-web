import React, { useState } from 'react';
import { Task } from '@/core/domain/entities/Task';
import { Button } from '@/presentation/components/common/Button';
import { Badge } from '@/presentation/components/common/Badge';
import { useTasks } from '@/presentation/hooks/useTasks';
import { formatDistance } from '@/presentation/utils/formatters';
import { 
  UserIcon, 
  CalendarIcon, 
  ClockIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';

interface TaskItemProps {
  task: Task;
}

// Define proper badge variant types
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'primary';

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { toggleTask, deleteTask } = useTasks();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggleTask(task.id);
    } catch (error) {
      console.error('Error toggling task:', error);
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
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Enhanced date formatting with error handling
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if invalid
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC' // Use UTC to avoid timezone issues
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || 'Invalid Date';
    }
  };

  // Enhanced deadline status calculation with proper typing
  const getDeadlineStatus = (): { type: BadgeVariant; text: string } | null => {
    if (!task.endDate) return null;
    
    try {
      const today = new Date();
      const endDate = new Date(task.endDate);
      
      // Check if end date is valid
      if (isNaN(endDate.getTime())) {
        return { type: 'warning', text: 'Invalid date' };
      }
      
      // Set time to midnight for accurate day comparison
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (task.completed) {
        return { type: 'success', text: 'Completed' };
      } else if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        return { 
          type: 'danger', 
          text: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days` 
        };
      } else if (diffDays === 0) {
        return { type: 'warning', text: 'Due today' };
      } else if (diffDays === 1) {
        return { type: 'warning', text: 'Due tomorrow' };
      } else if (diffDays <= 3) {
        return { type: 'warning', text: `Due in ${diffDays} days` };
      } else if (diffDays <= 7) {
        return { type: 'info', text: `${diffDays} days remaining` };
      } else {
        return { type: 'secondary', text: `${diffDays} days remaining` };
      }
    } catch (error) {
      console.error('Error calculating deadline status:', error);
      return { type: 'warning', text: 'Date error' };
    }
  };

  const deadlineStatus = getDeadlineStatus();

  // Enhanced PIC badge color mapping with proper typing
  const getPicBadgeVariant = (pic: string | null | undefined): BadgeVariant => {
    if (!pic) return 'secondary';
    
    const normalizedPic = pic.toLowerCase().trim();
    switch (normalizedPic) {
      case 'head':
        return 'danger';
      case 'manager':
        return 'warning';
      case 'supervisor':
        return 'info';
      case 'staff':
        return 'primary';
      case 'intern':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  // Check if task is overdue and not completed
  const isOverdue = deadlineStatus?.type === 'danger' && !task.completed;

  return (
    <div className={`p-4 transition-all duration-200 hover:bg-gray-50 ${
      task.completed ? 'opacity-75' : ''
    } ${isOverdue ? 'border-l-4 border-red-500 bg-red-50' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={task.completed || false}
            onChange={handleToggle}
            disabled={isToggling}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className={`text-lg font-medium transition-all duration-200 ${
                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {task.title || 'Untitled Task'}
              </h3>
              
              {task.description && (
                <p className={`mt-1 text-sm transition-all duration-200 ${
                  task.completed ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {task.description}
                </p>
              )}
            </div>
            
            {/* Deadline Status Badge */}
            {deadlineStatus && (
              <Badge 
                variant={deadlineStatus.type}
                className="flex-shrink-0"
              >
                {deadlineStatus.text}
              </Badge>
            )}
          </div>
          
          {/* Task Details Grid */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {/* Person in Charge */}
            {task.pic && (
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 text-xs">PIC:</span>
                <Badge variant={getPicBadgeVariant(task.pic)} size="small">
                  {task.pic}
                </Badge>
              </div>
            )}
            
            {/* Start Date */}
            {task.startDate && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 text-xs">Start:</span>
                <span className="text-gray-700 font-medium">
                  {formatDate(task.startDate)}
                </span>
              </div>
            )}
            
            {/* End Date */}
            {task.endDate && (
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 text-xs">Due:</span>
                <span className={`font-medium transition-colors ${
                  isOverdue ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {formatDate(task.endDate)}
                </span>
              </div>
            )}
          </div>
          
          {/* Meta Information */}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <Badge 
              variant={task.completed ? 'success' : 'warning'} 
              size="small"
            >
              {task.completed ? 'Completed' : 'In Progress'}
            </Badge>
            
            {task.createdAt && (
              <span>
                Created {formatDistance(new Date(task.createdAt), new Date())} ago
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-2">
          <Button
            variant="ghost"
            size="small"
            onClick={handleDelete}
            disabled={isDeleting || isToggling}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};