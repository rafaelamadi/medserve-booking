Two different sign-ins — depends which side you want:
Staff hub (http://localhost:3001/hub/login)
- Email: admin@medserve.ng
- Password: none — dev sign-in is email-only, just enter the email and submit
- Role: SUPER_ADMIN (sees all 3 centres). Other staff accounts can be created under Hub → Settings → Staff users.
Patient side (http://localhost:3001/manage) — no account exists:
1. First book at http://localhost:3001/book (use any Nigerian-format phone, e.g. 0803 123 4567) — you'll get a reference like MS-MKDC-XXXXXX on the confirmation screen. Note it down.
2. Go to /manage, enter that reference + the same phone → you'll be shown a 6-digit code on screen (dev mode stands in for the SMS) → enter it → booking detail opens.
Tell me which side you're testing and I can walk you through what to click.