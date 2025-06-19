'use client';

import { TaskProvider } from '@/presentation/providers/TaskProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TaskProvider>
      {children}
    </TaskProvider>
  );
}
