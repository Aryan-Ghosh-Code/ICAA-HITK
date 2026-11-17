# ICAA

The official site for the International Conference on Applied Algorithms (ICAA 2027).

---

## ICAA QR Code & Meal Management System

The repository includes a production-ready QR code generation, meal distribution, and certificate delivery system for ICAA 2027.

### Features
- **One QR per Participant**: Encodes a secure random link (`${SITE_URL}/certificates/<id>`) that participants can scan to download their certificates.
- **Volunteer Meal Scanner**: Web app with camera viewfinder for catering volunteers to scan badges and record meal claims with duplicate prevention.
- **Configurable Scanner Route**: Custom secret URL route controlled by `SCANNER_SLUG` in `.env.local` (e.g. `/vol-k7x2q9`).
- **Google Drive Integration**: Certificate PDFs stream directly from Google Drive.
- **Badge Designer Export**: Automatic export of clean CSV and QR image files for badge printing without exposing secret tokens.

For complete setup and operation instructions, see [**QR_SYSTEM_GUIDE.md**](./QR_SYSTEM_GUIDE.md).

### Quick Commands

```bash
# Validate participant CSV
npm run validate-master

# Seed participants into MongoDB & generate token map
npm run seed

# Generate QR codes into out/qrs
npm run generate-qrs

# Create volunteer login (name + 6-digit PIN)
npm run create-volunteer "rahul" 123456

# Sync certificates from Google Drive
npm run sync-certs

# Check meal headcounts / release certificates
npm run admin report
npm run admin release on
```
