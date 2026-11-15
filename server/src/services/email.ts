import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Configure SMTP if provided in environment
const createSmtpTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  return null;
};

const smtpTransporter = createSmtpTransporter();

let etherealTransporter: any = null;
const getEtherealTransporter = async () => {
  if (etherealTransporter) return etherealTransporter;
  try {
    const testAccount = await nodemailer.createTestAccount();
    etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log(`[Email Service] Initialized Ethereal SMTP test mailbox: ${testAccount.user}`);
    return etherealTransporter;
  } catch (err) {
    console.warn('[Email Service] Failed to create Ethereal test account:', err);
    return null;
  }
};

interface StatusEmailMeta {
  subject: string;
  badge: string;
  badgeColor: string;
  headerText: string;
  message: string;
}

const getStatusEmailMeta = (publicId: string, status: string): StatusEmailMeta => {
  switch (status.toUpperCase()) {
    case 'REPORTED':
      return {
        subject: `[CivicAI] Ticket Registered: #${publicId}`,
        badge: 'REPORTED',
        badgeColor: '#C2683A',
        headerText: 'Issue Successfully Registered',
        message: 'Your report has been logged and assigned an audit ticket. It is now queued for municipal department triage.'
      };
    case 'UNDER_REVIEW':
      return {
        subject: `[CivicAI] Under Review: #${publicId}`,
        badge: 'UNDER REVIEW',
        badgeColor: '#E0B84F',
        headerText: 'Under Municipal Review',
        message: 'A municipal triage officer is reviewing the severity and routing your ticket to the responsible field department.'
      };
    case 'ASSIGNED':
      return {
        subject: `[CivicAI] Worker Dispatched: #${publicId}`,
        badge: 'WORKER ASSIGNED',
        badgeColor: '#3B82F6',
        headerText: 'Field Team Dispatched',
        message: 'A certified field worker has been assigned to your ticket with dispatch instructions.'
      };
    case 'IN_PROGRESS':
      return {
        subject: `[CivicAI] Work In Progress: #${publicId}`,
        badge: 'IN PROGRESS',
        badgeColor: '#F59E0B',
        headerText: 'Repairs Started On-Site',
        message: 'The field crew has arrived on site and active remediation work is now in progress.'
      };
    case 'RESOLVED':
      return {
        subject: `[CivicAI] Repair Completed: #${publicId}`,
        badge: 'REPAIRS COMPLETED',
        badgeColor: '#10B981',
        headerText: 'Field Repairs Finished',
        message: 'The worker has completed repairs and submitted photographic evidence for municipal QA review.'
      };
    case 'VERIFIED':
      return {
        subject: `🎉 [CivicAI] Resolution Certified: #${publicId} Officially Resolved`,
        badge: 'RESOLUTION VERIFIED',
        badgeColor: '#059669',
        headerText: 'Resolution Certified & Signed Off',
        message: 'A municipal officer has inspected the photographic proof and officially certified the resolution. Thank you for making our city safer!'
      };
    case 'REOPENED':
      return {
        subject: `[CivicAI] Ticket Reopened: #${publicId}`,
        badge: 'REOPENED',
        badgeColor: '#EF4444',
        headerText: 'Ticket Reopened for Further Work',
        message: 'Quality verification found that additional field remediation is needed. A worker has been re-dispatched.'
      };
    case 'REJECTED':
      return {
        subject: `[CivicAI] Ticket Status: #${publicId}`,
        badge: 'CLOSED',
        badgeColor: '#6B7280',
        headerText: 'Ticket Status Update',
        message: 'Your report was reviewed by municipal officers and marked non-actionable.'
      };
    default:
      return {
        subject: `[CivicAI] Update on Ticket #${publicId}`,
        badge: status,
        badgeColor: '#C2683A',
        headerText: 'Ticket Status Update',
        message: `Your ticket has transitioned to ${status}.`
      };
  }
};

