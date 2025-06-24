import React, { useState, useCallback } from 'react';
import { Task } from '@/core/domain/entities/Task';
import { Button } from '@/presentation/components/common/Button';
import { Badge } from '@/presentation/components/common/Badge';
import { useTasks } from '@/presentation/hooks/useTasks';
import { formatDistance } from '@/presentation/utils/formatters';

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { toggleTask, deleteTask, error } = useTasks();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleToggle = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent the default checkbox behavior since we're handling it manually
    e.preventDefault();
    
    if (isToggling || isDeleting) {
      console.log('Operation already in progress, ignoring toggle request');
      return;
    }

    setIsToggling(true);
    setLocalError(null);

    try {
      console.log('TaskItem: Toggling task', { 
        id: task.id, 
        title: task.title, 
        currentCompleted: task.completed 
      });
      
      await toggleTask(task.id);
      
      console.log('TaskItem: Task toggled successfully');
    } catch (error) {
      console.error('TaskItem: Error toggling task:', error);
      setLocalError(error instanceof Error ? error.message : 'Failed to update task');
      
      // Reset the checkbox to its original state
      if (e.target) {
        e.target.checked = task.completed;
      }
    } finally {
      setIsToggling(false);
    }
  }, [task.id, task.title, task.completed, toggleTask, isToggling, isDeleting]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    if (isDeleting || isToggling) {
      console.log('Operation already in progress, ignoring delete request');
      return;
    }

    setIsDeleting(true);
    setLocalError(null);

    try {
      console.log('TaskItem: Deleting task', { id: task.id, title: task.title });
      await deleteTask(task.id);
      console.log('TaskItem: Task deleted successfully');
    } catch (error) {
      console.error('TaskItem: Error deleting task:', error);
      setLocalError(error instanceof Error ? error.message : 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  }, [task.id, task.title, deleteTask, isDeleting, isToggling]);

  // Enhanced date formatting with error handling
  const formatDate = useCallback((dateString: string | null | undefined) => {
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
  }, []);

  // Enhanced deadline status calculation
  const getDeadlineStatus = useCallback(() => {
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
          text: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`
        };
      } else if (diffDays === 0) {
        return { type: 'warning', text: 'Due today' };
      } else if (diffDays <= 3) {
        return { 
          type: 'warning', 
          text: diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days`
        };
      } else {
        return { type: 'info', text: `Due in ${diffDays} days` };
      }
    } catch (error) {
      console.error('Error calculating deadline status:', error);
      return { type: 'warning', text: 'Date error' };
    }
  }, [task.endDate, task.completed]);

  const deadlineStatus = getDeadlineStatus();
  const displayError = localError || error;

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''} ${isToggling || isDeleting ? 'loading' : ''}`}>
      {/* Error Display */}
      {displayError && (
        <div className="error-message" style={{ 
          color: 'red', 
          fontSize: '0.875rem', 
          marginBottom: '0.5rem',
          padding: '0.25rem',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px'
        }}>
          {displayError}
        </div>
      )}

      <div className="task-content">
        {/* Checkbox with enhanced handling */}
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            disabled={isToggling || isDeleting}
            className={`task-checkbox ${isToggling ? 'loading' : ''}`}
            aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          />
          <span className="checkmark"></span>
          {isToggling && <span className="loading-spinner">⟳</span>}
        </label>

        {/* Task Details */}
        <div className="task-details">
          <h3 className={`task-title ${task.completed ? 'completed' : ''}`}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className="task-description">
              {task.description}
            </p>
          )}

          <div className="task-meta">
            {task.pic && (
              <div className="task-pic">
                <span className="meta-label">PIC:</span>
                <span className="meta-value">{task.pic}</span>
              </div>
            )}

            {task.startDate && (
              <div className="task-start-date">
                <span className="meta-label">Start:</span>
                <span className="meta-value">{formatDate(task.startDate)}</span>
              </div>
            )}

            {task.endDate && (
              <div className="task-end-date">
                <span className="meta-label">Due:</span>
                <span className="meta-value">{formatDate(task.endDate)}</span>
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div className="task-badges">
            {deadlineStatus && (
              <Badge type={deadlineStatus.type as any}>
                {deadlineStatus.text}
              </Badge>
            )}
            
            <Badge type={task.completed ? 'success' : 'pending'}>
              {task.completed ? 'Completed' : 'Pending'}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="task-actions">
          <Button
            onClick={handleDelete}
            disabled={isDeleting || isToggling}
            variant="danger"
            size="sm"
            className="delete-button"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .task-item {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 0.5rem;
          background: white;
          transition: all 0.2s ease;
        }

        .task-item:hover {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .task-item.loading {
          opacity: 0.7;
          pointer-events: none;
        }

        .task-item.completed {
          background-color: #f8fffe;
          border-color: #10b981;
        }

        .task-content {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .checkbox-container {
          position: relative;
          display: flex;
          align-items: center;
          cursor: pointer;
          margin-top: 0.25rem;
        }

        .task-checkbox {
          width: 1.25rem;
          height: 1.25rem;
          cursor: pointer;
        }

        .task-checkbox:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .loading-spinner {
          position: absolute;
          left: 1.5rem;
          animation: spin 1s linear infinite;
          color: #3b82f6;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .task-details {
          flex: 1;
        }

        .task-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .task-title.completed {
          text-decoration: line-through;
          color: #6b7280;
        }

        .task-description {
          margin: 0 0 0.75rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .task-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
        }

        .task-meta > div {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .meta-label {
          font-weight: 500;
          color: #6b7280;
        }

        .meta-value {
          color: #1f2937;
        }

        .task-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .task-actions {
          display: flex;
          align-items: flex-start;
        }

        .delete-button {
          white-space: nowrap;
        }

        .error-message {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TaskItem;