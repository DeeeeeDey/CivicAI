import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Configure SMTP if provided in environment
const getSmtpTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
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
  headerText: string;
  message: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  bannerBg: string;
  buttonBg: string;
  buttonText: string;
}

const getStatusEmailMeta = (publicId: string, status: string): StatusEmailMeta => {
  switch (status.toUpperCase()) {
    case 'REPORTED':
      return {
        subject: `[CivicAI] Ticket Registered: #${publicId}`,
        badge: 'REPORTED',
        headerText: 'Issue Successfully Registered',
        message: 'Your report has been logged in the municipal ledger and assigned an audit ticket. It is now queued for municipal department triage.',
        badgeBg: '#FFF7ED',
        badgeText: '#9A3412',
        badgeBorder: '#FDBA74',
        accentColor: '#C2683A',
        bannerBg: '#FFFBF7',
        buttonBg: '#C2683A',
        buttonText: '#FFFFFF'
      };
    case 'UNDER_REVIEW':
      return {
        subject: `[CivicAI] Under Review: #${publicId}`,
        badge: 'UNDER REVIEW',
        headerText: 'Under Municipal Review',
        message: 'A municipal triage officer is reviewing the severity assessment and dispatching your ticket to the responsible field department.',
        badgeBg: '#FEF3C7',
        badgeText: '#92400E',
        badgeBorder: '#FCD34D',
        accentColor: '#D97706',
        bannerBg: '#FFFDF5',
        buttonBg: '#D97706',
        buttonText: '#FFFFFF'
      };
    case 'ASSIGNED':
      return {
        subject: `[CivicAI] Worker Dispatched: #${publicId}`,
        badge: 'WORKER ASSIGNED',
        headerText: 'Field Team Dispatched',
        message: 'A certified field technician has been assigned to your ticket with dispatch instructions and is en route.',
        badgeBg: '#EFF6FF',
        badgeText: '#1E40AF',
        badgeBorder: '#93C5FD',
        accentColor: '#2563EB',
        bannerBg: '#F8FAFC',
        buttonBg: '#2563EB',
        buttonText: '#FFFFFF'
      };
    case 'IN_PROGRESS':
      return {
        subject: `[CivicAI] Work In Progress: #${publicId}`,
        badge: 'IN PROGRESS',
        headerText: 'Repairs Started On-Site',
        message: 'The municipal crew has arrived on site and active remediation work is currently underway.',
        badgeBg: '#FFFBEB',
        badgeText: '#B45309',
        badgeBorder: '#FDE68A',
        accentColor: '#F59E0B',
        bannerBg: '#FFFDF7',
        buttonBg: '#D97706',
        buttonText: '#FFFFFF'
      };
    case 'RESOLVED':
      return {
        subject: `[CivicAI] Repair Completed: #${publicId}`,
        badge: 'REPAIRS COMPLETED',
        headerText: 'Field Repairs Finished',
        message: 'The field worker has finished physical repairs and uploaded photographic proof for municipal quality inspection.',
        badgeBg: '#ECFDF5',
        badgeText: '#065F46',
        badgeBorder: '#A7F3D0',
        accentColor: '#10B981',
        bannerBg: '#F6FDF9',
        buttonBg: '#059669',
        buttonText: '#FFFFFF'
      };
    case 'VERIFIED':
      return {
        subject: `🎉 [CivicAI] Resolution Certified: #${publicId} Officially Resolved`,
        badge: 'RESOLUTION CERTIFIED',
        headerText: 'Resolution Certified & Signed Off',
        message: 'A municipal officer has inspected the photographic proof and officially certified the resolution. Thank you for making our city safer!',
        badgeBg: '#DEF7EC',
        badgeText: '#03543F',
        badgeBorder: '#31C48D',
        accentColor: '#059669',
        bannerBg: '#F4FBF7',
        buttonBg: '#059669',
        buttonText: '#FFFFFF'
      };
    case 'REOPENED':
      return {
        subject: `[CivicAI] Ticket Reopened: #${publicId}`,
        badge: 'REOPENED',
        headerText: 'Ticket Reopened for Further Remediation',
        message: 'Quality verification found that additional field remediation is needed. A worker has been re-dispatched.',
        badgeBg: '#FEF2F2',
        badgeText: '#991B1B',
        badgeBorder: '#FECACA',
        accentColor: '#DC2626',
        bannerBg: '#FFF8F8',
        buttonBg: '#DC2626',
        buttonText: '#FFFFFF'
      };
    case 'REJECTED':
      return {
        subject: `[CivicAI] Ticket Status: #${publicId}`,
        badge: 'CLOSED',
        headerText: 'Ticket Status Update',
        message: 'Your report was reviewed by municipal officers and marked non-actionable or identified as a duplicate.',
        badgeBg: '#F3F4F6',
        badgeText: '#374151',
        badgeBorder: '#D1D5DB',
        accentColor: '#6B7280',
        bannerBg: '#F9FAFB',
        buttonBg: '#4B5563',
        buttonText: '#FFFFFF'
      };
    default:
      return {
        subject: `[CivicAI] Update on Ticket #${publicId}`,
        badge: status,
        headerText: 'Ticket Status Update',
        message: `Your ticket has transitioned to ${status}.`,
        badgeBg: '#FFF7ED',
        badgeText: '#9A3412',
        badgeBorder: '#FDBA74',
        accentColor: '#C2683A',
        bannerBg: '#FFFBF7',
        buttonBg: '#C2683A',
        buttonText: '#FFFFFF'
      };
  }
};

