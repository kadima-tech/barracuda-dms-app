# Barracuda-DMS

BarracudaDMS is a Device Management System that allows users to monitor, manage, and control connected devices through a web interface.

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database

### Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Media-Service-Group/Barracuda-DMS
   cd barracuda-dms
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../web
   npm install
   ```

3. Configure environment variables:
   ```bash
   # In backend directory
   cp .env.example .env
   # Edit .env with your database credentials and other configurations
   ```

4. Start the application:
   ```bash
   # Start backend (from backend directory)
   npm run dev

   # Start frontend (from web directory)
   npm run dev
   ```

The application should now be running at `http://localhost:5173`

## Features

- Real-time device monitoring
- Device status tracking
- Search and filter devices
- Device configuration management
- User authentication and authorization
- Responsive web interface

## Architecture

Barracuda-DMS consists of:
- Frontend: React + TypeScript application
- Backend: Node.js with Express
- Database: PostgreSQL
- WebSocket connection for real-time updates

## Development

### Project Structure

barracuda-dms/
├── backend/ # Node.js backend
├── web/ # React frontend
├── shared/ # Shared types and utilities
└── docs/ # Documentation

### Available Scripts

Backend:
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run test`: Run tests

Frontend:
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run test`: Run tests
