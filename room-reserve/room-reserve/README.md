# Room Reserve

A modern meeting room booking system built with Next.js, Prisma, and PostgreSQL.

## Features

- 📅 **Interactive Calendar** - Drag-and-drop booking calendar with multi-room support
- 👥 **Guest Management** - Add guests with email autocomplete and visual guest list
- 🔄 **Recurring Meetings** - Support for daily, weekly, and monthly recurring bookings
- 🔐 **Authentication** - Secure user authentication with NextAuth.js
- 👨‍💼 **Admin Panel** - Room and booking management for administrators
- 📧 **Email Notifications** - Automatic email notifications for bookings
- 🎨 **Modern UI** - Beautiful, responsive design with brand colors

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Calendar**: react-big-calendar
- **Email**: Nodemailer

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Daniel-Itzhaki/RoomReserve.git
cd RoomReserve/room-reserve/room-reserve
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/roomreserve?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="Room Reserve <noreply@roomreserve.com>"
```

5. Set up the database:
```bash
npx prisma db push
npx prisma generate
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3010](http://localhost:3010) in your browser.

## Deployment to Vercel

### Prerequisites

- GitHub account
- Vercel account
- PostgreSQL database (recommended: Vercel Postgres, Supabase, or Neon)

### Steps

1. **Push to GitHub** (if not already done):
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure environment variables in Vercel dashboard:
     - `DATABASE_URL` - Your PostgreSQL connection string
     - `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
     - `NEXTAUTH_SECRET` - Generate a secure secret (use `openssl rand -base64 32`)
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Your email configuration
     - `EMAIL_FROM` - Your sender email
     - `ADMIN_NOTIFICATION_EMAIL` - Admin notification email (optional)

3. **Run Database Migrations**:
   After deployment, run migrations:
   ```bash
   npx prisma db push
   ```

   Or use Vercel's build command which includes `prisma generate` (already configured in `package.json`)

4. **Create Admin User**:
   You'll need to create an admin user manually in the database or through the sign-up page and then update the role in the database.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Your application URL | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Yes |
| `SMTP_HOST` | SMTP server hostname | Yes |
| `SMTP_PORT` | SMTP server port | Yes |
| `SMTP_USER` | SMTP username | Yes |
| `SMTP_PASS` | SMTP password | Yes |
| `EMAIL_FROM` | Email sender address | Yes |
| `ADMIN_NOTIFICATION_EMAIL` | Admin notification email | No |

## Database Schema

The application uses Prisma for database management. Key models:

- **User** - User accounts with authentication
- **Room** - Meeting rooms with availability settings
- **Booking** - Meeting bookings with recurrence support

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push Prisma schema to database
- `npm run db:seed` - Seed database with sample data

## License

MIT
