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

  // Enhanced deadline status calculation
  const getDeadlineStatus = () => {
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

  // Enhanced PIC badge color mapping
  const getPicBadgeVariant = (pic: string | null | undefined) => {
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
                variant={deadlineStatus.type as any} 
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
                <Badge variant={getPicBadgeVariant(task.pic) as any} size="small">
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
              {task.completed ? 'Completed' : 'Pending'}
            </Badge>
            
            {task.createdAt && (
              <span>Created {formatDistance(task.createdAt)}</span>
            )}
            
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <span>Updated {formatDistance(task.updatedAt)}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button
            variant={task.completed ? 'secondary' : 'success'}
            size="small"
            onClick={handleToggle}
            loading={isToggling}
            disabled={isToggling}
            className="min-w-[80px] transition-all duration-200"
          >
            {isToggling ? 'Loading...' : task.completed ? 'Undo' : 'Complete'}
          </Button>
          
          <Button
            variant="danger"
            size="small"
            onClick={handleDelete}
            loading={isDeleting}
            disabled={isDeleting}
            className="min-w-[70px] transition-all duration-200"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Icon Components with better styling
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);