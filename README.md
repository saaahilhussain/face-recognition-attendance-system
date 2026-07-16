# Face Recognition Attendance System

An enterprise-grade face recognition attendance management system developed as an internship project for the **Information Systems Department, IOCL AOD**.

The system automates employee attendance using facial recognition, eliminating manual registers and reducing proxy attendance. Employees register once by capturing facial data, after which the system recognizes them in real time through a camera and automatically records punch-in and punch-out events.

The application follows a microservices architecture consisting of a React frontend, a Node.js backend responsible for business logic and data management, and a dedicated Python AI service that performs face detection and recognition. Communication between services is handled through REST APIs, while Socket.IO provides real-time updates to the administrator dashboard.

## Features

- Face-based employee registration
- Automatic punch-in and punch-out
- Real-time face recognition
- Employee management
- Attendance management
- Daily attendance logs
- Monthly attendance reports
- Live administrator dashboard
- Camera management
- Real-time updates using WebSockets
- Export reports to CSV, Excel, and PDF

## Tech Stack

### Frontend

- React (Vite)
- React Router
- Tailwind CSS
- shadcn/ui
- Socket.IO Client

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Socket.IO

### AI Service

- Python
- FastAPI
- OpenCV
- InsightFace (ArcFace)
- ONNX Runtime

## System Architecture

```text
                +--------------------+
                |   React Frontend   |
                +--------------------+
                          │
                  REST + WebSocket
                          │
                          ▼
               +----------------------+
               | Node.js + Express API|
               +----------------------+
                  │               │
                  │               │
                  ▼               ▼
        +----------------+   +------------------+
        |    MongoDB     |   | Python AI Service|
        +----------------+   +------------------+
                                      │
                                      ▼
                          Face Detection & Recognition
```

## Project Objectives

- Automate attendance using facial recognition.
- Provide a real-time administrative dashboard.
- Eliminate duplicate and proxy attendance.
- Learn microservice architecture using Node.js and Python.
- Gain hands-on experience with computer vision and WebSockets.
- Build a production-style portfolio project suitable for enterprise environments.

## Project Status

🚧 Under Development
