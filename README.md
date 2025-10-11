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

# Saxon Scout (Official)

Saxon Scout is a modern scouting system for the FIRST Robotics Competition (FRC) 2025 REEFSCAPE season. The project provides tools for collecting, analyzing, and exporting match and pit scouting data. It is intended for teams that require a lightweight, local-first web application for competition use.

## Key Features
- Quick match scouting with an intuitive 3x3 grid interface
- Detailed pit scouting for robot capabilities
- Data visualization and analytics using charts
- Export to CSV and ZIP formats
- Local storage via the File System Access API
- Browser-based UI; no installation required

## Technology Stack

Frontend
- Inferno.js
- Bootstrap 5
- TypeScript
- esbuild

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

## Features (game-specific)

### Coral scoring
- Track coral placements across levels L1–L4
- Separate recording for autonomous and teleoperated phases

### Algae management
- Track algae scoring into processor and net targets
- Estimate cycle times

### Endgame
- Record climb/park states and fouls

## Reliability and compatibility

- Designed for offline use with the File System Access API (Chromium-based browsers recommended)
- Local JSON files for durable storage
- Cross-platform: Windows, macOS, Linux

## Troubleshooting

- Ensure Node.js 16+ is installed
- If builds fail, remove `node_modules` and run `npm install` again
- For browser issues, verify File System Access API support and check the developer console

## Contributing

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/your-feature`)
3. Commit and push your changes
4. Open a pull request for review

Follow TypeScript and component design best practices. Include tests and documentation for non-trivial features.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Acknowledgements

Created by Team 611 Saxon Robotics for the FRC 2026 season.

