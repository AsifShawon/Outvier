import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailService = {
  async sendWelcomeEmail(to: string, name: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #1e3a8a;">Welcome to Outvier, ${name}!</h1>
        <p>Thank you for joining Australia's leading university comparison platform.</p>
        <p>Complete your profile to get personalized fit scores for your dream programs.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard/profile" style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Your Profile</a>
        </div>
        <p style="color: #666; font-size: 12px;">The Outvier Team</p>
      </div>
    `;
    
    return transporter.sendMail({
      from: '"Outvier Platform" <noreply@outvier.com>',
      to,
      subject: 'Welcome to Outvier!',
      html,
    });
  },

  async sendApplicationReminder(to: string, programName: string, deadline: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">Application Deadline Approaching</h2>
        <p>Your application for <strong>${programName}</strong> is due on <strong>${deadline}</strong>.</p>
        <p>Don't forget to submit your documents on time!</p>
        <div style="margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard/tracker" style="color: #2563eb; font-weight: bold;">View Application Tracker</a>
        </div>
      </div>
    `;

    return transporter.sendMail({
      from: '"Outvier Alerts" <alerts@outvier.com>',
      to,
      subject: `Reminder: ${programName} Deadline`,
      html,
    });
  }
};
