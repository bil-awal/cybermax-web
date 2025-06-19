'use client';

import { TaskForm } from '@/presentation/components/features/tasks/TaskForm';
import { TaskList } from '@/presentation/components/features/tasks/TaskList';
import { Header } from '@/presentation/components/layout/Header';
import { Container } from '@/presentation/components/common/Container';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container className="py-8">
        <TaskForm />
        <TaskList />
      </Container>
    </div>
  );
}
