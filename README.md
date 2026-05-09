# Medi Routines

## Dev Architecture

```
┌─ Local Machine ───────────────────────────────────────────────┐
│                                                               │
│  ┌─ Browser ────────┐                                         │
│  │                  │                                         │
│  │  :X              │                                         │
│  └──┬────────┬──────┘                                         │
│     │        │                                                │
│     │ :8000  │ :5173                                          │
│     │ port   │ port                                           │
│     │ binding│ binding                                        │
│     │        |─────────                                       |
│  ┌────────────────────|──────Docker────────────────────────┐  │
│  │  |                 │                                    │  │
│  │  ▼───────────┐  ┌──▼───────────┐  ┌─────────────────┐   |  │
│  │  │           │  │              │  │                 │   │  │
│  │  │ Backend   │  │  Frontend    │  │  Database       │   │  │
│  │  │ :8000     │  │  :5173       │  │  :27017         │   │  │
│  │  │           │  │              │  │                 │   │  │
│  │  └─┬───┬─────┘  └──────────────┘  └─────────────────┘   │  │
│  │    |   │                                    ▲           │  │
│  │    |   └────────────────────────────────────┘           │  │
│  │    ▼                                                    │  │
|  |   ┌─────────────┐                                       |  |
|  |   | Mailpit     |                                       |  |
|  |   | SMTP        |                                       |  |
|  |   | Test Server |                                       |  |
|  |   | :1025       |                                       |  |
|  |   └─────────────┘                                       |  |
|  |                                                         |  |
|  |                                                         |  |
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Prod Architecture

```
                         ┌─ Cloud VM ─────────────────────────────────────────────┐
                         │                                                        │
                         │  ┌─ Docker ─────────────────────────────────────────┐  │
                         │  │                                                  │  │
  Internet  ──:80 port───┼──▶  Nginx :80                                       │  │
               binding   │  │     │                                            │  │
                         │  │     ├── /api ──▶   ┌───────────┐                 │  │
                         │  │     │              │  Backend  │                 │  │
                         │  │     │              │  :8000    ├──▶ ┌──────────┐ │  │
                         │  │     │              └───────────┘    │ Database │ │  │
                         │  │     │                               │ :27017   │ │  │
                         │  │     └── /  ────▶  ┌───────────┐     └──────────┘ │  │
                         │  │                   │  Frontend │                  │  │
                         │  │                   │  :3000    │                  │  │
                         │  │                   └───────────┘                  │  │
                         │  └──────────────────────────────────────────────────┘  │
                         │                                                        │
                         └────────────────────────────────────────────────────────┘
```

Only port 80 is exposed publicly. Backend, frontend, and database communicate internally over Docker's network.
Also, real SMTP server is used

---

## Dev Environment Setup

The dev environment is fully Dockerized — no need to install Node, MongoDB, or any other dependencies locally. The only setup required is creating the environment files, setting up firebase for push notifs:

### 1. Environment Files

**Backend** — create `medi_routines_backend/.env.dev`:
```dotenv
# database
MONGODB_CONNECTION=mongodb://mongodb:27017

# server
PORT=8000
NODE_ENV=development

# smtp
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# secrets
JWT_SECRET=any-random-string-in-development
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/medi_routines_backend/firebase-adminsdk.json

# frontend
FRONTEND_URL=http://localhost:5173
```

**Frontend** — create `medi_routines_frontend/.env.dev`:
```dotenv
VITE_MEDI_ROUTINES_SERVER_URL=http://localhost:8000
VITE_TIMEZONES_SERVER_URL=https://timeapi.io
```

### 2. Firebase service account key

Obtain the Firebase Admin SDK service account JSON file from the Firebase Console:
> Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 
Place it at `medi_routines_backend/firebase-adminsdk.json`.
 
> Note: This file is gitignored and dockerignored. Never commit it.

### Start Dev Server
```bash
docker compose -f compose.dev.yml -p dev watch
```

### Run tests
```bash
docker compose -f compose.test.yml -p test up --exit-code-from backend --build
```

---

## Deployment

### Current Setup

The app is deployed on a single cloud VM (Azure). Refer to the prod architecture above — all services run as Docker containers on the VM, with Nginx as the single public entry point on port 80 handling SSL termination and routing.

### First Time / One-Time Setup

**1. SSH into the VM**
```bash
ssh azureuser@<vm-ip>
```

**2. Install Docker**
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

**3. Clone the repo**
```bash
git clone https://github.com/sanketgupta1000/medi_routines.git
cd medi_routines
```

**4. Exit the VM**
```bash
exit
```

**5. Create `.env.prod` locally** at `medi_routines_backend/.env.prod`:
```dotenv
# database
MONGODB_CONNECTION=mongodb://mongodb:27017

# server
PORT=8000
NODE_ENV=production

# smtp
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# secrets
JWT_SECRET=
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/medi_routines_backend/firebase-adminsdk.json

# frontend
FRONTEND_URL=https://mediroutines.sanketgupta.tech
```

**6. Copy secrets to the VM**
```bash
# copy backend env file
scp ./medi_routines_backend/.env.prod azureuser@<vm-ip>:~/medi_routines/medi_routines_backend/.env.prod
 
# copy firebase service account key
scp ./medi_routines_backend/firebase-adminsdk.json azureuser@<vm-ip>:~/medi_routines/medi_routines_backend/firebase-adminsdk.json
```

**7. Set up custom domain and SSL**
 
Point your domain's A record to `<vm-ip>`, then SSH into the VM and run:
 
```bash
# stop containers to free port 80
docker compose -f compose.prod.yml -p prod down
 
# obtain SSL certificate
sudo apt install certbot -y
sudo certbot certonly --standalone -d <your-domain>
 
# make sure ports 80 and 443 are open in your cloud provider's firewall
```

**8. SSH back in and start the server**
```bash
ssh azureuser@<vm-ip>
cd medi_routines
docker compose -f compose.prod.yml -p prod up -d --build
```

---

### CI/CD Setup (one time, per repo)
 
Tests run automatically on every PR to `main`. Deployment runs automatically on every merge to `main`.
 
Add the following in GitHub → repo → Settings:
 
**Secrets** (Settings → Secrets and variables → Actions → Secrets):
| Name | Value |
|---|---|
| `VM_SSH_PRIVATE_KEY` | Private SSH key whose public key is authorized on the VM |
| `VM_IP` | Public IP of the VM |
| `VM_USER` | SSH username (e.g. `azureuser`) |
 
---

### Subsequent Deployments via CI/CD Setup

- When a pull request is created on main, tests are run via `.github/workflows/ci.yml`.
- Only if the tests pass, is the merge allowed to `main`.
- After merged to `main`, it is deployed to a VM in the cloud via `.github/workflows/cd.yml`.

### Manual deploy fallback
- In case need to manually deploy, run: `VM_USER=<username> VM_IP=<ip> ./deploy.sh`