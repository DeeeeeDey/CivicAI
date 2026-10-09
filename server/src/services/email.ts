import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export const sendStatusUpdateEmail = async (
  toEmail: string,
  publicId: string,
  newStatus: string,
  notes?: string
) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Skipping email notification - RESEND_API_KEY not configured.");
    return;
  }

  const subject = `Update on your CivicAI Ticket: #${publicId}`;
  
  // Format status for humans (e.g. IN_PROGRESS -> In Progress)
  const readableStatus = newStatus.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  
  const html = `
    <div style="font-family: sans-serif; max-w-xl; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #C05A44; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">CivicAI</h1>
      </div>
      <div style="padding: 30px; background-color: #fafafa;">
        <h2 style="color: #333; margin-top: 0;">Ticket Update</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          Hello,<br><br>
          There has been an update regarding your reported issue (<strong>#${publicId}</strong>). 
          The status is now marked as: <strong style="color: #C05A44;">${readableStatus}</strong>.
        </p>
        
        ${notes ? `
        <div style="background-color: #fff; border-left: 4px solid #C05A44; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #666; font-style: italic;">"${notes}"</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://civicai-demo.vercel.app'}/track/${publicId}" 
             style="background-color: #C05A44; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
            Track Your Ticket Live
          </a>
        </div>
      </div>
      <div style="background-color: #eee; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        <p style="margin: 0;">This is an automated message from CivicAI. Please do not reply.</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: 'CivicAI Updates <onboarding@resend.dev>', // resend's testing domain
      to: toEmail,
      subject,
      html
    });
    console.log(`Email sent to ${toEmail} for ticket ${publicId}`);
  } catch (err) {
    console.error("Failed to send email via Resend:", err);
  }
};
