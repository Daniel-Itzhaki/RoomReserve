import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const TIMEZONE = 'Asia/Jerusalem';

function formatDateTime(date: Date): string {
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, 'PPP HH:mm');
}

function formatTime(date: Date): string {
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, 'HH:mm');
}

export async function sendBookingCreatedEmail(
  userEmail: string,
  userName: string,
  booking: {
    title: string;
    startTime: Date;
    endTime: Date;
    room: { name: string };
  },
  guestEmails: string[] = []
) {
  const subject = 'Meeting Room Booking Confirmed';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Booking Confirmed</h2>
      <p>Hi ${userName},</p>
      <p>Your meeting room booking has been confirmed:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Title:</strong> ${booking.title}</p>
        <p style="margin: 5px 0;"><strong>Room:</strong> ${booking.room.name}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formatDateTime(booking.startTime)}</p>
        <p style="margin: 5px 0;"><strong>Duration:</strong> ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</p>
      </div>
      <p>Thank you for using Room Reserve!</p>
    </div>
  `;

  const guestHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Meeting Invitation</h2>
      <p>You have been invited to a meeting:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Title:</strong> ${booking.title}</p>
        <p style="margin: 5px 0;"><strong>Room:</strong> ${booking.room.name}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formatDateTime(booking.startTime)}</p>
        <p style="margin: 5px 0;"><strong>Duration:</strong> ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</p>
        <p style="margin: 5px 0;"><strong>Organizer:</strong> ${userName}</p>
      </div>
      <p>Thank you for using Room Reserve!</p>
    </div>
  `;

  try {
    // Send to organizer
    await transporter.sendMail({
      from: 'Info@smartupacademy.org',
      to: userEmail,
      subject,
      html,
    });

    // Send to guests
    if (guestEmails.length > 0) {
      await transporter.sendMail({
        from: 'Info@smartupacademy.org',
        to: guestEmails.join(', '),
        subject: `Meeting Invitation: ${booking.title}`,
        html: guestHtml,
      });
    }

    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      await transporter.sendMail({
        from: 'Info@smartupacademy.org',
        to: process.env.ADMIN_NOTIFICATION_EMAIL || 'Info@smartupacademy.org',
        subject: `New Booking: ${booking.title}`,
        html,
      });
    }
  } catch (error) {
    console.error('Failed to send booking created email:', error);
  }
}

export async function sendBookingUpdatedEmail(
  userEmail: string,
  userName: string,
  booking: {
    title: string;
    startTime: Date;
    endTime: Date;
    room: { name: string };
  },
  oldBooking?: {
    startTime: Date;
    endTime: Date;
    room: { name: string };
  },
  guestEmails?: string[]
) {
  const subject = 'Meeting Room Booking Updated';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Booking Updated</h2>
      <p>Hi ${userName},</p>
      <p>Your meeting room booking has been updated:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Title:</strong> ${booking.title}</p>
        <p style="margin: 5px 0;"><strong>Room:</strong> ${booking.room.name}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formatDateTime(booking.startTime)}</p>
        <p style="margin: 5px 0;"><strong>Duration:</strong> ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</p>
      </div>
      ${
        oldBooking
          ? `
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Previous details:</strong></p>
        <p style="margin: 5px 0;">Room: ${oldBooking.room.name}</p>
        <p style="margin: 5px 0;">Time: ${formatTime(oldBooking.startTime)} - ${formatTime(oldBooking.endTime)}</p>
      </div>
      `
          : ''
      }
      <p>Thank you for using Room Reserve!</p>
    </div>
  `;

  const guestHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Meeting Updated</h2>
      <p>You have been invited to a meeting that has been updated:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Title:</strong> ${booking.title}</p>
        <p style="margin: 5px 0;"><strong>Room:</strong> ${booking.room.name}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formatDateTime(booking.startTime)}</p>
        <p style="margin: 5px 0;"><strong>Duration:</strong> ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</p>
        <p style="margin: 5px 0;"><strong>Organizer:</strong> ${userName}</p>
      </div>
      ${
        oldBooking
          ? `
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Previous details:</strong></p>
        <p style="margin: 5px 0;">Room: ${oldBooking.room.name}</p>
        <p style="margin: 5px 0;">Time: ${formatTime(oldBooking.startTime)} - ${formatTime(oldBooking.endTime)}</p>
      </div>
      `
          : ''
      }
      <p>Thank you for using Room Reserve!</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: 'Info@smartupacademy.org',
      to: userEmail,
      subject,
      html,
    });

    // Send update notifications to guests
    if (guestEmails && guestEmails.length > 0) {
      await transporter.sendMail({
        from: 'Info@smartupacademy.org',
        to: guestEmails.join(', '),
        subject: `Meeting Updated: ${booking.title}`,
        html: guestHtml,
      });
    }

    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      await transporter.sendMail({
        from: 'Info@smartupacademy.org',
        to: process.env.ADMIN_NOTIFICATION_EMAIL || 'Info@smartupacademy.org',
        subject: `Booking Updated: ${booking.title}`,
        html,
      });
    }
  } catch (error) {
    console.error('Failed to send booking updated email:', error);
  }
}

export async function sendBookingCancelledEmail(
  userEmail: string,
  userName: string,
  booking: {
    title: string;
    startTime: Date;
    endTime: Date;
    room: { name: string };
  }
) {
  const subject = 'Meeting Room Booking Cancelled';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Booking Cancelled</h2>
      <p>Hi ${userName},</p>
      <p>Your meeting room booking has been cancelled:</p>
      <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Title:</strong> ${booking.title}</p>
        <p style="margin: 5px 0;"><strong>Room:</strong> ${booking.room.name}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formatDateTime(booking.startTime)}</p>
        <p style="margin: 5px 0;"><strong>Duration:</strong> ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</p>
      </div>
      <p>Thank you for using Room Reserve!</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: 'Info@smartupacademy.org',
      to: userEmail,
      subject,
      html,
    });

    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      await transporter.sendMail({
        from: 'Info@smartupacademy.org',
        to: process.env.ADMIN_NOTIFICATION_EMAIL || 'Info@smartupacademy.org',
        subject: `Booking Cancelled: ${booking.title}`,
        html,
      });
    }
  } catch (error) {
    console.error('Failed to send booking cancelled email:', error);
  }
}