export interface DispatchEmailOptions {
  toEmail: string;
  publicId: string;
  meta: StatusEmailMeta;
  notes?: string;
  userId?: string;
  customNotificationTitle?: string;
  customNotificationMessage?: string;
}

export const sendDispatchedEmail = async ({
  toEmail,
  publicId,
  meta,
  notes,
  userId,
  customNotificationTitle,
  customNotificationMessage
}: DispatchEmailOptions) => {
  const cleanEmail = (toEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    console.warn(`[Email Service] Skipped sending email: invalid recipient "${toEmail}" for #${publicId}`);
    return;
  }
  const frontendUrl = process.env.FRONTEND_URL || 'https://civic-ai-2v9u.vercel.app';
  const cleanFrontendUrl = frontendUrl.replace(/\/+$/, '');
  const trackUrl = `${cleanFrontendUrl}/track/${publicId}`;

  // 1. In-app notification creation
  if (userId) {
    try {
      const notifTitle = customNotificationTitle || meta.headerText;
      const notifMsg = customNotificationMessage || (notes ? `${meta.message} (Note: ${notes})` : meta.message);
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
            title: notifTitle,
            message: notifMsg,
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
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${meta.subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8F6F0; padding: 36px 14px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #EFECE6;">
              <!-- Colored Accent Top Bar -->
              <tr>
                <td style="height: 6px; background-color: ${meta.accentColor}; font-size: 0; line-height: 0;">&nbsp;</td>
              </tr>

              <!-- Header Bar -->
              <tr>
                <td style="background-color: #1F1D1A; padding: 22px 32px; text-align: left;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left">
                        <span style="font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">Civic<span style="color: #C2683A;">AI</span></span>
                        <span style="font-size: 11px; color: #D5D1C8; margin-left: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Municipal Operations</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Status Banner with Tinted Background -->
              <tr>
                <td style="padding: 26px 32px 20px 32px; background-color: ${meta.bannerBg}; border-bottom: 1px solid #EFECE6;">
                  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                    <tr>
                      <td style="background-color: ${meta.badgeBg}; color: ${meta.badgeText}; border: 1px solid ${meta.badgeBorder}; padding: 5px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        ${meta.badge}
                      </td>
                    </tr>
                  </table>
                  <h1 style="color: #1F1D1A; font-size: 21px; margin: 0 0 6px 0; font-weight: 700; line-height: 1.35;">
                    ${meta.headerText}
                  </h1>
                  <p style="color: #7C7063; font-size: 13px; margin: 0; font-family: monospace;">
                    Ticket Reference: <strong style="color: #1F1D1A;">#${publicId}</strong>
                  </p>
                </td>
              </tr>

              <!-- Body Copy -->
              <tr>
                <td style="padding: 28px 32px 24px 32px;">
                  <p style="color: #4A463F; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                    ${meta.message}
                  </p>
                  
                  ${notes ? `
                  <div style="background-color: #F8F6F0; border-left: 4px solid ${meta.accentColor}; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; color: #2C2926; font-size: 13px; line-height: 1.5; font-style: italic;">
                      &ldquo;${notes}&rdquo;
                    </p>
                  </div>
                  ` : ''}

                  <!-- Bulletproof CTA Button -->
                  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 28px auto 14px auto;">
                    <tr>
                      <td align="center" style="background-color: ${meta.buttonBg}; border-radius: 10px;">
                        <a href="${trackUrl}" target="_blank" style="background-color: ${meta.buttonBg}; color: ${meta.buttonText}; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: 0.2px;">
                          View Live Status &amp; Evidence &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Direct clickable text link -->
                  <p style="color: #8C867A; font-size: 11px; margin: 12px 0 0 0; text-align: center; word-break: break-all; line-height: 1.4;">
                    Direct link: <a href="${trackUrl}" target="_blank" style="color: ${meta.accentColor}; text-decoration: underline;">${trackUrl}</a>
                  </p>
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

  // 3. Dispatch via SMTP, Resend, or Ethereal test mailbox
  let sentVia = 'none';
  let previewUrl: string | false = false;

  const activeSmtp = getSmtpTransporter();
  if (activeSmtp) {
    try {
      await activeSmtp.sendMail({
        from: process.env.SMTP_FROM || `"CivicAI Updates" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
        to: cleanEmail,
        subject: meta.subject,
        html
      });
      sentVia = 'smtp';
      console.log(`[Email Service - SMTP] Sent email to ${cleanEmail} for #${publicId}`);
    } catch (smtpErr) {
      console.error('[Email Service - SMTP Error]:', smtpErr);
    }
  }

  if (sentVia === 'none' && resend) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'CivicAI Updates <onboarding@resend.dev>',
        to: cleanEmail,
        subject: meta.subject,
        html
      });
      sentVia = 'resend';
      console.log(`[Email Service - Resend] Sent email to ${cleanEmail} for #${publicId}`);
    } catch (resendErr: any) {
      console.warn(`[Email Service - Resend Notice] Failed delivering to ${cleanEmail}: ${resendErr?.message || resendErr}.`);
    }
  }

  if (sentVia === 'none') {
    try {
      const ethereal = await getEtherealTransporter();
      if (ethereal) {
        const info = await ethereal.sendMail({
          from: '"CivicAI Operations" <system@civicai.gov>',
          to: cleanEmail,
          subject: meta.subject,
          html
        });
        sentVia = 'ethereal';
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Email Service - Ethereal Test Mailbox] Delivered email to ${cleanEmail} for #${publicId}`);
        if (previewUrl) {
          console.log(`[Email Service - Web Preview]: ${previewUrl}`);
        }
      }
    } catch (etherealErr) {
      console.error('[Email Service - Ethereal Error]:', etherealErr);
    }
  }

  // 4. Update or create in-app notification with preview URL if available
  if (userId) {
    try {
      const notifTitle = customNotificationTitle || meta.headerText;
      const baseMsg = customNotificationMessage || (notes ? `${meta.message} (Note: ${notes})` : meta.message);
      const fullMessage = previewUrl ? `${baseMsg} [Test Email Web Preview: ${previewUrl}]` : baseMsg;

      const recent = await prisma.notification.findFirst({
        where: {
          userId,
          link: `/track/${publicId}`,
          createdAt: { gte: new Date(Date.now() - 10000) }
        }
      });
      if (!recent) {
        await prisma.notification.create({
          data: {
            userId,
            title: notifTitle,
            message: fullMessage,
            link: `/track/${publicId}`
          }
        });
      }
    } catch (e) {
      console.warn('Failed to record in-app notification:', e);
    }
  }

  // 5. Log in Audit Log
  try {
    const complaint = await prisma.complaint.findUnique({ where: { publicId }, select: { id: true } });
    if (complaint) {
      await prisma.auditLog.create({
        data: {
          complaintId: complaint.id,
          action: 'NOTIFICATION_SENT',
          details: JSON.stringify({
            recipient: cleanEmail,
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

  console.log(`[EMAIL DISPATCH LOG] To: ${cleanEmail} | Ticket: #${publicId} | Transport: ${sentVia}${previewUrl ? ` | Preview: ${previewUrl}` : ''}`);
};

export const sendStatusUpdateEmail = async (
  toEmail: string,
  publicId: string,
  newStatus: string,
  notes?: string,
  userId?: string
) => {
  const meta = getStatusEmailMeta(publicId, newStatus);
  return sendDispatchedEmail({ toEmail, publicId, meta, notes, userId });
};

export const sendClassificationUpdateEmail = async (
  toEmail: string,
  publicId: string,
  oldCategory: string,
  newCategory: string,
  reason?: string,
  userId?: string
) => {
  const meta: StatusEmailMeta = {
    subject: `[CivicAI] Category Corrected: #${publicId}`,
    badge: 'CATEGORY UPDATED',
    headerText: 'Report Category Corrected by Officer',
    message: `A municipal triage officer reviewed your complaint #${publicId} and corrected its classification from "${oldCategory || 'Unclassified'}" to "${newCategory}". This ensures accurate dispatch to the responsible department.`,
    badgeBg: '#F0FDF4',
    badgeText: '#166534',
    badgeBorder: '#BBF7D0',
    accentColor: '#16A34A',
    bannerBg: '#F7FEFA',
    buttonBg: '#16A34A',
    buttonText: '#FFFFFF'
  };

  const notificationMessage = `Officer updated report #${publicId} category from "${oldCategory || 'General'}" to "${newCategory}".${reason ? ' Reason: ' + reason : ''}`;

  return sendDispatchedEmail({
    toEmail,
    publicId,
    meta,
    notes: reason,
    userId,
    customNotificationTitle: 'Report Category Corrected',
    customNotificationMessage: notificationMessage
  });
};

export const sendDiscardUpdateEmail = async (
  toEmail: string,
  publicId: string,
  reason?: string,
  userId?: string
) => {
  const meta: StatusEmailMeta = {
    subject: `[CivicAI] Report Discarded: #${publicId}`,
    badge: 'DISCARDED / FALSE REPORT',
    headerText: 'Report Discarded by Municipal Triage',
    message: `A municipal officer reviewed your report #${publicId} and marked it as a false report, non-civic submission, or invalid problem. As it does not represent an active public civic hazard, the ticket has been closed without worker dispatch.`,
    badgeBg: '#FEF2F2',
    badgeText: '#991B1B',
    badgeBorder: '#FECACA',
    accentColor: '#DC2626',
    bannerBg: '#FFF8F8',
    buttonBg: '#DC2626',
    buttonText: '#FFFFFF'
  };

  const notificationMessage = `Your report #${publicId} was discarded as a false/invalid report by municipal triage.${reason ? ' Reason: ' + reason : ''}`;

  return sendDispatchedEmail({
    toEmail,
    publicId,
    meta,
    notes: reason,
    userId,
    customNotificationTitle: 'Report Discarded as False/Invalid',
    customNotificationMessage: notificationMessage
  });
};
