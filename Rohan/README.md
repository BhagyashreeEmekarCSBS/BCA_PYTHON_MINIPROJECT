# StoreRate — Modern Store Rating & Governance Platform

A full-stack, enterprise-grade store rating and administrative governance platform built with **React 19**, **Express 5**, **Sequelize 6**, and **MySQL**.

---

## 🌟 Key Features

### 1. 🛡️ Role-Based Access Control (RBAC)
- **System Administrator**: Full platform governance, user management (create, search, filter, sort), store registry oversight, and executive analytics.
- **Store Owner**: Store dashboard displaying registered store information, average rating, total ratings, and customer rating breakdown.
- **Normal User / Shopper**: Browse stores, search by name or address, submit ratings (1–5 stars), and update previously submitted ratings.

### 2. 📊 Executive Admin Dashboard
- **Off-White Design Palette**: Built with a clean executive aesthetic (`#F8F9FA` background, `#FFFFFF` cards, `#E2E8F0` borders) plus a one-click dark mode toggle.
- **KPI Metrics Cards**: Total Users (Shoppers/Owners/Admins split), Total Stores (Rated vs. Unrated), Total Ratings (Overall Platform Average), and Review Coverage Rate with smooth count-up animations.
- **PowerPoint-Style Architecture & Process Flow Diagram**: Visual 4-stage pipeline (Discovery ➔ Submission ➔ Intelligence ➔ Governance).
- **Interactive Visualizations**:
  - **Store Rating Distribution Bar Chart**: Proportional breakdown (5★ Emerald, 4★ Teal, 3★ Indigo, 2★ Amber, 1★ Rose, Unrated).
  - **User Ecosystem Segmented Bar**: Visual share of Shoppers, Store Owners, and Admins.
  - **Top-Rated Stores Leaderboard**: Visual podium cards (#1, #2, #3) with average scores and rating progress indicators.
  - **Quick Action Hub**: Direct shortcuts to User Registry, Store Registry, and Security settings.

### 3. ⭐ Star Rating & Review Engine
- Interactive 5-star rating selector with hover preview and score labels.
- Live submission with instant recalculation of store average ratings.
- Automatic detection of prior ratings allowing users to seamlessly edit their rating.

### 4. 🔒 Strict Security & Validation
- **Name Constraints**: Exact range between 5 and 20 characters with live character counter UI.
- **Password Constraints**: 8 to 16 characters, requiring at least one uppercase letter and one special character (`!@#$%^&*`).
- **Email Validation**: RFC-compliant email formatting and uniqueness checks.
- **Address Constraints**: Maximum 400 characters.
- **Authentication**: JWT token authorization in `Bearer <token>` headers, bcrypt password hashing.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router DOM, Axios, Lucide Icons, Pure CSS Design System |
| **Backend** | Node.js, Express 5, Sequelize 6 ORM |
| **Database** | MySQL 8.0 |
| **Proxy & Gateway** | Nginx Alpine (Reverse Proxy & Static Web Server) |
| **Containerization** | Docker, Docker Compose, Multi-stage builds |
| **Auth & Security** | JSON Web Tokens (JWT), bcryptjs, express-validator |

---

## 🐳 Docker Production Setup (Recommended)

The entire application stack (MySQL database, Express backend API, and Nginx-powered React SPA) is fully containerized with automated health checks, persistent data volumes, and internal Docker networking.

### Architecture Overview
- **`storerate-frontend`**: Nginx Alpine container serving the production React 19 bundle and reverse-proxying `/api` requests to `http://backend:5000`.
- **`storerate-backend`**: Node 18 Alpine container running Express 5, listening internally on port 5000 and connecting to MySQL via Docker DNS `mysql:3306`.
- **`storerate-mysql`**: MySQL 8.0 container isolated from host ports, backed by a persistent named volume `mysql_data`.
- **`storerate-network`**: Dedicated Docker bridge network for secure inter-service communication.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Default ports and credentials:
```env
FRONTEND_PORT=80
BACKEND_PORT=5001
DB_HOST=mysql
DB_PORT=3306
DB_NAME=storerate_db
DB_USER=storerate_user
DB_PASSWORD=storerate_password
MYSQL_ROOT_PASSWORD=root_password
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRES_IN=24h
```

### 2. Build and Start the Stack
From the project root (`R:\Project 1`), run:
```bash
docker compose up -d --build
```

### 3. Verify Container Status
Check that all three containers are healthy:
```bash
docker compose ps
```
Expected output:
```text
NAME                 IMAGE               STATUS                    PORTS
storerate-backend    project1-backend    Up (healthy)              0.0.0.0:5001->5000/tcp
storerate-frontend   project1-frontend   Up (healthy)              0.0.0.0:80->80/tcp
storerate-mysql      mysql:8.0           Up (healthy)              3306/tcp
```

### 4. Access URLs
- **Frontend Web App**: [http://localhost](http://localhost) (Port 80)
- **Login Page**: [http://localhost/login](http://localhost/login)
- **API (Proxied through Nginx)**: [http://localhost/api/health](http://localhost/api/health)
- **Backend Direct Access**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

### 5. Managing the Compose Stack
- **View Live Logs**:
  ```bash
  docker compose logs -f
  # Or inspect a specific service:
  docker compose logs -f backend
  ```
- **Stop Containers** (Preserves MySQL database data volume):
  ```bash
  docker compose down
  ```
- **Restart Stack**:
  ```bash
  docker compose restart
  ```

### 6. Troubleshooting Port Conflicts
If port `80` or `5001` is already in use on your host machine:
1. Open the root `.env` file.
2. Change the host port mapping (e.g., `FRONTEND_PORT=8080`, `BACKEND_PORT=5002`).
3. Re-run `docker compose up -d`.

---

## ☁️ Cloud Server Deployment Guide (AWS, DigitalOcean, Linode, GCP)

Deploying StoreRate to a Linux cloud instance (Ubuntu/Debian) with Docker Compose:

### 1. Provision Cloud Server & Firewall
Ensure your VPS security group or firewall (`ufw`) allows ports:
- **SSH**: Port `22`
- **HTTP**: Port `80`
- **HTTPS**: Port `443`

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Install Docker & Compose on the Server
```bash
# Update packages and install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# Log out and log back in for group changes to take effect
```

### 3. Clone Repository & Configure Environment
```bash
git clone https://github.com/RohanRathodOnline/StoreRate.git
cd StoreRate

# Create production environment file from template
cp .env.example .env
```

### 4. Generate Production Secrets
Generate a cryptographically secure 64-character hex string for `JWT_SECRET`:
```bash
openssl rand -hex 32
```
Edit `.env` using `nano .env` and update:
- `JWT_SECRET`: Your generated hex key
- `DB_PASSWORD`: Strong unique database password
- `MYSQL_ROOT_PASSWORD`: Strong unique root password
- `CORS_ORIGIN`: Your public domain (e.g. `https://yourdomain.com`)
- `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Your custom administrator credentials

### 5. Launch Application
```bash
docker compose up -d --build
```
Verify all containers report `healthy`:
```bash
docker compose ps
```

### 6. SSL / HTTPS Termination (Recommended)
To secure the public endpoint with free SSL certificates from Let's Encrypt:
- **Option A (Cloudflare):** Point your domain DNS to the server IP and set Cloudflare SSL/TLS to "Full".
- **Option B (Certbot Reverse Proxy):** Install Certbot on the host or place Nginx Proxy Manager / Traefik in front of port 80.

---

## 💻 Local Development Setup (Without Docker)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MySQL](https://www.mysql.com/) or [XAMPP](https://www.apachefriends.org/) running locally on port 3306/3307

### Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   npm install
   ```
2. Configure `backend/.env`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3307
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=store_rating_app
   JWT_SECRET=your_jwt_secret_key_here
   ```
3. Start the server:
   ```bash
   node server.js
   ```

### Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

The backend includes a comprehensive 38-scenario automated test suite verifying all business rules, role authorizations, validation constraints, and database transactions:

### Run Tests Against Docker Stack:
```powershell
cd backend
$env:API_BASE="http://localhost/api"
node test_all_38_scenarios.js
```

### Run Tests Against Local Dev Server:
```powershell
cd backend
node test_all_38_scenarios.js
```

All 38 test suites pass with 100% coverage across authentication, admin privileges, rating workflows, and user constraints.

---

## 👥 Default Roles & Test Credentials

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@storerating.com` | `Admin@123` |
| **Normal User** | `shopper@storerate.com` | `Shopper@123` |
| **Store Owner** | `owner@storerate.com` | `Owner@123` |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

# StoreRate — Store Rating Platform

StoreRate is a full-stack web application that allows users to browse registered stores and submit ratings from **1 to 5**.

The application uses a **single login system with role-based access control (RBAC)** for three user roles:

- System Administrator
- Normal User
- Store Owner

---

## Features

### System Administrator

The System Administrator can:

- Log in to the platform
- View dashboard statistics:
  - Total number of users
  - Total number of stores
  - Total number of submitted ratings
- Add new stores
- Add new normal users
- Add new admin users
- View all registered stores
- View normal users and administrators
- Search and filter users and stores
- View user details
- View a Store Owner's store rating
- Sort supported table fields
- Log out

### Normal User

Normal users can:

- Sign up
- Log in
- Update their password
- View all registered stores
- Search stores by name and address
- View:
  - Store Name
  - Address
  - Overall Rating
  - User's Submitted Rating
- Submit a rating from 1 to 5
- Modify their submitted rating
- Log out

### Store Owner

Store Owners can:

- Log in
- Update their password
- View their store's average rating
- View users who submitted ratings for their store
- Log out

---

## User Roles

| Role | Functionality |
|---|---|
| System Administrator | Manage users, stores and platform data |
| Normal User | Browse stores and submit/modify ratings |
| Store Owner | View store ratings and users who rated |

---

## Application Architecture

```text
React 19 Frontend
       |
       | Axios + REST API
       | JWT Bearer Token
       v
Express 5 Backend
       |
       +-- Authentication
       |
       +-- Validation
       |
       +-- Role-Based Authorization
       |
       +-- Controllers
       |
       v
Sequelize ORM
       |
       v
MySQL / MariaDB
