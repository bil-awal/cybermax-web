import jsPDF from 'jspdf';
import { Task } from '@/core/domain/entities/Task';

export interface IPdfGenerator {
  generateTaskReport(tasks: Task[]): void;
}

export class PdfGenerator implements IPdfGenerator {
  private readonly PAGE_WIDTH = 210; // A4 width in mm
  private readonly PAGE_HEIGHT = 297; // A4 height in mm
  private readonly MARGIN = 20;
  private readonly CONTENT_WIDTH = this.PAGE_WIDTH - (this.MARGIN * 2);

  generateTaskReport(tasks: Task[]): void {
    try {
      console.log('PdfGenerator: Starting report generation for', tasks.length, 'tasks');
      
      // Validate and clean task data
      const cleanTasks = this.validateAndCleanTasks(tasks);
      console.log('PdfGenerator: Cleaned tasks:', cleanTasks.length);
      
      const doc = new jsPDF();
      const now = new Date();
      
      // Add header
      this.addReportHeader(doc, now, cleanTasks);
      
      // Add summary section
      this.addSummarySection(doc, cleanTasks);
      
      // Add task list
      const currentY = this.addTaskList(doc, cleanTasks); // Fixed: Line 32 - const instead of let
      
      // Add footer
      this.addFooter(doc, currentY);
      
      // Generate filename with timestamp
      const timestamp = now.toISOString().slice(0, 19).replace(/[:\-T]/g, '');
      const filename = `task-manager-report-${timestamp}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
      console.log('PdfGenerator: Report generated successfully:', filename);
    } catch (error) {
      console.error('PdfGenerator: Error generating report:', error);
      throw new Error(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and clean task data to prevent duplication issues
   */
  private validateAndCleanTasks(tasks: Task[]): Task[] {
    if (!Array.isArray(tasks)) {
      console.warn('PdfGenerator: Invalid tasks array, using empty array');
      return [];
    }

    return tasks.filter(task => {
      if (!task) {
        console.warn('PdfGenerator: Null task found, skipping');
        return false;
      }

      if (!task.id || !task.title) {
        console.warn('PdfGenerator: Task missing required fields:', { id: task.id, title: task.title });
        return false;
      }

      return true;
    }).map(task => {
      // Clean the task data to prevent duplication
      return {
        ...task,
        title: this.cleanString(task.title),
        description: this.cleanString(task.description || ''),
        pic: this.cleanString(task.pic || ''),
        startDate: task.startDate || null,
        endDate: task.endDate || null
      } as Task;
    });
  }

  /**
   * Clean string data to remove duplications and formatting issues
   */
  private cleanString(str: string): string {
    if (!str || typeof str !== 'string') return '';
    
    // Remove duplicated content (e.g., "Title*Title*Title" -> "Title")
    const parts = str.split('*');
    if (parts.length > 1 && parts.every(part => part === parts[0])) {
      return parts[0].trim();
    }
    
    // Remove repeated phrases separated by common delimiters
    const cleanedStr = str
      .replace(/(.+?)\1+/g, '$1') // Remove immediate repetitions
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    return cleanedStr;
  }

  /**
   * Add report header with title and metadata
   */
  private addReportHeader(doc: jsPDF, date: Date, _tasks: Task[]): void { // Fixed: Line 109 - added underscore to unused parameter
    // Main title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Task Manager Report', this.MARGIN, 30);
    
    // Subtitle with generation info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const generatedText = `Generated: ${date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    doc.text(generatedText, this.MARGIN, 40);
    
    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(this.MARGIN, 45, this.PAGE_WIDTH - this.MARGIN, 45);
  }

  /**
   * Add summary statistics section
   */
  private addSummarySection(doc: jsPDF, tasks: Task[]): void {
    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);
    const overdueTasks = this.getOverdueTasks(tasks);
    
    // Summary title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Summary', this.MARGIN, 60);
    
    // Statistics
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const stats = [
      { label: 'Total Tasks:', value: tasks.length.toString(), color: [40, 40, 40] },
      { label: 'Completed:', value: completedTasks.length.toString(), color: [34, 197, 94] },
      { label: 'Pending:', value: pendingTasks.length.toString(), color: [249, 115, 22] },
      { label: 'Overdue:', value: overdueTasks.length.toString(), color: [239, 68, 68] }
    ];
    
    let yPos = 70;
    stats.forEach(stat => {
      doc.setTextColor(100, 100, 100);
      doc.text(stat.label, this.MARGIN, yPos);
      
      doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.value, this.MARGIN + 40, yPos);
      doc.setFont('helvetica', 'normal');
      
      yPos += 8;
    });
    
    // Section separator
    doc.setDrawColor(200, 200, 200);
    doc.line(this.MARGIN, yPos + 5, this.PAGE_WIDTH - this.MARGIN, yPos + 5);
  }

  /**
   * Add task list to the PDF
   */
  private addTaskList(doc: jsPDF, tasks: Task[]): number {
    let currentY = 115;
    
    // Section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Task Details', this.MARGIN, currentY);
    currentY += 15;
    
    // Sort tasks: completed tasks at the end
    const sortedTasks = [...tasks].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
    
    sortedTasks.forEach((task, index) => {
      currentY = this.addTaskItem(doc, task, index + 1, currentY);
      currentY += 5; // Spacing between tasks
      
      // Add new page if needed
      if (currentY > this.PAGE_HEIGHT - 40) {
        doc.addPage();
        currentY = 30;
      }
    });
    
    return currentY;
  }

