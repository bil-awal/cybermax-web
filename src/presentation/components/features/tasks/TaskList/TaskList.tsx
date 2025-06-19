'use client';

import React, { useMemo } from 'react';
import { Task } from '@/core/domain/entities/Task';
import { TaskItem } from '../TaskItem';
import { Button } from '@/presentation/components/common/Button';
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

  // Ensure we have default values for tasks
  const safeTasks = tasks || [];
  const displayTasks = searchResults || safeTasks;

  // Calculate pagination from actual tasks if pagination is not available
  const calculatedPagination = useMemo(() => {
    if (pagination && pagination.total > 0) {
      return pagination;
    }
    
    // Fallback: calculate from actual tasks
    const total = safeTasks.length;
    const completed = safeTasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    return { total, completed, pending };
  }, [pagination, safeTasks]);

  const processedTasks = useMemo(() => {
    if (!displayTasks || displayTasks.length === 0) {
      return [];
    }

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
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            {searchResults ? 'Search Results' : 'Tasks'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {searchResults 
              ? `Found ${searchResults.length} tasks`
              : `${calculatedPagination.total} total • ${calculatedPagination.completed} completed • ${calculatedPagination.pending} pending`
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
      </div>

      <div className="p-0">
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
      </div>
    </div>
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