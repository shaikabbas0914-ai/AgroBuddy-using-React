# AgroBuddy - Smart Farming Assistant (Frontend)

AgroBuddy is a comprehensive, professional-grade React application designed to empower farmers with data-driven insights. It provides core functionalities like Crop Recommendation, Fertilizer Suggestion, and Disease Detection, wrapped in a modern, responsive, and intuitive user interface.

## 🚀 Features

- **Crop Recommendation**: Suggests the most suitable crops based on soil metrics (N, P, K), pH, and environmental factors like temperature, humidity, and rainfall.
- **Fertilizer Suggestion**: Recommends the optimal fertilizer for a specific crop and soil conditions.
- **Disease Detection**: Allows users to upload images of crop leaves to identify potential diseases and provides treatment suggestions.
- **Dashboard**: A central hub displaying key farming metrics, history, and quick access to modules.
- **Responsive Design**: Built to work seamlessly on desktop and mobile devices.

## 🛠️ Technology Stack

- **Framework**: React.js (built with Vite)
- **Styling**: Vanilla CSS with modern aesthetics (Glassmorphism, CSS Grid/Flexbox, Animations)
- **Routing**: React Router DOM
- **Icons**: React Icons (Lucide React / FontAwesome)
- **State Management**: React Context / Hooks

## 📁 Folder Structure Explained

The project follows a modular, feature-based architecture to ensure scalability and maintainability.

```text
frontend/
├── node_modules/          # Project dependencies
├── public/                # Static public assets (favicon, etc.)
├── src/                   # Main source code
│   ├── assets/            # Images, icons, and other static media
│   ├── components/        # Reusable UI components
│   │   ├── Button.jsx     # Custom styled button component
│   │   ├── Card.jsx       # Generic card container component
│   │   ├── InputField.jsx # Reusable form input field
│   │   ├── Layout.jsx     # Main application layout wrapper
│   │   ├── Navbar.jsx     # Top navigation bar
│   │   └── Sidebar.jsx    # Side navigation menu for routing
│   │
│   ├── pages/             # Main application views/routes
│   │   ├── Dashboard.jsx  # Landing dashboard with overview metrics
│   │   ├── Login.jsx      # User authentication page
│   │   ├── CropRecommendation.jsx  # Crop recommendation module
│   │   ├── FertilizerSuggestion.jsx# Fertilizer suggestion module
│   │   └── DiseasePrediction.jsx   # Image upload and disease detection
│   │
│   ├── services/          # API integrations and external services
│   │   └── api.js         # Axios/Fetch API configurations and calls
│   │
│   ├── styles/            # Global styling configurations
│   │   └── global.css     # CSS variables, resets, and global styles
│   │
│   ├── App.jsx            # Main App component & routing configuration
│   ├── App.css            # Component-specific styles for App
│   ├── main.jsx           # React application entry point
│   └── index.css          # Initial global styles imports
│
├── .gitignore             # Files and directories ignored by Git
├── eslint.config.js       # ESLint configuration for code quality
├── index.html             # Main HTML template
├── package.json           # Project metadata and dependency list
└── vite.config.js         # Vite bundler configuration
```

### Deep Dive into Core Folders

- **`src/components/`**: Contains highly reusable, isolated pieces of UI. Each component (like `Button` or `Sidebar`) usually has its own paired `.css` file to encapsulate styling and prevent CSS bleeding.
- **`src/pages/`**: Represents the main views of the application that are tied to specific routes. They assemble various `components` to build complex interfaces like the `Dashboard` or `CropRecommendation` screen.
- **`src/services/`**: Centralizes all asynchronous operations, mainly API calls to the backend. This separation of concerns ensures that components focus purely on rendering UI rather than data fetching logic.
- **`src/styles/`**: Holds application-wide CSS, such as color palettes (CSS variables), typography, and common utility classes.

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   ```

2. **Navigate to the frontend directory:**
   ```bash
   cd agrobuddy-uning React/frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. Open your browser and visit `http://localhost:5173` (or the port specified by Vite).

## 🎨 Design Philosophy

The UI is built with a focus on **Rich Aesthetics**, utilizing curated color palettes inspired by nature (greens, earthy tones), smooth micro-animations for interactivity, and responsive layouts that look great on any device.
