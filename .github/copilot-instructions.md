# Copilot Instructions for AI Agents

## Project Overview
- This project is a web/mobile app for delivering AI-generated advice in a fortune cookie style.
- The user journey consists of: intro, login/signup, main page, persona (role) selection, concern input, AI response (with animation), and viewing/deleting past concerns.
- Frontend: React
- Backend: Node.js
- Database: (details TBD, but at least two tables: user info, AI answers)

## Architecture & Data Flow
- User authentication and registration are required; user data and AI answers are stored in the DB.
- Users select a persona (role) for the day, which is saved and can be reused.
- Users input a concern, which is sent to the AI backend for a response.
- The AI response, along with the persona and concern, is saved and displayed with an animation (fortune cookie style).
- Users can view and delete their past concerns and AI answers.

## Key Patterns & Conventions
- Follow clear separation between frontend (React) and backend (Node.js) code.
- Use RESTful API endpoints for communication between frontend and backend.
- Store user sessions securely; do not expose sensitive data to the frontend.
- Database must have at least two tables: `users` (회원 정보), `ai_answers` (AI답변, 역할, 고민 등 포함).
- When implementing new features, reference the user journey steps (P-1 to P-7) for consistency.

## Developer Workflows
- Use standard React and Node.js build/test commands unless otherwise documented.
- If custom scripts or commands are added, document them in the root README.md.
- Ensure DB migrations/scripts are versioned and reproducible.

## Integration Points
- All AI interactions should be routed through a dedicated backend service endpoint.
- Animation logic for the fortune cookie reveal should be modular and reusable.

## Examples
- For a new concern input, POST to `/api/concerns` with `{ userId, persona, concern }`.
- To fetch past concerns, GET `/api/concerns?userId=...`.

## References
- See `instruction.md` for a summary of the user journey and feature breakdown.
- Update this file as the architecture or conventions evolve.
