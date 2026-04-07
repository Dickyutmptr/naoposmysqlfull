# Nao POS - Next.js Fullstack Migration

This is a Fullstack Next.js migration of the Nao POS system.

## Prerequisites

- **Node.js** (v18 or later) is required to run this application.
- You can download it from [nodejs.org](https://nodejs.org/).

## Setup Instructions

1.  **Install Dependencies**
    Open a terminal in this folder and run:
    ```bash
    npm install
    ```

2.  **Setup Database (Prisma)**
    Initialize the SQLite database:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

3.  **Run the Application**
    Start the development server:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

## Features
- **POS**: Point of Sale transaction interface.
- **Inventory**: Manage raw material stocks.
- **Dashboard**: Sales statistics (Mock Data).
- **History**: View transaction history (Mock Data).
- **Kitchen/Bar**: Order monitor.

## Notes
- Since Node.js was not detected in the environment during setup, some initialization steps were performed manually.
- The project is configured to use a local SQLite database (`dev.db`).