  /**
   * Add individual task item
   */
  private addTaskItem(doc: jsPDF, task: Task, index: number, startY: number): number {
    let currentY = startY;
    
    // Task number and title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    
    const taskTitle = `${index}. ${task.title || 'Untitled Task'}`;
    const titleLines = doc.splitTextToSize(taskTitle, this.CONTENT_WIDTH - 60);
    
    titleLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, this.MARGIN, currentY);
      if (lineIndex === 0) {
        // Add status badge on the first line
        this.addStatusBadge(doc, task, currentY);
      }
      currentY += 6;
    });
    
    // Description
    if (task.description && task.description.trim()) {
      currentY += 2;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      
      const descLines = doc.splitTextToSize(task.description.trim(), this.CONTENT_WIDTH - 10);
      descLines.forEach((line: string) => {
        doc.text(line, this.MARGIN + 5, currentY);
        currentY += 5;
      });
    }
    
    // Metadata section
    currentY = this.addTaskMetadata(doc, task, currentY);
    
    return currentY;
  }

  /**
   * Add task metadata (PIC, dates, etc.)
   */
  private addTaskMetadata(doc: jsPDF, task: Task, startY: number): number {
    const currentY = startY + 3; // Fixed: Line 259 - const instead of let since it's never reassigned
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    
    const metadata: Array<{ label: string; value: string }> = [];
    
    // Add PIC if available
    if (task.pic && task.pic.trim()) {
      metadata.push({ label: 'Person in Charge:', value: task.pic.trim() });
    }
    
    // Add dates if available
    if (task.startDate) {
      metadata.push({ label: 'Start Date:', value: this.formatDate(task.startDate) });
    }
    
    if (task.endDate) {
      metadata.push({ label: 'End Date:', value: this.formatDate(task.endDate) });
    }
    
    // Add creation date
    if (task.createdAt) {
      const createdDate = task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt);
      metadata.push({ label: 'Created:', value: this.formatDate(createdDate.toISOString()) });
    }
    
    // Render metadata in two columns
    const columnWidth = this.CONTENT_WIDTH / 2;
    let leftColumnY = currentY;
    let rightColumnY = currentY;
    
    metadata.forEach((item, index) => {
      const isLeftColumn = index % 2 === 0;
      const x = isLeftColumn ? this.MARGIN + 5 : this.MARGIN + columnWidth + 5;
      const y = isLeftColumn ? leftColumnY : rightColumnY;
      
      // Label
      doc.setFont('helvetica', 'bold');
      doc.text(item.label, x, y);
      
      // Value
      doc.setFont('helvetica', 'normal');
      const valueX = x + doc.getTextWidth(item.label) + 3;
      doc.text(item.value, valueX, y);
      
      if (isLeftColumn) {
        leftColumnY += 6;
      } else {
        rightColumnY += 6;
      }
    });
    
    return Math.max(leftColumnY, rightColumnY);
  }

  /**
   * Add status badge for task
   */
  private addStatusBadge(doc: jsPDF, task: Task, y: number): void {
    const badgeX = this.PAGE_WIDTH - this.MARGIN - 25;
    const badgeY = y - 4;
    const badgeWidth = 22;
    const badgeHeight = 6;
    
    // Set colors based on status
    if (task.completed) {
      doc.setFillColor(34, 197, 94); // Green
      doc.setTextColor(255, 255, 255);
    } else if (this.isOverdue(task)) {
      doc.setFillColor(239, 68, 68); // Red
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(249, 115, 22); // Orange
      doc.setTextColor(255, 255, 255);
    }
    
    // Draw badge background
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1, 1, 'F');
    
    // Add badge text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const badgeText = task.completed ? 'DONE' : (this.isOverdue(task) ? 'OVERDUE' : 'PENDING');
    const textWidth = doc.getTextWidth(badgeText);
    const textX = badgeX + (badgeWidth - textWidth) / 2;
    doc.text(badgeText, textX, badgeY + 4);
    
    // Reset text color
    doc.setTextColor(40, 40, 40);
  }

  /**
   * Add footer to the PDF
   */
  private addFooter(doc: jsPDF, _currentY: number): void { // Fixed: Line 355 - added underscore to unused parameter
    const footerY = this.PAGE_HEIGHT - 20;
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(this.MARGIN, footerY - 5, this.PAGE_WIDTH - this.MARGIN, footerY - 5);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    
    const footerText = 'Generated by Task Manager | Bil Awal | Cybermax Pre-Test';
    const textWidth = doc.getTextWidth(footerText);
    const centerX = (this.PAGE_WIDTH - textWidth) / 2;
    doc.text(footerText, centerX, footerY);
  }

  /**
   * Format date string for display
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (_error) { // Fixed: Line 407 - added underscore to unused error parameter
      console.error('PdfGenerator: Error formatting date:', _error);
      return 'Invalid Date';
    }
  }

  /**
   * Check if task is overdue
   */
  private isOverdue(task: Task): boolean {
    if (!task.endDate || task.completed) return false;
    
    try {
      const endDate = new Date(task.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return endDate < today;
    } catch {
      return false;
    }
  }

  /**
   * Get list of overdue tasks
   */
  private getOverdueTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => this.isOverdue(task));
  }
}