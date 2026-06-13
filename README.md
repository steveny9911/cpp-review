# C++ Low-Level Design Study Plan

An interactive study guide for C++ LLD (Low-Level Design) interviews with a comprehensive curriculum, trivia questions, design patterns, and practice problems.

## Features

- **4-Week Study Plan**: Structured weekly curriculum with daily goals
- **15+ Core Topics**: RAII, virtual dispatch, design patterns, concurrency, and more
- **90+ Trivia Questions**: Organized by category (UB, object lifecycle, move semantics, etc.)
- **Design Patterns**: Creational, structural, and behavioral patterns with C++ examples
- **6 LLD Practice Problems**: Parking lot, elevator, chess, vending machine, library, ATM
- **Review Questions**: Topic-specific questions with detailed answers
- **Progress Tracking**: Persistent progress tracking with local storage

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will open automatically at http://localhost:3000

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
cpp-review/
├── src/
│   ├── StudyPlan.jsx     # Main React component with all content
│   └── main.jsx          # React entry point
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies
└── README.md            # This file
```

## Usage

1. **Overview Tab**: See your overall progress and the 4-week study plan
2. **Topics Tab**: Learn the 15 core C++ concepts with code examples (filter by priority)
3. **Patterns Tab**: Study design patterns with implementation examples
4. **Practice Tab**: Review the 6 LLD problems with guidance
5. **Trivia Tab**: Practice C++ gotcha questions (filter by category)
6. **Resources Tab**: Find high-quality learning resources

## Keyboard Shortcuts & Interactions

- Click items to expand/collapse details
- Use checkboxes to mark items as complete
- Progress is saved automatically to browser storage
- Click "reset" to clear all progress

## Technologies

- **React 18**: Component library
- **Vite**: Build tool and dev server
- **ES6+**: Modern JavaScript

## Notes

- All progress is saved locally in your browser
- No data is sent to any server
- The app works offline once loaded

## License

MIT