export const sendStatusUpdateEmail = async (
  toEmail: string,
  publicId: string,
  newStatus: string,
  notes?: string,
  userId?: string
) => {
  const meta = getStatusEmailMeta(publicId, newStatus);
  const frontendUrl = process.env.FRONTEND_URL || 'https://civicai-demo.vercel.app';
  const trackUrl = `${frontendUrl}/track/${publicId}`;

  // 1. In-app notification creation
  if (userId) {
    try {
      const recent = await prisma.notification.findFirst({
        where: {
          userId,
          link: `/track/${publicId}`,
          createdAt: { gte: new Date(Date.now() - 5000) }
        }
      });
      if (!recent) {
        await prisma.notification.create({
          data: {
            userId,
            title: meta.headerText,
            message: notes ? `${meta.message} (Note: ${notes})` : meta.message,
            link: `/track/${publicId}`
          }
        });
      }
    } catch (e) {
      console.warn('Failed to record in-app notification:', e);
    }
  }

  // 2. Build email template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${meta.subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F6F0; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="580px" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #EFECE6;">
              <!-- Header Bar -->
              <tr>
                <td style="background-color: #1F1D1A; padding: 24px 32px; text-align: left;">
                  <span style="font-size: 22px; font-weight: bold; color: #FFFFFF; letter-spacing: -0.5px;">Civic<span style="color: #C2683A;">AI</span></span>
                  <span style="font-size: 11px; color: #D5D1C8; margin-left: 12px; text-transform: uppercase; letter-spacing: 1px;">Municipal Operations</span>
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="padding: 32px 32px 20px 32px;">
                  <span style="background-color: ${meta.badgeColor}15; color: ${meta.badgeColor}; border: 1px solid ${meta.badgeColor}40; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8px;">
                    ${meta.badge}
                  </span>
                  <h1 style="color: #1F1D1A; font-size: 22px; margin: 16px 0 8px 0; font-weight: 700; line-height: 1.3;">
                    ${meta.headerText}
                  </h1>
                  <p style="color: #555; font-size: 14px; margin: 0; font-family: monospace;">
                    Ticket Reference: <strong>#${publicId}</strong>
                  </p>
                </td>
              </tr>

              <!-- Body Copy -->
              <tr>
                <td style="padding: 0 32px 24px 32px;">
                  <p style="color: #4A463F; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                    ${meta.message}
                  </p>
                  
                  ${notes ? `
                  <div style="background-color: #F8F6F0; border-left: 4px solid ${meta.badgeColor}; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; color: #2C2926; font-size: 13px; font-style: italic;">
                      &ldquo;${notes}&rdquo;
                    </p>
                  </div>
                  ` : ''}

                  <!-- Call to action button -->
                  <div style="text-align: center; padding: 24px 0 12px 0;">
                    <a href="${trackUrl}" target="_blank" style="background-color: #C2683A; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(194, 104, 58, 0.25);">
                      View Audit Track & Evidence &rarr;
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #FAF8F5; padding: 20px 32px; border-top: 1px solid #EFECE6; text-align: center;">
                  <p style="margin: 0; color: #8C867A; font-size: 11px; line-height: 1.5;">
                    This is an automated dispatch from CivicAI Public Infrastructure System.<br>
                    You are receiving this update because you reported or subscribed to ticket #${publicId}.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // 3. Dispatch via SMTP or Resend
  let sentVia = 'none';

  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: process.env.SMTP_FROM || `"CivicAI Updates" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: meta.subject,
        html
      });
      sentVia = 'smtp';
      console.log(`[Email Service - SMTP] Sent status email to ${toEmail} for #${publicId} [${newStatus}]`);
    } catch (smtpErr) {
      console.error('[Email Service - SMTP Error]:', smtpErr);
    }
  }

  if (sentVia === 'none' && resend) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'CivicAI Updates <onboarding@resend.dev>',
        to: toEmail,
        subject: meta.subject,
        html
      });
      sentVia = 'resend';
      console.log(`[Email Service - Resend] Sent status email to ${toEmail} for #${publicId} [${newStatus}]`);
    } catch (resendErr: any) {
      console.error('[Email Service - Resend Error]:', resendErr?.message || resendErr);
    }
  }

  let previewUrl: string | false = false;
  if (sentVia === 'none') {
    try {
      const ethereal = await getEtherealTransporter();
      if (ethereal) {
        const info = await ethereal.sendMail({
          from: '"CivicAI Operations" <system@civicai.gov>',
          to: toEmail,
          subject: meta.subject,
          html
        });
        sentVia = 'ethereal';
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Email Service - Ethereal] Delivered status email to ${toEmail} for #${publicId} [${newStatus}]`);
        if (previewUrl) {
          console.log(`[Email Service - Web Preview]: ${previewUrl}`);
        }
      }
    } catch (etherealErr) {
      console.error('[Email Service - Ethereal Error]:', etherealErr);
    }
  }

  // 4. Log in Audit Log so administrators can inspect all sent communications
  try {
    const complaint = await prisma.complaint.findUnique({ where: { publicId }, select: { id: true } });
    if (complaint) {
      await prisma.auditLog.create({
        data: {
          complaintId: complaint.id,
          action: 'NOTIFICATION_SENT',
          details: JSON.stringify({
            recipient: toEmail,
            status: newStatus,
            transport: sentVia,
            subject: meta.subject,
            previewUrl: previewUrl || undefined
          })
        }
      });
    }
  } catch (auditErr) {
    // Non-fatal
  }

  console.log(`[EMAIL DISPATCH LOG] To: ${toEmail} | Ticket: #${publicId} | Status: ${newStatus} | Transport: ${sentVia}${previewUrl ? ` | Preview: ${previewUrl}` : ''}`);
};
