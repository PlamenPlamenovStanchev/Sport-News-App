# The Sport News App – AI Agent Instructions

## Project Overview

This project is a fully functional multi-page JavaScript web application called:

> **The Sport News App**

The app provides sport news articles with role-based access control and content moderation workflow.

Users can:
- Browse approved news (anonymous and authenticated users)
- Register / Login
- Comment, Like and Add to Favorites (authenticated users)
- Manage content depending on their role (Admin, Author, Editor)

The application uses a client-server architecture:
- Frontend: HTML, CSS, Bootstrap, Vanilla JavaScript (modular, Vite-based)
- Backend: Supabase (Database, Auth, Storage, RLS)

The project must remain simple, clean, and modular. No React, Vue, or TypeScript.

---

# Architecture Guidelines

## Frontend

- Multi-page application (NOT SPA)
- Each page must be in a separate HTML file
- JavaScript must be modular (ES Modules)
- Separate concerns:
  - `pages/` → page-specific logic
  - `services/` → Supabase communication
  - `utils/` → helpers and reusable logic
  - `styles/` → CSS files
- Avoid large monolithic files
- Keep functions small and focused

Use Bootstrap for layout and responsiveness.

---

# Backend (Supabase)

The application uses:

- Supabase Auth (authentication)
- Supabase PostgreSQL (database)
- Supabase Storage (image uploads)
- Row-Level Security (RLS)
- Migrations for schema changes

Never assume unrestricted access — always consider RLS.

---

# Database Schema (Conceptual)

## profiles
- id (uuid, references auth.users)
- username (text)
- role (text: admin, author, editor, user)
- created_at (timestamp)

## news
- id (uuid)
- title (text)
- content (text)
- image_url (text)
- sport_tag (text)
- author_id (uuid)
- status (text: pending, approved, rejected)
- created_at (timestamp)

## comments
- id (uuid)
- news_id (uuid)
- user_id (uuid)
- content (text)
- created_at (timestamp)

## likes
- id (uuid)
- news_id (uuid)
- user_id (uuid)
- UNIQUE(user_id, news_id)

## favorites
- id (uuid)
- news_id (uuid)
- user_id (uuid)

---

# Role System

## Admin
- Full access
- Manage users
- Assign roles (author/editor)
- Edit/Delete news
- Approve news

## Author
- Create news
- News status must default to `pending`
- Cannot approve their own news

## Editor
- View pending news
- Approve, edit, delete news

## Regular User
- Comment
- Like
- Add to favorites

---
# Database Migrations Strategy

All database schema changes must be tracked in SQL migration files.

Migration files must be stored in:

/supabase/migrations/

Rules:

1. Every schema change must be written as a new SQL migration file.
2. Migration files must never be modified after being committed.
3. If a schema change is needed, create a new migration file.
4. Migration files must be committed to GitHub.
5. Database evolution must be traceable through Git history.
6. Do not manually modify schema in Supabase dashboard without creating a migration file.

Example naming convention:

20250223_initial_schema.sql
20250223_enable_rls.sql
20250224_add_news_indexes.sql

Migration files must contain:
- Table creation
- Index creation
- RLS enabling
- Policies
- Triggers
- Functions

# Business Logic Rules

1. Only `approved` news are visible on Home page.
2. News created by authors must have `status = 'pending'`.
3. News becomes public only after editor approval.
4. Only authenticated users can comment, like, or favorite.
5. Users can delete only their own comments.
6. Each user can like a news article only once.

---

# UI Requirements

Minimum pages:
- Home
- Login
- Register
- News Details
- Profile
- Admin Panel
- Create News
- Edit News
- About
- Contact

Home page must include:
- News cards (image + title)
- Pagination
- Search by title
- Filter by sport tag (tabs or buttons)

---

# Supabase Usage Rules

- Use Supabase JS client
- Never hardcode admin logic in frontend only
- Rely on RLS for real security
- Always handle async/await properly
- Always check for errors from Supabase responses

Example pattern:

```javascript
const { data, error } = await supabase
  .from("news")
  .select("*");

if (error) {
  console.error(error.message);
}