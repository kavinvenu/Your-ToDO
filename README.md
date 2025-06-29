# SmartTasker Frontend

A modern, full-featured task management application built with React, TypeScript, and Tailwind CSS. This frontend connects to the SmartTasker backend API to provide a complete task management solution.

## Features

### 🔐 Authentication
- **Email/Password Authentication**: Traditional login and registration
- **OAuth Integration**: Google and GitHub OAuth support
- **JWT Token Management**: Secure session handling with automatic token refresh
- **Protected Routes**: Route protection based on authentication status

### 📋 Task Management
- **CRUD Operations**: Create, read, update, and delete tasks
- **Task Categories**: Organize tasks by categories
- **Priority Levels**: Low, Medium, High, and Urgent priority levels
- **Status Tracking**: Pending, In Progress, Completed, and Cancelled statuses
- **Due Date Management**: Set and track task due dates
- **Time Estimation**: Estimate and track actual time spent on tasks
- **Recurring Tasks**: Set up daily, weekly, monthly, or yearly recurring tasks
- **Task Tags**: Add custom tags to tasks for better organization

### 🔍 Advanced Filtering & Search
- **Real-time Search**: Search tasks by title, description, or tags
- **Status Filtering**: Filter by task status
- **Priority Filtering**: Filter by priority level
- **Category Filtering**: Filter by task category
- **Date Filtering**: Filter by due date ranges
- **Sorting Options**: Sort by due date, creation date, priority, status, or title
- **Pagination**: Efficient pagination for large task lists

### 👥 Task Sharing & Collaboration
- **Task Sharing**: Share tasks with other users via email
- **Permission Levels**: Read, Write, and Admin permissions
- **Shared Task Management**: View and manage shared tasks
- **Collaborative Comments**: Add comments to tasks
- **Activity Tracking**: Track task activity and changes

### 📊 Analytics & Insights
- **Task Statistics**: View total, pending, in-progress, completed, and overdue task counts
- **Progress Tracking**: Monitor task completion progress
- **Overdue Alerts**: Visual indicators for overdue tasks
- **Performance Metrics**: Track estimated vs actual time

### 🔔 Real-time Updates
- **Socket.IO Integration**: Real-time task updates across all connected clients
- **Live Notifications**: Instant updates when tasks are created, updated, or shared
- **Collaborative Editing**: See changes made by other users in real-time
- **Online Status**: Track user online/offline status

### 🎨 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between dark and light themes
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS
- **Loading States**: Smooth loading indicators and skeleton screens
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Toast Notifications**: Success, error, and info notifications

### 🔧 Technical Features
- **TypeScript**: Full type safety and better development experience
- **React Hooks**: Modern React patterns with custom hooks
- **Context API**: Global state management for authentication and themes
- **React Router**: Client-side routing with protected routes
- **API Integration**: RESTful API integration with error handling
- **Local Storage**: Persistent user preferences and session data

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Real-time**: Socket.IO Client
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- SmartTasker backend server running (see backend README)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SmartTasker/Client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the Client directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` (or the URL shown in the terminal)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
Client/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Common components (Header, Footer, Layout)
│   │   ├── dashboard/      # Dashboard-specific components
│   │   ├── home/          # Home page components
│   │   └── notifications/ # Notification components
│   ├── contexts/          # React contexts (Auth, Theme)
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Dashboard page
│   │   ├── home/          # Home page
│   │   ├── notifications/ # Notifications page
│   │   ├── profile/       # Profile page
│   │   └── settings/      # Settings page
│   ├── services/          # API and external services
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main App component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## API Integration

The frontend integrates with the SmartTasker backend API through the `api.ts` service file. Key features:

- **Authentication**: JWT token-based authentication
- **Task Management**: Full CRUD operations for tasks
- **User Management**: Profile updates and user search
- **Real-time Updates**: Socket.IO integration for live updates
- **Error Handling**: Comprehensive error handling and user feedback

## Real-time Features

The application uses Socket.IO for real-time updates:

- **Task Updates**: Real-time task creation, updates, and deletion
- **Task Sharing**: Instant notifications when tasks are shared
- **Comments**: Live comment updates
- **User Status**: Online/offline status tracking
- **Notifications**: Real-time notification delivery

## Authentication Flow

1. **Login/Register**: Users can authenticate via email/password or OAuth
2. **Token Storage**: JWT tokens are stored in localStorage
3. **Auto-refresh**: Tokens are automatically refreshed before expiration
4. **Route Protection**: Protected routes redirect to login if not authenticated
5. **Socket Connection**: Socket.IO connects after successful authentication

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## This project is a part of a hackathon run by https://www.katomaran.com
