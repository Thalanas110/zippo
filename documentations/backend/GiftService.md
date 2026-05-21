# Gift Service

## Overview
The `gift_service.py` file implements the business logic for gift filtering. It uses the `gift_intelligence` module to provide intelligent filtering of products based on user preferences.

## Key Features
- Filters products based on occasion, recipient type, and budget range.
- Uses the `gift_intelligence` module for ranking products.
- Persists filtering results in the database.

## Structure
- **Filter Method**: Implements the filtering logic.
- **Persistence**: Saves filtering results and metadata in the database.

## Notes
- The `gift_intelligence` module is a legacy module and should be refactored in the future.
- The filter method uses hardcoded budget bands, which should be configurable.