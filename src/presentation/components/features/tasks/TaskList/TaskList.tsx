'use client';

import React, { useMemo, useState } from 'react';
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
  sortBy?: 'created_at' | 'title' | 'status' | 'due_date' | 'pic';
  sortOrder?: 'asc' | 'desc';
  onClearSearch?: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  searchResults,
  filterCompleted,
  sortBy = 'created_at',
  sortOrder = 'desc',
  onClearSearch,
}) => {
  const { tasks, loading, error, generateReport, refetch } = useTasks();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Memoize safeTasks to prevent unnecessary re-renders
  const safeTasks = useMemo(() => {
    return Array.isArray(tasks) ? tasks : [];
  }, [tasks]);

  const displayTasks = useMemo(() => {
    return Array.isArray(searchResults) ? searchResults : safeTasks;
  }, [searchResults, safeTasks]);

  // Calculate pagination from actual tasks (not search results)
  const calculatedPagination = useMemo(() => {
    const total = safeTasks.length;
    const completed = safeTasks.filter(task => task?.completed === true).length;
    const pending = total - completed;
    
    return { total, completed, pending };
  }, [safeTasks]);

  // Calculate search results pagination separately
  const searchPagination = useMemo(() => {
    if (!Array.isArray(searchResults)) return null;
    
    const total = searchResults.length;
    const completed = searchResults.filter(task => task?.completed === true).length;
    const pending = total - completed;
    
    return { total, completed, pending };
  }, [searchResults]);

  // Enhanced sorting function with better null/undefined handling
  const processedTasks = useMemo(() => {
    if (!displayTasks || displayTasks.length === 0) {
      return [];
    }

    let result = [...displayTasks];

    // Apply completion filter
    if (filterCompleted !== undefined) {
      result = result.filter(task => task?.completed === filterCompleted);
    }

    // Enhanced sorting with null/undefined handling
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          const titleA = a?.title || '';
          const titleB = b?.title || '';
          comparison = titleA.localeCompare(titleB);
          break;
          
        case 'status':
          const statusA = a?.completed ? 1 : 0;
          const statusB = b?.completed ? 1 : 0;
          comparison = statusA - statusB;
          break;
          
        case 'due_date':
          const dueDateA = a?.endDate ? new Date(a.endDate).getTime() : 0;
          const dueDateB = b?.endDate ? new Date(b.endDate).getTime() : 0;
          comparison = dueDateA - dueDateB;
          break;
          
        case 'pic':
          const picA = a?.pic || '';
          const picB = b?.pic || '';
          comparison = picA.localeCompare(picB);
          break;
          
        case 'created_at':
        default:
          const createdA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const createdB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = createdA - createdB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [displayTasks, filterCompleted, sortBy, sortOrder]);

  // Enhanced report generation with error handling
  const handleGenerateReport = async () => {
    if (!displayTasks || displayTasks.length === 0) {
      return;
    }

    setIsGeneratingReport(true);
    try {
      await generateReport();
    } catch (error) {
      console.error('Error generating report:', error);
      // You could add a toast notification here
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Handle clear search with proper callback
  const handleClearSearch = () => {
    if (onClearSearch) {
      onClearSearch();
    } else {
      // Fallback to reload if no callback provided
      window.location.reload();
    }
  };

  // Enhanced retry function
  const handleRetry = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error retrying:', error);
    }
  };

  // Loading state
  if (loading && !searchResults && !safeTasks.length) {
    return <LoadingState message="Loading tasks..." />;
  }

  // Error state
  if (error && !searchResults && !safeTasks.length) {
    return (
      <ErrorState
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  // Use appropriate pagination data based on context
  const currentPagination = searchResults ? searchPagination : calculatedPagination;

  // Get filter and sort status for display
  const getStatusText = () => {
    const baseTasks = searchResults ? 'search results' : 'tasks';
    const filterText = filterCompleted !== undefined 
      ? ` (${filterCompleted ? 'completed' : 'pending'} only)`
      : '';
    const sortText = sortBy !== 'created_at' 
      ? ` • sorted by ${sortBy.replace('_', ' ')}`
      : '';
    
    return `${currentPagination?.total || 0} ${baseTasks}${filterText}${sortText}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {searchResults ? (
                <>
                  <SearchIcon className="w-5 h-5 text-gray-400" />
                  Search Results
                </>
              ) : (
                <>
                  <TaskIcon className="w-5 h-5 text-gray-400" />
                  Tasks
                </>
              )}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {getStatusText()}
              {currentPagination && currentPagination.total > 0 && (
                <> • {currentPagination.completed} completed • {currentPagination.pending} pending</>
              )}
            </p>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            {searchResults && (
              <Button
                variant="secondary"
                size="small"
                onClick={handleClearSearch}
                className="flex items-center gap-2"
              >
                <ClearIcon className="w-4 h-4" />
                Clear Search
              </Button>
            )}
            <Button
              variant="secondary"
              size="small"
              onClick={handleGenerateReport}
              disabled={displayTasks.length === 0 || isGeneratingReport}
              loading={isGeneratingReport}
              className="flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              {isGeneratingReport ? 'Generating...' : 'Export'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-0">
        {processedTasks.length === 0 ? (
          <EmptyState
            title={searchResults ? "No tasks found" : "No tasks yet"}
            description={
              searchResults 
                ? "Try adjusting your search query or filters"
                : "Create your first task to get started"
            }
            icon={
              searchResults ? (
                <SearchIcon className="w-12 h-12 text-gray-400" />
              ) : (
                <TaskIcon className="w-12 h-12 text-gray-400" />
              )
            }
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {processedTasks.map((task, index) => {
              // Add error boundary protection for individual tasks
              if (!task || !task.id) {
                console.warn(`Invalid task at index ${index}:`, task);
                return null;
              }
              
              return (
                <TaskItem key={task.id} task={task} />
              );
            })}
          </div>
        )}
      </div>
      
      {/* Loading overlay when generating report */}
      {isGeneratingReport && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Generating report...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Icon Components
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const TaskIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const ClearIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);