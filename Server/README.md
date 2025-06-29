# SmartTasker Backend Server

A full-stack MERN task management application with OAuth authentication, real-time updates, and collaborative features.

## 🚀 Features

- **OAuth Authentication**: Google and GitHub login
- **JWT-based Session Management**: Secure token-based authentication
- **Real-time Updates**: Socket.IO for live task updates
- **Task Management**: Full CRUD operations with sharing
- **User Collaboration**: Share tasks with other users
- **Advanced Filtering**: Search, filter, and sort tasks
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Centralized error management

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google OAuth credentials
- GitHub OAuth credentials

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd Server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Rename environment.env to .env
   cp environment.env .env
   ```

4. **Configure your .env file**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/smarttasker

   # JWT Configuration
   JWT_SECRET=sk-2024-smarttasker-jwt-secret-sourav-xyz123-abc456-def789-ghi012-jkl345-mno678-pqr901
   JWT_EXPIRE=7d

   # OAuth Configuration
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=Ov23libTFRuN2mLAj9Vk
   GITHUB_CLIENT_SECRET=a6a3d1c33df8ba9cad691aabef39b555f43972ab

   # Session Configuration
   SESSION_SECRET=ss-2024-smarttasker-session-secret-sourav-uvw234-xyz567-abc890-def123-ghi456-jkl789

   # Frontend URL
   CLIENT_URL=http://localhost:5137
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🔐 OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Set redirect URI: `http://localhost:5000/api/auth/google/callback`

### GitHub OAuth
1. Go to [GitHub OAuth Apps](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `http://localhost:5000/api/auth/github/callback`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/github` - GitHub OAuth login
- `POST /api/auth/refresh` - Refresh JWT token

### Tasks
- `GET /api/tasks` - Get all tasks (with filtering/pagination)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/overdue` - Get overdue tasks
- `GET /api/tasks/due-today` - Get tasks due today
- `GET /api/tasks/stats` - Get task statistics
- `POST /api/tasks/:id/share` - Share task with user
- `DELETE /api/tasks/:id/share/:userId` - Remove user from shared task
- `POST /api/tasks/:id/comments` - Add comment to task

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password
- `GET /api/users/search` - Search users
- `GET /api/users/shared-tasks` - Get shared tasks
- `GET /api/users/:id` - Get public user profile
- `DELETE /api/users/account` - Delete account

## 🔌 Socket.IO Events

### Client to Server
- `task:update` - Update task
- `task:create` - Create task
- `task:delete` - Delete task
- `task:share` - Share task
- `task:unshare` - Unshare task
- `task:comment` - Add comment
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `user:status` - Update user status
- `room:join` - Join room
- `room:leave` - Leave room

### Server to Client
- `task:created` - Task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `task:shared` - Task shared
- `task:unshared` - Task unshared
- `task:commented` - Comment added
- `user:connected` - User connected
- `user:disconnected` - User disconnected
- `user:status_changed` - User status changed
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

## 🗄️ Database Models

### User Model
- Basic info (name, email, password)
- OAuth IDs (Google, GitHub)
- Profile data (bio, avatar, preferences)
- Shared tasks with permissions
- Account status

### Task Model
- Task details (title, description, due date)
- Status and priority
- Ownership and sharing
- Comments and activity logs
- Categories and tags
- Recurring task support

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: API protection
- **Input Validation**: Comprehensive validation
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **Session Management**: Secure session handling

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 Monitoring

- **Health Check**: `GET /api/health`
- **Error Logging**: Comprehensive error tracking
- **Performance Monitoring**: Request timing and metrics

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smarttasker
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
CLIENT_URL=https://yourdomain.com
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**SmartTasker Backend** - Built with ❤️ using MERN stack

# SmartTasker Server

This is the backend server for the SmartTasker application. It is built with Node.js, Express, MongoDB, and supports real-time updates via Socket.IO.

## Features
- RESTful API for task, user, and authentication management
- Real-time task updates with Socket.IO
- JWT authentication and OAuth (Google, GitHub)
- CORS and security best practices
- Rate limiting and session management
- MongoDB with Mongoose

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB (local or Atlas)

### Installation
1. Clone the repository and navigate to the `Server` directory:
   ```sh
   cd Server
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Copy the example environment file and edit as needed:
   ```sh
   cp env.example .env
   # Edit .env with your MongoDB URI, session secret, OAuth keys, etc.
   ```

### Running the Server
```sh
npm start
```

The server will run on `http://localhost:5000` by default.

### API Endpoints
- `/api/auth` - Authentication (login, signup, OAuth)
- `/api/tasks` - Task CRUD operations (protected)
- `/api/users` - User profile and settings (protected)

### CORS
The server is configured to allow requests from the frontend (default: `http://localhost:5173`).

### Real-time
Socket.IO is enabled for real-time task updates. The server emits events for task creation, update, and deletion.

## Development
- Rate limiting is relaxed in development mode.
- Logging is enabled for easier debugging.

## License
MIT