# WPBot AI Assistant Project Summary

This project, `wpbot`, is a full-stack **AI Assistant monorepo** built with `bun` workspaces. At its core, it provides an LLM-powered assistant with tools linked to a backend PostgreSQL database, and it features multiple frontends to interact with that assistant.

## Packages Breakdown

1. **`@wpbot/api` (Core Backend):** An API server powered by an LLM (using DeepSeek) and the Model Context Protocol (MCP). It handles core logic, manages a PostgreSQL database, handles CRUD operations for data like "items," and features an `/assistant` endpoint that generates intelligent responses based on prompts.
2. **`@wpbot/web` (Dashboard):** A React-based web dashboard that provides a graphical interface, likely to visualize and manage the data (like "items") stored in the database.
3. **`@wpbot/whatsapp` (WhatsApp Bot):** A Meta Cloud API webhook integration that allows users to interact with the AI assistant directly via WhatsApp. It forwards messages to the core API and relays the responses back to the user.
4. **`@wpbot/telegram` (Telegram Bot):** A Telegram integration (using Telegraf) that provides the same conversational AI capability through Telegram's interface.
5. **`@wpbot/shared`**: Contains common types, utilities, or configuration utilized across the different standalone packages.

## Summary

It is a complete ecosystem for an AI assistant that you can talk to via messaging apps (Telegram, WhatsApp). Its brain is a central Node/Bun backend that can take actions (like modifying database records), and it includes a web administration panel to manually view or edit the underlying data.
