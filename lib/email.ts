import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendConfirmationEmail(
  to: string,
  reservation: {
    title: string
    roomName: string
    startTime: Date
    endTime: Date
  }
) {
  const startDate = new Date(reservation.startTime).toLocaleString()
  const endDate = new Date(reservation.endTime).toLocaleString()

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Room Reservation Confirmed: ${reservation.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Room Reservation Confirmed</h2>
        <p>Your room reservation has been successfully confirmed.</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${reservation.title}</h3>
          <p><strong>Room:</strong> ${reservation.roomName}</p>
          <p><strong>Start:</strong> ${startDate}</p>
          <p><strong>End:</strong> ${endDate}</p>
        </div>

        <p>You will receive a reminder 15 minutes before your reservation.</p>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you need to cancel or modify this reservation, please log in to your account.
        </p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Confirmation email sent to:', to)
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    throw error
  }
}

export async function sendReminderEmail(
  to: string,
  reservation: {
    title: string
    roomName: string
    startTime: Date
    location?: string
  }
) {
  const startDate = new Date(reservation.startTime).toLocaleString()

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Reminder: ${reservation.title} in 15 minutes`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Upcoming Meeting Reminder</h2>
        <p>This is a reminder that your meeting starts in 15 minutes.</p>

        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <h3 style="margin-top: 0;">${reservation.title}</h3>
          <p><strong>Room:</strong> ${reservation.roomName}</p>
          <p><strong>Time:</strong> ${startDate}</p>
          ${reservation.location ? `<p><strong>Location:</strong> ${reservation.location}</p>` : ''}
        </div>

        <p>See you there!</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Reminder email sent to:', to)
  } catch (error) {
    console.error('Error sending reminder email:', error)
    throw error
  }
}
