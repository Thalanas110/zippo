# Codebase Documentation

## Overview

This document provides a detailed overview of the ZIPPO codebase, including the purpose, usage, and relationships of its components. The codebase is divided into two main parts: the frontend and the backend.

---

## Frontend

### Structure
The frontend is organized as follows:

- **`src/app`**: Contains the main application logic, including pages, components, and context.
  - **`pages`**: Implements the different views of the application, such as `Home`, `Recommendations`, and `Profile`.
  - **`components`**: Reusable UI elements, such as `AIBadge` and `ZippoLogo`.
  - **`context`**: Manages application-wide state, such as `GiftContext`.
- **`src/lib`**: Contains utility functions and API integrations.
- **`src/styles`**: Includes CSS files for styling.

### Key Files
- **`src/app/pages/Home.tsx`**: Implements the homepage, showcasing top picks and categories.
- **`src/app/pages/Recommendations.tsx`**: Displays personalized gift recommendations.
- **`src/lib/api.ts`**: Defines API interfaces and functions for backend communication.

### Notes
- The frontend uses hardcoded values for some dropdown filters and fallback data. These should be replaced with dynamic data from the backend.
- The `Home` page includes placeholders for catalog search results.

---

## Backend

### Structure
The backend follows an MVC-style architecture:

- **`zippo_api/models`**: Defines request/response schemas using Pydantic.
- **`zippo_api/controllers`**: Contains route handlers for the HTTP layer.
- **`zippo_api/services`**: Implements business logic and orchestrates operations.
- **`zippo_api/repositories`**: Handles data access, particularly for Supabase.
- **`zippo_api/core`**: Includes configuration and constants.
- **`old`**: Retains legacy algorithm modules, such as `gift_intelligence.py`.

### Key Files
- **`zippo_api/core/config.py`**: Manages environment variables and application settings.
- **`zippo_api/services/gift_service.py`**: Implements gift filtering logic using the `gift_intelligence` module.
- **`zippo_api/services/platform_service.py`**: Handles operations related to stores and products.

### Notes
- The `gift_service` integrates with legacy modules for intelligent filtering.
- The `platform_service` provides CRUD operations for stores and products.

---

## Relationships

### Frontend and Backend
The frontend communicates with the backend via REST APIs. The `api.ts` file in the frontend defines the interfaces for these interactions.

### Legacy Modules
The backend reuses legacy modules for algorithmic logic, ensuring continuity while allowing for modernization.

---

## Future Enhancements
- **Frontend**: Replace hardcoded values with dynamic data from the backend.
- **Backend**: Refactor legacy modules to align with the MVC architecture.

---

## Conclusion
This documentation provides a high-level overview of the ZIPPO codebase. For detailed information, refer to the inline comments and README files in the respective directories.