# PulseNet 🌐

**PulseNet** is a **distributed, full-stack web application** built for community building and social networking. Designed as a **modern hybrid** that marries the structured discussion boards of **Reddit** with the community-centric spaces of **Discord**, PulseNet provides a **scalable environment** for real-time interactions, content sharing, and **distributed micro-communities**.

---

<p align="center">
  <img src="picture.png" alt="PulseNet Banner" width="100%">
</p>

---

## ❓ What is PulseNet & What is it Used For?

PulseNet serves as a decentralized hub where users can connect based on shared interests rather than just personal friendships. The platform's social framework is engineered around **topic-driven hubs called Communities**. 

Whether it is a public forum for discussing software development or a private, invitation-only space for a specific group, PulseNet offers a robust environment for structured, meaningful digital interactions. 

### Core Platform Dynamics & User Flow:
- **Discover & Connect:** Guests can browse public communities, while registered users unlock all communities and profiles of other users.
- **The Community Ecosystem:** Users can create public or private communities, manage member permissions, and handle joining requests.
- **Content & Tagging:** Support for Markdown posts with rich media. Posts use global, admin-curated tags for instant sorting and filtering.
- **Threaded Conversations:** Organized hierarchical comments up to 2 levels deep with a soft-delete system to preserve reply context.
- **Personalized Feed:** A time-sorted custom feed merging updates from a user's joined communities and followed creators.
- **Governance:** Moderation tools for community creators to flag/delete content, backed by an overarching Admin Panel and full audit logs.

## 🚀 Tech Stack

### Frontend
- **Framework:** React + TypeScript
- **State & Auth Management:** React Context API (`useAuth`), Custom Hooks

### Backend
- **Runtime & Framework:** Node.js + Express
- **Database Driver:** `mysql2` (Connection Pooling)
- **Authentication & Security:** JSON Web Tokens (JWT) & `bcrypt` for secure password hashing
- **File Handling:** `multer` (processing profile pictures and avatars)

### Distributed Database Layer
- **MySQL Master Node:** Handles all write operations (`INSERT`, `UPDATE`, `DELETE`) and serves as a fallback for read operations.
- **MySQL Slave Nodes (2 Instances):** Asynchronously replicated nodes dedicated to handling load-balanced read operations (`SELECT`).

---

## 🏗️ System Architecture & Data Flow

```text
       [ CLIENT LAYER ]
        React + TypeScript
               │
               ▼ HTTPS / REST API (JWT)
       [ SERVER LAYER ]
        Node.js + Express API
        Middleware (Auth, RBAC)
               │
               ▼
       [ DB ROUTER / LOAD BALANCER (db.ts) ]
        Writes ──▶ MySQL Master (Read/Write)
                    │
                    ├─── REPL ──▶ MySQL Slave 1 (Read Only)
                    └─── REPL ──▶ MySQL Slave 2 (Read Only)
