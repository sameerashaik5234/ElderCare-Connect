# 🏥 ElderCare Connect

> **PromptWars x Catalyst Hackathon Project**  
> An accessible, responsive, and secure Elderly Care & Medication Management Platform with bilingual English & Telugu support, Web Speech API voice assistance, automated missed-dose alerts, doctor appointment management, and Google Cloud Run deployment readiness.

---

## 🌟 Key Highlights & Hackathon Innovations

1. **Accessibility First (WCAG 2.1 AAA Standard):**
   - **Bilingual Interface:** Instant language switching between **English** and **Telugu (తెలుగు)** with 100% dictionary coverage.
   - **Voice Assistant (Web Speech API):** Hands-free speech synthesis reads today's medicines aloud in natural cadence; speech recognition listens for voice commands (*"Read my medicines"*, *"Took my medicine"*, *"Emergency"*).
   - **Tactile Senior Mode:** Extra-large touch targets ($\ge 64$px buttons), bold readable typography with a dynamic font-size switcher (`Normal`, `Large`, `Extra Large`), and a 7:1+ High-Contrast senior theme.
   - **Visual Pill Identification:** Pill color indicators and distinct shape icons (round, capsule, oval) to prevent reliance on color alone.

2. **Frictionless & Secure Passcode Access:**
   - **Senior 4-Digit PIN Keypad:** Seniors authenticate with an on-screen tactile number pad (default PIN: `1234`), removing password friction while enforcing brute-force lockouts and caregiver alerts after 5 failed attempts.
   - **Caregiver & Family Portal:** Secure email/password login with role-based access control (RBAC).
   - **Judge Quick Persona Switcher:** Top-bar dropdown allowing hackathon evaluators to instantly switch between:
     - 👵 **Lakshmi Devi** (Elderly Beneficiary - PIN: `1234`)
     - 👨‍⚕️ **Dr. Rajesh Rao** (Caregiver / Physician)
     - 👨‍👩‍👧 **Suresh Kumar** (Family Member / Son)

3. **Smart Medication Scheduling & Adherence Engine:**
   - One-tap *"TAKE DOSE"* with audible chime confirmation and full-screen celebration modal.
   - Snooze (15m reminder) and Skip with logged clinical reasons.
   - Real-time inventory tracking: automatically flags low-stock warnings when remaining pills drop below the refill threshold.

4. **Automated Missed-Dose Email Alerts & Google Cloud Scheduler:**
   - Evaluates overdue doses past a 30-minute grace period.
   - Dispatches formatted HTML email notifications to registered family members and caregivers with patient details, dosage, and one-click phone dialer.
   - Cloud Run compatible endpoint `/api/scheduler/check-reminders` integrated with **Google Cloud Scheduler**.

5. **Doctor Appointment Management & Pre-Visit Checklist:**
   - Doctor directory, clinic addresses, phone links, and appointment countdowns.
   - Pre-visit checklist tracking (e.g., *"10-hour fasting required for HbA1c"*, *"Bring current pill boxes"*).

6. **Healthcare Vitals & Clinical Correlation Analytics:**
   - Logs Blood Pressure (Systolic/Diastolic), Blood Glucose, Heart Rate, SpO2, and Mood.
   - **Dual-Axis Correlation Chart:** Plots Blood Pressure stabilization against medication compliance over time.
   - **One-Click Printable Doctor Summary:** Formats a clean clinical report ready for physical clinic consultations.

7. **Offline-First Resilience (PWA):**
   - Service Worker caches the application shell.
   - Today's medications and emergency contacts remain viewable offline; doses logged offline queue automatically and sync once reconnected.

8. **Medical Safety Disclaimer:**
   - Clear disclaimer visible across the platform: *"ElderCare Connect is an adherence tracking and reminder assistant. It does not provide medical diagnoses or recommend medication dosage modifications. Always consult a certified healthcare professional."*

---

## 🏗️ System Architecture

```
[Elderly / Family / Caregiver]
             │
             ▼
[Presentation Layer: Responsive SPA + Web Speech API + Offline PWA]
             │
             ▼
[Node.js Full-Stack Application on Google Cloud Run (Port 8080)]
   ├── /api/auth             (PIN + Password Authentication & RBAC)
   ├── /api/medications      (Prescription CRUD & Refill Tracking)
   ├── /api/adherence        (Today's Doses, Actions, 7-Day Stats)
   ├── /api/appointments     (Doctor Visits & Clinical Checklists)
   ├── /api/vitals           (BP, Glucose, Heart Rate, Mood Logs)
   ├── /api/sos              (Emergency Dispatch & Geolocation)
   └── /api/scheduler        (Google Cloud Scheduler Endpoint)
             │
             ▼
[Dual Database Architecture]
   ├── Production: PostgreSQL / Cloud SQL
   └── Local Dev:  Native High-Performance SQLite (node:sqlite)
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js v20+ or v24+

### 1. Run Automated Test Suite
```bash
npm test
```
*Runs all 15 automated unit and integration tests covering Authentication, Adherence, Cloud Scheduler, and REST API dispatch.*

### 2. Seed Database
```bash
npm run seed
```
*Populates the database with realistic sample patients, 4 prescriptions, 7 days of adherence history, appointments, and vitals.*

### 3. Start Application Server
```bash
npm start
```
Open **`http://localhost:8080`** in any web browser.

---

## 🔑 Demo Credentials (For Evaluators)

| Role | Name | Identifier | Credential | View Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Elderly** | Lakshmi Devi (లక్ష్మీ దేవి) | Profile Select | **PIN: `1234`** | Senior Accessible View |
| **Caregiver** | Dr. Rajesh Rao | `caregiver@eldercare.com` | `Caregiver@123` | Caregiver Portal |
| **Family** | Suresh Kumar | `family@eldercare.com` | `Family@123` | Family View |

*(You can also use the **"Demo Persona"** dropdown in the top navigation bar to switch personas instantly with one click.)*

---

## ☁️ Google Cloud Run & Cloud Scheduler Deployment

### 1. Build and Deploy to Cloud Run
```bash
# Build Docker image
docker build -t gcr.io/<PROJECT_ID>/eldercare-connect:latest .

# Deploy to Cloud Run (Port 8080)
gcloud run deploy eldercare-connect \
  --image gcr.io/<PROJECT_ID>/eldercare-connect:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=postgresql://user:pass@host:5432/eldercare"
```

### 2. Configure Google Cloud Scheduler
Set up a recurring job to invoke the missed-dose evaluator every 15 minutes:
```bash
gcloud scheduler jobs create http eldercare-dose-monitor \
  --schedule="*/15 * * * *" \
  --uri="https://<YOUR_CLOUD_RUN_URL>/api/scheduler/check-reminders" \
  --http-method=POST \
  --headers="X-CloudScheduler=true" \
  --time-zone="Asia/Kolkata"
```

---

## 🧪 Test Coverage
The automated test suite (`tests/runner.js`) verifies:
- ✅ Password and 4-digit PIN cryptographic hashing and verification
- ✅ Brute-force lockout and security alerts on consecutive invalid PIN attempts
- ✅ Role-based token authentication
- ✅ Medication schedule generation and remaining pill count deduction
- ✅ 7-day adherence rate computation and streak calculation
- ✅ Overdue dose detection and missed-dose transition
- ✅ Emergency SOS dispatch and caregiver alert recording
- ✅ Cloud Scheduler authorization and health check probes

---

## 📜 Medical Disclaimer
ElderCare Connect is an adherence tracking and reminder assistant. It does not provide medical diagnoses or recommend medication dosage modifications. Always consult a certified healthcare professional.
