# RoomReserve - Meeting Room Booking System

A comprehensive meeting room reservation platform built with Next.js, featuring user authentication, real-time conflict checking, email notifications, and admin management.

## Features

### Core Features
- **User Authentication**: Email/password login and Google OAuth integration
- **Room Booking System**: Reserve meeting rooms with conflict prevention
- **Calendar Integration**: Visual calendar view for available time slots
- **Email Notifications**:
  - Confirmation emails upon booking
  - Reminder emails 15 minutes before meetings
- **Admin Dashboard**: Complete room and reservation management
- **Conflict Prevention**: Automatic detection and prevention of double-bookings
- **Real-time Updates**: Live reservation status and availability

### User Features
- Browse available meeting rooms
- View room details (capacity, location, amenities)
- Create, view, and cancel reservations
- Receive email confirmations and reminders
- See all upcoming reservations

### Admin Features
- Create, edit, and delete meeting rooms
- View all reservations across the organization
- Cancel any reservation
- Manage room availability

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Authentication**: NextAuth.js v5
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Email**: Nodemailer
- **Calendar**: React Big Calendar

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **The project is already set up!**

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Test Accounts

The database has been pre-seeded with the following accounts:

**Admin Account**
- Email: `admin@roomreserve.com`
- Password: `admin123`
- Role: Administrator (can manage rooms and all reservations)

**User Accounts**
- Email: `john@company.com`
- Password: `user123`
- Role: Regular user

- Email: `jane@company.com`
- Password: `user123`
- Role: Regular user

### Sample Data

The database includes:
- 7 pre-configured meeting rooms (various capacities and amenities)
- 3 sample reservations for testing
- All rooms have detailed descriptions, locations, and amenities

## Usage Guide

### For Regular Users

1. **Sign In**: Use one of the test accounts or create a new account
2. **View Rooms**: Browse available meeting rooms on the dashboard
3. **Book a Room**:
   - Select a room from the dropdown
   - Enter meeting title and description
   - Choose start and end times
   - Specify number of attendees
   - Submit the booking
4. **Manage Reservations**: View and cancel your upcoming reservations

### For Administrators

1. **Sign In**: Use the admin account
2. **Access Admin Panel**: Click the "Admin Panel" button in the header
3. **Manage Rooms**:
   - Add new rooms with details, capacity, location, and amenities
   - Delete existing rooms
4. **Manage Reservations**:
   - View all reservations across the organization
   - Cancel any reservation if needed
5. **Switch Views**: Toggle between admin and user dashboards

## Email Notifications (Optional)

To enable email notifications, update the `.env` file with your SMTP settings:

```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-specific-password"
EMAIL_FROM="noreply@yourcompany.com"
```

## Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Client Secret to `.env`

## Database Commands

```bash
# Seed the database with sample data
npm run db:seed

# Reset database and re-seed
npm run db:reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Project Structure

```
RoomReserve/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── rooms/        # Room management
│   │   ├── reservations/ # Reservation management
│   │   └── cron/         # Cron jobs (reminders)
│   ├── auth/             # Auth pages (signin/signup)
│   ├── dashboard/        # User dashboard
│   ├── admin/            # Admin dashboard
│   └── page.tsx          # Root redirect
├── components/            # React components
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── email.ts          # Email service
├── prisma/                # Database
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Seed script
│   └── migrations/       # Database migrations
└── types/                 # TypeScript types
```

## Key Features

### Conflict Prevention
The system prevents double-bookings by checking for overlapping reservations before creating a new one.

### Email System
- **Confirmation emails**: Sent immediately after booking
- **Reminder emails**: Sent 15 minutes before meetings (requires cron job setup)

### Authentication Flow
- Email/password authentication with bcrypt hashing
- Google OAuth integration
- Role-based access control (user/admin)
- JWT session management

## Production Deployment

### Environment Variables
1. Generate a secure `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

2. Update `NEXTAUTH_URL` to your production domain

### Database
For production, consider upgrading from SQLite to PostgreSQL

### Deployment Platforms
- **Vercel**: Automatic deployment from Git
- **Netlify**: Great for Next.js apps
- **Railway/Render**: Easy PostgreSQL integration

## Troubleshooting

**Database errors**: Run `npm run db:reset`

**Authentication not working**: Check `NEXTAUTH_SECRET` in `.env`

**Google OAuth not working**: Verify redirect URI matches your app URL

## Future Enhancements

- Recurring meetings
- Calendar export (iCal)
- Mobile app
- Slack/Teams integration
- Room availability dashboard
- Advanced calendar view with drag-and-drop
- Meeting analytics and reporting

---

Built with Next.js, TypeScript, and Prisma. Ready for production!
