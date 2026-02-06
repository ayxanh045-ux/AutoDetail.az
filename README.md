# AutoDetail.az

AutoDetail.az is a platform built to make finding car parts and services easier and faster.  
Users can share listings for spare parts, browse posts, and contact the seller directly.  
The project focuses on solving the common problem of “zapçast tapılmır” by connecting customers, mechanics, and sellers in one place.

---

## Main Features (Full)

### User & Auth
- Registration and login system
- Email verification flow
- Forgot password flow (email reset link)
- Password reset page with token + new password
- Profile page with editable name/phone
- Profile image upload and delete
- Role-based access (user/admin)
- Admin-only features are hidden for non-admin users

### Listings (Posts)
- Create posts with car info, part type, description, image, and price
- Post details page with full information
- Owner/Admin can edit and delete posts
- Price with currency (AZN / USD / EUR)
- Call button to reveal phone number
- Like button and favorites saving
- Approximate AZN price when currency is not AZN
- Price history tracking with increase/decrease indicators

### Search & Filters
- Global header search
- Filter by brand / model / year / color
- Filter by spare part type
- Search suggestions for brand/model/year/color and header search
- Brand input scopes model suggestions to that brand

### Favorites
- Users can like posts and save them to Favorites
- Favorites page lists saved posts
- Remove from favorites

### Admin Panel (Full)
- Users: list, edit, delete, change role
- Posts: list, edit, delete
- Cars: list, add, delete
- Car Models: list, add, delete
- Parts: list, add, delete
- Pending Users: list, delete
- Pending Cars: list, approve, delete
- Admin-only navigation link shown for admins

### UI/UX
- Multi-language UI (AZ/EN/RU) stored in localStorage
- Animated search placeholder
- Floating “add post” button (login required)
- Consistent header/footer styling across pages
- Card like animation and “Bəyənildi” toast

---

## Project Structure

```
backend/   # Express + MySQL API
frontend/  # Static HTML/CSS/JS
```

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5
- **Backend:** Node.js, Express
- **Database:** MySQL
- **Auth:** bcrypt + email verification

---

## How to Run (Local)

### 1) Backend
```
cd backend
npm install
npm run dev
```

### 2) Frontend
Open `frontend/index.html` in a browser  
or visit `http://localhost:4000` if backend serves the frontend.

---

## Environment Variables

Create a `.env` file in `backend/` (see `backend/.env.example`):

```
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=AutoDetail_az
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=app_password
SMTP_FROM="AutoDetail.az <your@gmail.com>"
```

---

## Notes

- Only **post owner** or **admin** can edit/delete listings.
- Admin panel is available at `/admin.html` for admin users only.
- Favorites and likes are stored in the database.
- Price history is recorded on each price change.

---

## Purpose

AutoDetail.az was created to reduce the time and effort people spend searching for parts by centralizing real listings and connecting buyers with sellers directly.
