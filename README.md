```                                                                                                                                                                          
█                                                                                     ██                                                                                  
██                                                                                   ███                                                                                  
████                                 ██████████████                                 ████                                                                                  
█████                                ██████████████                               █████                                                                                   
███████                              ██████████████                             ███████                                                                                   
 ████████                        ███ ██████████████ ███                       ████████                 ██████████████               ███████                 ███████       
 ████████████                ███████ ██████████████ ██████                 ███████████              ███████████████████       █████████████           █████████████       
  ███████████████          █████████ ██████████████ █████████         ███████████████              ████████████████████      ██████████████          ██████████████       
   ████████████████████  ███████████ ██████████████ ██████████  ████████████████████              ████████        ███        ██████████████          ██████████████       
     █████████████████ █████████████ ██████████████ ████████████  ████████████████               ███████                     █████  ███████          █████  ███████       
      ██████████████  ██████████████ ██████████████ █████████████  ██████████████               ████████                            ███████                 ███████       
        ███████████  ███████████████ ██████████████ ██████████████  ███████████                 ███████   ██████████                ███████                 ███████       
           ███████  ████████████████ ██████████████ ███████████████  ████████                   ███████ ███████████████             ███████                 ███████       
              ████ █████████████████ ██████████████ ████████████████  ███                       ████████████████████████            ███████                 ███████       
                  ██████████████████ ██████████████ █████████████████                           ██████████      ████████            ███████                 ███████       
                  ██████████████████ ██████████████ █████████████████                           ████████         ████████           ███████                 ███████       
                  ██████████████████ ██████████████ ██████████████████                          ████████          ███████           ███████                 ███████       
                  ██████████████████ ██████████████ ██████████████████                          ████████          ███████           ███████                 ███████       
                  ██████████████████ ██████████████ ██████████████████                           ███████         ███████            ███████                 ███████       
                  ██████████████████ ██████████████ ██████████████████                            ██████████ ███████████    ██████████████████████  ██████████████████████
                                                                                                   ████████████████████     ██████████████████████  ██████████████████████
             ██████████████████████████████████████████████████████████████                          ████████████████       ██████████████████████  ██████████████████████
             ██████████████████████████████████████████████████████████████                             ██████████          ██████████████████████  ██████████████████████
             ██████████████████████████████████████████████████████████████                                                                                               
             ██████████████████████████████████████████████████████████████                                                                                               
             ██████████████████████████████████████████████████████████████                                                                                               
             ██████████████████████████████████████████████████████████████                                                                                               
             ██████████████████████████████████████████████████████████████       
```

# Saxon Scout

**Professional FRC Scouting System for Team 611 Saxon Robotics**

Saxon Scout is a comprehensive, enterprise-grade scouting platform for the FIRST Robotics Competition (FRC) 2025 REEFSCAPE season. Built with modern web technologies, it provides powerful tools for match scouting, pit scouting, alliance selection, match planning, and strategic analysis.

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/Saxon-Scout-Official.git
cd Saxon-Scout-Official

# 2. Install dependencies
npm install

# 3. Run interactive setup (creates .env file)
npm run setup

# 4. Build the application
npm run build

# 5. Start the server
npm start
```

Open `http://localhost:8787` in your browser!

## Key Features

### Core Scouting
- **Match Scouting**: Rapid data collection with intuitive interface
- **Pit Scouting**: Robot capability assessment with photo uploads
- **Data Analysis**: Interactive charts and performance visualizations
- **Export Tools**: CSV and ZIP export for data sharing

### Advanced Features
- **Alliance Selection**: AI-powered team recommendations with composite scoring
- **Match Planning**: Strategy builder with role assignment
- **Event Schedule**: Integration with The Blue Alliance API
- **Analytics Dashboard**: Scouter performance and accuracy metrics
- **AI Insights**: Google Gemini AI-powered strategic analysis

### Authentication & Admin
- **OAuth Integration**: Google Sign-In support
- **User Management**: Admin portal with role-based access
- **Session Management**: Secure JWT-based authentication
- **Admin Dashboard**: User administration and system monitoring

## Technology Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Chart.js for data visualization
- Bootstrap 5 for UI components
- Professional design system with light/dark mode

### Backend
- Node.js with Express
- PostgreSQL for data persistence
- Passport.js for authentication
- Google OAuth 2.0
- JWT for session management
- Multer for file uploads

### APIs & Integrations
- The Blue Alliance API
- FIRST API
- Google Gemini AI
- Google OAuth 2.0

Backend
- Express.js
- PostgreSQL
- TypeScript

Infrastructure
- Docker (for PostgreSQL)

## Quick start

1. Install dependencies

```powershell
npm install
```

2. Build the project (server and client)

```powershell
npm run build
```

3. Start the server

```powershell
npm start
```

Open http://localhost:8787 in your browser.

To preview only the built frontend:

```powershell
npm run serve-app
# then open http://localhost:8080
```

## Development commands

- Run the server in development mode (ts-node):

```powershell
npm run dev
```

- Rebuild the frontend only:

```powershell
npm run build:app
```

- Compile server TypeScript only:

```powershell
npm run build:server
```

## Database setup

Start PostgreSQL using Docker Compose:

```powershell
cd infra
docker-compose up -d
```

Apply the schema (example using psql):

```powershell
psql -h localhost -U frc -d scouting -f infra/schema.sql
```

For development without a database, a test-mode server is provided.

## Usage overview

- Click "Pick Data Folder" to select a local directory for JSON data storage.
- Use "Login" to enter a scouter name for logging.
- Navigate to Quick Scout, Pit Scout, Info Viewer, or Export from the home screen.

## Project structure

```
Saxon-Scout-Official/
├── app/                    # Frontend source
│   ├── src/
│   │   ├── assets/         # Static assets (gamepiece.png)
│   │   ├── lib/            # Utility libraries (fsStore, shim)
│   │   ├── views/          # UI components
│   │   └── main.tsx        # App entry
│   └── tsconfig.json
├── server/                 # Backend source
│   ├── src/server.ts
│   └── tsconfig.json
├── infra/                  # Infrastructure (docker-compose, schema)
├── scripts/                # Build scripts
└── dist/                   # Compiled output (build artifacts)
```

## Reliability and compatibility

- Designed for offline use with the File System Access API (Chromium-based browsers recommended)
- Local JSON files for durable storage
- Cross-platform: Windows, macOS, Linux

## Troubleshooting

- Ensure Node.js 16+ is installed
- If builds fail, remove `node_modules` and run `npm install` again
- For browser issues, verify File System Access API support and check the developer console

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Acknowledgements

Created by Team 611 Saxon Robotics  for the FRC 2026 season.
Email us at: [sthornton@saxonrobotics.org](mailto:sthornton@saxonrobotics.org)

