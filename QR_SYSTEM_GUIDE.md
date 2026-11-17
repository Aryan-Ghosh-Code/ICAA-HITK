# ICAA 2027 QR Code & Meal System Guide

This guide explains how the QR code system works, how to test it, and how to operate it for production.

---

## 1. What the System Does

1. **One Badge = One QR Code**:
   - Each participant gets an ID card with one unique QR code.
   - The QR code contains a secure link: `${SITE_URL}/certificates/<secret-32-char-id>`.

2. **If an Attendee Scans It**:
   - Opens `/certificates/<id>` directly in their mobile browser.
   - Shows their name, conference role(s), and download buttons for their certificates.
   - PIDs (like `ICAA27_AUT_001`) are internal and never shown in the URL or public page.

3. **If a Volunteer Scans It (Meal Desk)**:
   - Scanned inside the staff app (e.g. `/vol-k7x2q9` or `/scanner`, configured via `SCANNER_SLUG`).
   - Verifies whether the attendee is eligible for the current meal slot.
   - **Guarantees 1 meal per slot**: First scan is approved (Green). Any duplicate attempt in the same slot turns Amber with the exact time and volunteer who served them.

---

## 2. Configuration (`.env.local`)

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string (Staging Atlas or Production) | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGODB_DB` | Database name | `icaa` |
| `SITE_URL` | Base website URL (encoded into QR codes) | `http://localhost:3000` (local) or `https://icaa.co.in` |
| `SCANNER_SLUG` | Secret URL path for the meal scanner app | `vol-k7x2q9` (makes scanner accessible at `/vol-k7x2q9`) |
| `AUTH_SECRET` | Secret key for signing session cookies (32+ chars) | `openssl rand -hex 32` |
| `ADMIN_MASTER_KEY`| Master password to access the Admin Statistics Panel at `/admin` | `supersecretadminpassword123` |
| `DRIVE_FOLDER_ID`| Google Drive folder containing `<PID>.pdf` certificates | `1AbCdEfGhIjKlMnOpQrStUvWxYz` |
| `GOOGLE_SA_KEY` | Google Service Account JSON key (one line) | `{"type":"service_account",...}` |
| `SCAN_IGNORE_WINDOW`| Set `1` to test scanning outside official serving times | `0` or `1` |

---

## 3. How to Test (Step-by-Step)

### Step 1: Validate Your CSV
Check `data/master.csv` for any syntax errors or duplicate IDs:
```bash
npm run validate-master
```

### Step 2: Seed the Database
Imports the participants into MongoDB and writes `out/token_map.csv`:
```bash
npm run seed
```

### Step 3: Generate QR Codes
Generates high-resolution PNG & SVG files into `out/qrs/`, and creates `out/cards_for_designer.csv` for badge printing:
```bash
npm run generate-qrs
```
*(Optional: run `npm run contact-sheet` to create an A4 test print sheet at `out/contact_sheet.pdf`)*.

### Step 4: Create a Volunteer Account
Create a volunteer name and secure password (minimum 8 characters):
```bash
npm run create-volunteer rahul mySecurePassword123
```

### Step 5: Start the Development Server
```bash
npm run dev
```
Open `http://localhost:3000`:
- **Meal Scanner**: Navigate to `http://localhost:3000/vol-k7x2q9` (or whatever `SCANNER_SLUG` you set). Sign in with `rahul` and `mySecurePassword123`.
- **Certificates Page**: Open any URL from `out/token_map.csv` (e.g. `http://localhost:3000/certificates/<id>`) to see the attendee certificate page.
- **Admin Dashboard**: Open `http://localhost:3000/admin` and log in with your `ADMIN_MASTER_KEY`.

---

## 4. Google Drive Certificate Syncing

1. In your Google Drive, create a folder for certificates.
2. Share the folder with your Google Service Account email as **Viewer**.
3. Name each certificate PDF with its PID (e.g. `ICAA27_AUT_001.pdf`).
4. Run:
   ```bash
   npm run sync-certs
   ```
   This automatically maps every certificate in Drive to the corresponding participant in MongoDB.
5. When the conference concludes, make certificate downloads active:
   ```bash
   npm run admin release on
   ```

---

## 5. Admin Panel & Statistics Dashboard

Access the web dashboard directly at:
👉 **`http://localhost:3000/admin`** (or `https://your-domain.com/admin`)

- **Security**: Protected by `ADMIN_MASTER_KEY` defined in `.env.local`.
- **Live Headcount & Stats**: Auto-refreshes every 10 seconds with total registered, served meals vs. eligible per slot, and percentage progress bars.
- **Certificate Release Button**: 1-click toggle to release or lock certificates in real time.
- **Volunteer Management**: Add new volunteer accounts directly with a secure password (hashed with `scrypt`).
- **Live Audit Stream**: Real-time log table showing all successful and denied scan attempts with timestamps and reasons.
- **Export Claims**: One-click download of the complete `claims.csv` for catering reconciliation.

Alternatively, CLI admin commands are also available:
```bash
# View live meal headcount (claimed vs remaining per slot)
npm run admin report

# Search attendee by name or PID
npm run admin find "Rahul"

# Undo an accidental scan
npm run admin undo ICAA27_AUT_001 D1_LUNCH

# Unlock certificates for public download
npm run admin release on

# Re-lock certificates
npm run admin release off

# Export all meal claims to out/claims.csv for the caterer
npm run admin export-claims
```

---

## 6. Going to Production

To switch to production:
1. In your deployment hosting (Vercel / Cloudflare / server), set:
   - `MONGODB_URI` = your production MongoDB cluster
   - `SITE_URL` = `https://icaa.co.in`
   - `SCAN_IGNORE_WINDOW` = `0`
2. Run `npm run seed` and `npm run generate-qrs`.
3. Give `out/cards_for_designer.csv` and `out/qrs/` to your badge printing team.
4. That's it — no code changes needed!
