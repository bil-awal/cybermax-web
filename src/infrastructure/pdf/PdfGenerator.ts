import jsPDF from 'jspdf';
import { Task } from '@/core/domain/entities/Task';

export interface IPdfGenerator {
  generateTaskReport(tasks: Task[]): void;
}

export class PdfGenerator implements IPdfGenerator {
  generateTaskReport(tasks: Task[]): void {
    const doc = new jsPDF();
    const now = new Date();
    
    // Header
    this.addHeader(doc, now, tasks);
    
    // Content
    this.addTaskList(doc, tasks);
    
    // Save
    doc.save(`task-report-${now.getTime()}.pdf`);
  }

  private addHeader(doc: jsPDF, date: Date, tasks: Task[]): void {
    doc.setFontSize(20);
    doc.text('Task Manager Report', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${date.toLocaleString()}`, 14, 30);
    doc.text(`Total Tasks: ${tasks.length}`, 14, 36);
    doc.text(`Completed: ${tasks.filter(t => t.completed).length}`, 14, 42);
    doc.text(`Pending: ${tasks.filter(t => !t.completed).length}`, 14, 48);
    
    doc.line(14, 52, 196, 52);
  }

  private addTaskList(doc: jsPDF, tasks: Task[]): void {
    let yPosition = 60;
    
    tasks.forEach((task, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      this.addTaskItem(doc, task, index, yPosition);
      yPosition += this.calculateTaskHeight(doc, task);
    });
  }

  private addTaskItem(doc: jsPDF, task: Task, index: number, yPosition: number): void {
    // Title
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text(`${index + 1}. ${task.title}`, 14, yPosition);
    
    // Status
    this.addStatus(doc, task, yPosition);
    
    // Description
    if (task.description) {
      yPosition += 6;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(task.description, 170);
      lines.forEach((line: string) => {
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });
    }
    
    // Metadata
    yPosition += 2;
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(`Created: ${task.createdAt.toLocaleString()}`, 20, yPosition);
    doc.setTextColor(0, 0, 0);
  }

  private addStatus(doc: jsPDF, task: Task, yPosition: number): void {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    const status = task.completed ? '[COMPLETED]' : '[PENDING]';
    
    if (task.completed) {
      doc.setTextColor(0, 128, 0); // Green for completed
    } else {
      doc.setTextColor(255, 165, 0); // Orange for pending
    }
    
    doc.text(status, 160, yPosition);
    doc.setTextColor(0, 0, 0); // Reset to black
  }

  private calculateTaskHeight(doc: jsPDF, task: Task): number {
    let height = 10; // Base height
    
    if (task.description) {
      const lines = doc.splitTextToSize(task.description, 170);
      height += lines.length * 5 + 6;
    }
    
    return height + 5; // Extra padding
  }
}