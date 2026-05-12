# System Documentation

## Overview

This document provides a comprehensive overview of the ZIPPO system, including its architecture, components, and the rationale behind the selected design choices. The system is divided into two main parts: the frontend and the backend.

---

## Frontend

### Description
The frontend is a modern web application built using TypeScript and React. It leverages Vite for fast builds and Tailwind CSS for styling. The application is structured to provide a seamless user experience for e-commerce operations.

### Key Features
- **Component-Based Architecture**: The frontend is modular, with reusable components for UI elements.
- **Context API**: Used for state management, particularly for managing gift-related data.
- **Routing**: React Router is used for navigation between pages.

### Setup Instructions
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Architecture Rationale
The frontend uses a component-based architecture to ensure scalability and maintainability. Vite was chosen for its fast build times, and Tailwind CSS was selected for its utility-first approach to styling, which accelerates development.

---

## Backend

### Description
The backend is a FastAPI application designed with a clean MVC-style architecture. It integrates with Supabase for database operations and retains algorithmic logic in dedicated modules.

### Key Features
- **MVC Architecture**: Ensures separation of concerns.
- **Supabase Integration**: Simplifies database management and authentication.
- **Algorithm Modules**: Reuses existing logic for gift intelligence, recommendations, and delivery optimization.

### Setup Instructions
1. Navigate to the `backend` directory.
2. Create and activate the Conda environment:
   ```powershell
   conda env create -f environment.yml
   conda activate zippo-backend
   ```
3. Configure environment variables:
   - PowerShell:
     ```powershell
     $env:SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
     $env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
     $env:SUPABASE_PUBLISHABLE_KEY="YOUR_PUBLISHABLE_KEY"
     ```
   - Bash:
     ```bash
     export SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
     export SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
     export SUPABASE_PUBLISHABLE_KEY="YOUR_PUBLISHABLE_KEY"
     ```
4. Run the API:
   ```bash
   uvicorn app:app --reload
   ```

### Architecture Rationale
The backend employs an MVC architecture to promote code organization and maintainability. FastAPI was chosen for its performance and ease of use. Supabase was selected for its robust database and authentication features.

---

## Selected Architecture Styles

### Frontend: Component-Based Architecture
This style was chosen to ensure that the application is modular and scalable. Each UI element is encapsulated in a component, making it reusable and easier to maintain.

### Backend: Model-View-Controller (MVC)
The MVC architecture was selected to separate concerns, making the application easier to understand, test, and maintain. This structure also facilitates collaboration among developers.

---

## Future Enhancements
- **Frontend**: Implement server-side rendering (SSR) for better SEO and performance.
- **Backend**: Introduce caching mechanisms to improve API response times.

---

## Conclusion
The ZIPPO system is designed with modern development practices to ensure scalability, maintainability, and performance. The selected architecture styles and tools were chosen to meet the specific needs of the application while allowing for future growth.