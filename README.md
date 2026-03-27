# Vendor Portal Backend — Django + PostgreSQL

Full rewrite of the NestJS vendor portal in Python/Django.

## Prerequisites
- Python 3.10+
- PostgreSQL

---

## Setup

### 1 — Create and activate a virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 2 — Install dependencies
```bash
pip install -r requirements.txt
```

### 3 — Configure environment
```bash
cp .env.example .env
# Edit .env and fill in your DB credentials
```

### 4 — Create the PostgreSQL database
```bash
psql -U postgres -c "CREATE DATABASE vendor_portal;"
```

### 5 — Run migrations
```bash
python manage.py migrate
```

### 6 — Seed default users
```bash
python manage.py seed
```

### 7 — Start the development server
```bash
python manage.py runserver
```

The API is available at: http://localhost:8000/api/

---

## Default Users (password: Test@1234)

| Role               | Email                                   |
|--------------------|-----------------------------------------|
| Employee           | employee@hindujarenewables.com          |
| Admin              | admin@hindujarenewables.com             |
| Finance Controller | financecontroller@hindujarenewables.com |
| SAP User           | sapuser@hindujarenewables.com           |
| Super Admin        | superadmin@hindujarenewables.com        |

---

## API Endpoints

### Auth  `/api/auth/`
| Method | Path                     | Access     |
|--------|--------------------------|------------|
| POST   | login/                   | Public     |
| POST   | token/refresh/           | Public     |
| POST   | vendor/send-otp/         | Public     |
| POST   | vendor/verify-otp/       | Public     |

### Vendors  `/api/vendors/`
| Method | Path                        | Access              |
|--------|-----------------------------|---------------------|
| GET    | /                           | Admin+              |
| POST   | create/                     | Employee            |
| GET    | my-requests/                | Employee            |
| GET    | register/validate/          | Public              |
| POST   | register/submit/            | Public              |
| GET    | `<id>/`                     | Authenticated       |
| GET    | `<id>/form/`                | Authenticated       |
| PUT    | `<id>/admin-fields/`        | Admin               |

### Workflow  `/api/workflow/`
| Method | Path                    | Access         |
|--------|-------------------------|----------------|
| POST   | `<id>/approve/`         | Stage-specific |
| POST   | `<id>/reject/`          | Stage-specific |
| POST   | `<id>/clarification/`   | Stage-specific |
| GET    | `<id>/history/`         | Authenticated  |

### Documents  `/api/documents/`
| Method | Path                              | Access        |
|--------|-----------------------------------|---------------|
| POST   | vendor-request/`<id>`/upload/     | Public        |
| GET    | vendor-request/`<id>`/            | Authenticated |
| DELETE | `<id>`/                           | Authenticated |

### SAP  `/api/sap/`
| Method | Path              | Access   |
|--------|-------------------|----------|
| GET    | pending/          | SAP User |
| POST   | import/           | SAP User |
| GET    | `<id>`/export/    | SAP User |

### Admin Portal  `/api/admin-portal/`
| Method | Path                          | Access      |
|--------|-------------------------------|-------------|
| GET    | dashboard/                    | Admin+      |
| GET    | users/                        | Admin+      |
| POST   | users/create/                 | Super Admin |
| PUT    | users/`<id>`/deactivate/      | Super Admin |
| PUT    | users/`<id>`/activate/        | Super Admin |
| GET    | reports/export/?type=...      | Admin+      |

### Notifications  `/api/notifications/`
| Method | Path              | Access        |
|--------|-------------------|---------------|
| GET    | /                 | Authenticated |
| GET    | unread-count/     | Authenticated |
| PUT    | mark-all-read/    | Authenticated |
| PUT    | `<id>`/read/      | Authenticated |

### Audit  `/api/audit/`
| Method | Path  | Access |
|--------|-------|--------|
| GET    | /     | Admin+ |

---

## Approval Workflow

```
Vendor submits form
       ↓
  L1 — Employee reviews → Approve / Reject / Clarify
       ↓
  L2 — Admin reviews + adds company code/tax fields → Approve / Reject / Clarify
       ↓
  L3 — Finance Controller final approval
       ↓
  SAP User — imports CSV with vendor codes → COMPLETED
```

## SAP CSV Import Format
```
ticket_number,vendor_code
VREG-2026-12345,SAP-V-0001
```
