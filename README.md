<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/icons/Logo+611+White+Name.webp">
  <source media="(prefers-color-scheme: light)" srcset="/icons/Logo+611+Black+Name.webp">
  <img alt="Banner" src="/icons/Logo+611+Black+Name.webp">
</picture>

# Saxon Scout
![FRC Season](https://img.shields.io/badge/FRC-2026_REBUILT-yellow?style=for-the-badge)
![Team](https://img.shields.io/badge/Team-611_Saxon_Robotics-yellow?style=for-the-badge)
![Team](https://img.shields.io/badge/Team-526_Saxon_Sparks-black?style=for-the-badge)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

**Saxon Scout** is the official scouting application developed by **FRC Team 611 (Saxon Robotics)** for the 2026 FIRST Robotics Competition season, **REBUILT℠**.

This tool is designed to collect, analyze, and visualize data on other robots during competitions, enabling our strategy team to make informed decisions for match play and alliance selection.

## Key Features

### Match Scouting
*   **Autonomous Phase**: Record starting position, "Coral" scoring (L1-L4), and "Algae" processing/net scoring.
*   **Teleop Phase**: Track cycle times, amplifier usage, and defense ratings.
*   **Endgame**: Log barge climbing status (Park, Shallow, Deep) and trap interactions.
*   **Failures**: Quick-toggle to report robot disconnects or mechanical breakdowns.

### Pit Scouting
*   Capture robot specifications (Drivetrain type, dimensions, weight).
*   Upload photos of robots for visual reference.
*   Log claimed capabilities vs. actual performance.

### Data & Analysis
*   **Data Viewer**: View all data on the games.
*   **Team Summaries**: View average scores and consistency ratings for any team at the event.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

*   Nodejs
*   VS Code or Android Studio
*   Git

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ssnnd0/saxon-scout.git
    cd saxon-scout
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the App**
    Connect a physical device or start an emulator, then run:
    ```bash
    npm run dev
    ```

## Screenshots

| Match Scouting | Pit Scouting | Data Viewer |
|:-----------:|:---------:|:-------------:|
| *(Add Screenshot)* | *(Add Screenshot)* | *(Add Screenshot)* |


## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

**Project Maintainer**: [ssnnd0](https://github.com/ssnnd0)
**Email**: [sthornton@saxonrobotics.org](mailto:sthornton@saxonrobotics.org)
**Team Website**: [saxonrobotics.org](https://www.saxonrobotics.org/)
