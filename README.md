# MBONO Recruitment Services

A modern recruitment platform that connects talent with opportunity across South Africa.

**Stack:** React 18 + TypeScript + Tailwind CSS (Vite) · Node.js + Express (TypeScript) · PostgreSQL · JWT + role-based access control.

---

## ▶ Run it in VS Code (3 steps)

**You need:** [Node.js 20 or newer](https://nodejs.org) and VS Code. Nothing else. No database install is needed.

1. **Open the folder** in VS Code: `File → Open Folder… → mbono-recruitment`
2. Open the terminal (`` Ctrl+` ``) and install everything (one command installs the root, server and client):
   ```bash
   npm install
   ```
3. Start the API and the website together:
   ```bash
   npm run dev
   ```
   Then open **http://localhost:5173**

> Tip: you can also press `Ctrl+Shift+B`, which runs the **"Run MBONO (API + Web)"** task.

### Demo accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@mbono.co.za | Admin@123 |
| Recruiter | recruiter@mbono.co.za | Recruiter@123 |
| Candidate | candidate@mbono.co.za | Candidate@123 |

The Sign In page has buttons that fill these in for you. There is also a **pending recruiter** (pending@talentco.co.za) for testing admin approvals.

### Database
* **Default (zero setup):** the API runs a built-in **in-memory PostgreSQL engine** (`pg-mem`). It uses the same SQL schema. Data resets each time the API restarts.
* **Real PostgreSQL:** run `docker compose up -d` (or use your own Postgres). Then set `DATABASE_URL=postgres://postgres:postgres@localhost:5432/mbono_recruitment` in `server/.env` and restart. The schema and demo data are created automatically on first run.

### Optional settings (`server/.env`)
| Setting | Purpose |
|---|---|
| `JWT_SECRET` | **Change this** before deploying. |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Send real emails. Without them, emails are printed in the terminal and listed in **Admin → Messages → Email log**. |
| `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` | Optional AI answers for the chatbot. Without a key, the built-in assistant still answers FAQs and searches live vacancies. |

---

## Project structure
```
mbono-recruitment/
├─ client/                 React + TypeScript + Tailwind front end (Vite, port 5173)
│  └─ src/
│     ├─ components/       Navbar, Footer, ChatWidget, JobCard, ThemeToggle, UI kit
│     ├─ lib/              api client, auth (JWT) context, theme (light/dark/system), content
│     └─ pages/            Home, About, Vacancies (+ job detail), Contact, Sign In/Up
│        └─ dashboard/     Admin, Recruiter, Candidate dashboards
├─ server/                 Express + TypeScript API (port 5000)
│  └─ src/
│     ├─ db/               schema.sql, seed data, PostgreSQL / pg-mem connection
│     ├─ middleware/       JWT authentication + authorize(role) RBAC
│     ├─ routes/           public, candidate, recruiter, admin, common (files/notifications), chat
│     ├─ email.ts          Nodemailer email notifications
│     └─ uploads.ts        Multer CV/certificate uploads (PDF/DOC/DOCX/images, 5 MB)
├─ .vscode/                tasks, launch (debug) configs, recommended extensions
└─ docker-compose.yml      Optional PostgreSQL
```

## Requirements checklist
| Requirement | Where |
|---|---|
| Branding "MBONO Recruitment Services", green/white/dark gray | `client/tailwind.config.js`, `components/ui.tsx` (Logo) |
| Menu: Home, About Us, Vacancies, Contact Us, Sign In, Sign Up | `components/Navbar.tsx` |
| Hero with exact headline and subtitle, Browse Vacancies and Register Now buttons | `pages/Home.tsx` (text editable by admin) |
| Featured Jobs, Why Choose, Recruitment Process, Statistics, Testimonials, Partners, Footer with contact and socials | `pages/Home.tsx`, `components/Footer.tsx` |
| About: overview, mission/vision, core values, approach, team | `pages/About.tsx` |
| Vacancies: keyword search; filters for type, location, industry and salary; job cards with title, company, location, closing date and Apply | `pages/Vacancies.tsx`, `components/JobCard.tsx` |
| Contact: form, office info, email, phone, Google Maps | `pages/Contact.tsx` |
| JWT auth and RBAC (admin, recruiter, candidate) | `server/src/middleware/auth.ts`, `client/src/lib/auth.tsx` |
| Admin: manage users, recruiters, candidates and vacancies; approve/reject recruiters; analytics; CSV reports; website content; system settings | `pages/dashboard/Admin.tsx`, `routes/admin.ts` |
| Recruiter: create/edit/delete vacancies, review applications, shortlist, schedule interviews, update status, company profile, candidate search | `pages/dashboard/Recruiter.tsx`, `routes/recruiter.ts` |
| Candidate: profile, CV and certification upload, apply, track status, interview invitations, saved jobs | `pages/dashboard/Candidate.tsx`, `routes/candidate.ts` |
| Dashboard stats for each role, as specified | Overview tab of each dashboard |
| Email notifications (registration, applications, status changes, interviews, approvals, contact) | `server/src/email.ts` |
| Chatbot (FAQ, live job search, contact info, optional AI) | `components/ChatWidget.tsx`, `routes/chat.ts` |
| Light / Dark / System theme | `lib/theme.tsx`, `components/ThemeToggle.tsx` (navbar and Settings) |
| Responsive design and animations | Tailwind breakpoints, `Reveal`/`CountUp` scroll animations, hover transitions |
| Security | bcrypt password hashes, JWT, role checks on every API route, helmet, rate limiting on login and chat, file type/size validation, parameterised SQL |

## Useful scripts
| Command | What it does |
|---|---|
| `npm run dev` | API (5000) + web (5173) with hot reload |
| `npm run build` | Type-check the API and build the production front end |
| `npm run dev --prefix server` | API only |
| `npm run dev --prefix client` | Web only |
