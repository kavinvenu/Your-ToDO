# 🚀 SmartTasker Frontend

**SmartTasker** is a modern, feature-rich task management frontend built with **React**, **TypeScript**, and **Tailwind CSS**, designed to deliver an intuitive and powerful user experience. It integrates seamlessly with the SmartTasker backend API, offering a complete, real-time task collaboration platform.


https://github.com/user-attachments/assets/38f2ac70-8f87-45b5-98e4-8e9496f00984


---

## 🌟 Key Highlights

### 🔐 Secure Authentication
- **Email/Password Login**: Traditional login and registration
- **OAuth Support**: Sign in with Google or GitHub
- **JWT Session Management**: Secure, persistent login with automatic token refresh
- **Protected Routing**: Ensures authenticated access to private routes

### ✅ Comprehensive Task Management
- **Full CRUD**: Create, view, edit, and delete tasks
- **Categories & Tags**: Organize tasks effectively
- **Priority & Status**: Manage urgency and progress (Pending, In Progress, Completed, Cancelled)
- **Due Dates & Time Tracking**: Set deadlines, estimate time, and track actuals
- **Recurring Tasks**: Automate daily, weekly, monthly, or yearly tasks

### 🔍 Advanced Search & Filters
- **Instant Search**: Filter tasks by title, description, or tags
- **Multi-Factor Filtering**: Status, priority, category, due date, and more
- **Sorting Options**: Sort by title, date, priority, or status
- **Pagination**: Efficient navigation of large task lists

### 🤝 Collaboration & Sharing
- **Task Sharing**: Share tasks via email
- **Permissions**: Grant Read, Write, or Admin access
- **Task Comments**: Real-time collaborative commenting
- **Activity Logs**: Track edits and updates

### 📈 Insights & Analytics
- **Statistics**: Monitor total, pending, overdue, and completed tasks
- **Progress Tracking**: Visualize completion status
- **Overdue Alerts**: Highlight tasks needing attention
- **Time Comparison**: Estimate vs actual time reporting

### 🔔 Real-time Updates
- **Socket.IO Integration**: Live updates across users
- **Notifications**: Alerts for task changes and comments
- **Collaborative Editing**: See real-time edits
- **Online Status**: Know who’s online and active

### 🎨 Optimized User Experience
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark/Light Mode**: User preference toggle
- **Modern UI**: Clean layout using Tailwind CSS
- **UX Enhancements**: Loading indicators, skeletons, toasts, and more

### 🔧 Technical Highlights
- **TypeScript + React 18**: Strong typing and modern React architecture
- **Hooks & Context API**: Scalable global state management
- **Vite-Powered**: Fast build and dev environment
- **REST API Integration**: Secure communication with backend
- **Local Storage**: Save user preferences and sessions

---

## 🛠️ Tech Stack

| Feature         | Technology                 |
|-----------------|----------------------------|
| Framework       | React 18, TypeScript       |
| Styling         | Tailwind CSS               |
| Routing         | React Router DOM           |
| Real-time       | Socket.IO Client           |
| Date Handling   | date-fns                   |
| Icons           | Lucide React               |
| Build Tool      | Vite                       |
| Package Manager | npm                        |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- npm or yarn
- SmartTasker backend running (see backend README)

### Installation
git clone <repository-url>
cd SmartTasker/Client
npm install
Environment Setup
Create a .env file in the Client directory:

env
Copy code
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
Run the App
bash
Copy code
npm run dev
Open your browser at http://localhost:5173.

Build for Production
bash
Copy code
npm run build
Output will be in the dist/ directory.

📁 Project Structure
csharp
Copy code
Client/
├── public/               # Static assets
├── src/
│   ├── components/       # UI components
│   │   ├── common/       # Header, Footer, Layout
│   │   ├── dashboard/    # Dashboard-specific UI
│   │   ├── home/         # Homepage UI
│   │   └── notifications/# Notification components
│   ├── contexts/         # Global state (Auth, Theme)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # App pages
│   │   ├── auth/         # Auth pages
│   │   ├── dashboard/    # Dashboard
│   │   ├── home/         # Homepage
│   │   ├── notifications/# Notifications
│   │   ├── profile/      # Profile page
│   │   └── settings/     # Settings
│   ├── services/         # API services
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind setup
├── tsconfig.json         # TypeScript config
└── vite.config.ts        # Vite config
🔗 API Integration
Integrated via services/api.ts:

Authentication (JWT-based)

Task CRUD operations

Profile and user management

Socket.IO real-time sync

Comprehensive error handling

🔄 Authentication Flow
Login/Register via email/password or OAuth

JWT token stored in localStorage

Token Refresh before expiration

Protected Routes redirect unauthenticated users

Socket.IO connects post-authentication

🤝 Contributing
Fork the repository

Create a branch: git checkout -b feature/your-feature

Commit your changes: git commit -m "Add your feature"

Push to GitHub: git push origin feature/your-feature

Open a Pull Request 🎉

This project is a part of a hackathon run by https://www.katomaran.com 
