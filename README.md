# Task Manager UI

A modern task management dashboard built with **Next.js**, **TypeScript**, and **Tailwind CSS** that allows users to efficiently manage their tasks and generate PDF reports.

## 🚀 Features

- **Task Management**
  - View all tasks with title, description, and completion status
  - Create new tasks with validation
  - Mark tasks as complete/incomplete
  - Delete tasks
  - Visual indicators for completed tasks

- **PDF Report Generation**
  - Download comprehensive PDF reports of all tasks
  - Includes task details (title, description, status)
  - Timestamped reports with app branding

- **Modern UI/UX**
  - Responsive design with Tailwind CSS
  - Clean and intuitive interface
  - Real-time updates
  - Form validation with error handling

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.3.4 + React 19 + TypeScript
- **Styling**: Tailwind CSS 4.1.10
- **PDF Generation**: jsPDF 3.0.1
- **Validation**: Zod 3.25.67
- **Testing**: Jest + React Testing Library
- **Development**: Turbopack for fast development

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd task-manager-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Managing Tasks
1. **View Tasks**: All tasks are displayed on the main dashboard
2. **Create Task**: Click "Add Task" button, fill in title (required) and description (optional)
3. **Complete Task**: Click the checkbox or toggle button next to any task
4. **Delete Task**: Click the delete button to remove a task

### Generate PDF Report
1. Click the "Download Report" button
2. A PDF will be generated containing all current tasks
3. The file will be automatically downloaded to your device

## 🎯 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality
- `npm run test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run format` - Format code with Prettier

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🌐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Add your environment variables here
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🔧 Configuration

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Jest** for testing

## 📝 API Integration

This frontend is designed to work with a FastAPI backend. Ensure your backend provides the following endpoints:

- `GET /api/tasks` - Fetch all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/{id}` - Update a task
- `DELETE /api/tasks/{id}` - Delete a task

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## Copyright
Bil Awal for Cybermax Pre-Test