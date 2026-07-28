# DeepGuardian Verification Platform

DeepGuardian is an advanced multimedia analysis and verification platform. It provides tools to detect deepfakes, AI-generated content, manipulated images, and misinformation across various formats. The project is split into a React (Next.js) frontend and a Python (Flask) backend that processes machine learning models.

## Project Structure

The project has been organized into distinct modules:

*   **backend/**: Contains the Flask application, API controllers, machine learning processors, and model weight files.
*   **frontend/**: Contains the Next.js application, user interface components, and API routing logic.
*   **data/**: Contains datasets or testing resources.
*   **ml-models/**: Contains external or shared machine learning resources.

## Prerequisites

Before running the application, ensure you have the following installed on your system:
*   Node.js (v18 or higher)
*   Bun (Optional, but recommended for frontend package management)
*   Python (3.9 or higher)
*   FFmpeg (Required for audio/video processing dependencies)

## Backend Setup

The backend is built with Flask and handles the heavy lifting of processing multimedia files through various machine learning models (CNNs, ViT, Zero-shot models, etc.).

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create and activate a Python virtual environment:
    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

3.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Start the Flask server:
    ```bash
    python app.py
    ```
    The backend will start on `http://localhost:5002`.

### API Endpoints

The backend exposes several routes for media processing:
*   `GET /api/health` - Health check endpoint.
*   `POST /api/video/` - Upload and analyze video files for deepfakes or lip-sync manipulation.
*   `POST /api/image/` - Upload and analyze images for AI generation or tampering.
*   `POST /api/audio/` - Upload and analyze audio files for voice cloning.
*   `POST /api/text/` - Verify text content for misinformation.

## Frontend Setup

The frontend is a modern web application built using Next.js, React, and TailwindCSS. It provides an intuitive interface for uploading files and viewing detailed verification metrics.

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install the Node.js dependencies using Bun or npm:
    ```bash
    bun install
    # or
    npm install
    ```

3.  Configure environment variables:
    Ensure there is a `.env.local` file in the `frontend/` directory pointing to the backend API:
    ```env
    NEXT_PUBLIC_API_URL=http://127.0.0.1:5002
    NEXT_PUBLIC_MISS_INFO_URL=http://127.0.0.1:5002/api/text/
    ```

4.  Start the development server:
    ```bash
    bun run dev
    # or
    npm run dev
    ```
    The frontend will be accessible at `http://localhost:3000`.

## Architecture Details

*   **Strict Typing**: The frontend utilizes strict TypeScript interfaces for all API responses, ensuring robust UI rendering without runtime errors.
*   **Modular Controllers**: The backend Flask application uses Blueprints to separate video, image, audio, and text processing into distinct, maintainable controllers.
*   **Guard Clauses**: All endpoints implement early-return guard clauses to validate incoming requests, preventing application crashes due to empty or invalid file uploads.
