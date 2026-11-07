import { getBusinessSettings } from "@/server/repositories/serviceRepository";

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Dispatch an email via Resend API
 */
async function sendViaResend(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Vantage Wealth <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[EMAIL DISPATCH - DEV SIMULATION] To: ${Array.isArray(payload.to) ? payload.to.join(", ") : payload.to} | Subject: ${payload.subject}`);
    return { success: true, id: "simulated_dev_id" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        reply_to: payload.replyTo,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend API returned error:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }

    return { success: true, id: data.id };
  } catch (err: any) {
    console.error("Resend network dispatch failed:", err);
    return { success: false, error: err.message || "Network error sending email" };
  }
}

/**
 * 1. Admin Notification for Contact Enquiry
 */
export async function sendContactNotificationToAdmin(enquiry: {
  fullName: string;
  email: string;
  phone: string;
  subject?: string | null;
  message: string;
  createdAt?: string;
}): Promise<void> {
  const settings = await getBusinessSettings();
  const recipient = process.env.ADVISORY_NOTIFICATION_EMAIL || settings.email || "hello@vantagewealth.in";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F5F0; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5DFD5; border-radius: 4px; overflow: hidden; }
          .header { background-color: #172B46; padding: 24px 32px; color: #FFFFFF; }
          .gold-bar { height: 3px; background-color: #B08D57; width: 100%; }
          .content { padding: 32px; color: #172B46; }
          .field { margin-bottom: 16px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #B08D57; font-weight: bold; margin-bottom: 4px; }
          .value { font-size: 14px; color: #172B46; line-height: 1.5; }
          .message-box { background-color: #F7F5F0; border-left: 3px solid #B08D57; padding: 16px; font-size: 14px; margin-top: 16px; }
          .footer { padding: 16px 32px; background-color: #F7F5F0; font-size: 12px; color: #172B46; opacity: 0.7; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 20px; font-weight: 500;">New Advisory Contact Enquiry</h2>
            <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.8;">Vantage Wealth Client Desk Alert</p>
          </div>
          <div class="gold-bar"></div>
          <div class="content">
            <div class="field">
              <div class="label">Client Name</div>
              <div class="value">${enquiry.fullName}</div>
            </div>
            <div class="field">
              <div class="label">Email Address</div>
              <div class="value"><a href="mailto:${enquiry.email}">${enquiry.email}</a></div>
            </div>
            <div class="field">
              <div class="label">Contact Phone</div>
              <div class="value"><a href="tel:${enquiry.phone}">${enquiry.phone}</a></div>
            </div>
            <div class="field">
              <div class="label">Subject</div>
              <div class="value">${enquiry.subject || "General Advisory Inquiry"}</div>
            </div>
            <div class="field">
              <div class="label">Inquiry Details</div>
              <div class="message-box">${enquiry.message.replace(/\n/g, "<br/>")}</div>
            </div>
          </div>
          <div class="footer">
            Submitted at ${enquiry.createdAt || new Date().toLocaleString()} &bull; Vantage Wealth Admin Notification Engine
          </div>
        </div>
      </body>
    </html>
  `;

  await sendViaResend({
    to: recipient,
    subject: `[Enquiry Alert] ${enquiry.subject || "New Inquiry"} - ${enquiry.fullName}`,
    html,
    replyTo: enquiry.email,
  });
}

/**
 * 2. Client Acknowledgement for Contact Enquiry
 */
export async function sendContactAcknowledgementToClient(enquiry: {
  fullName: string;
  email: string;
}): Promise<void> {
  const settings = await getBusinessSettings();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F5F0; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5DFD5; border-radius: 4px; overflow: hidden; }
          .header { background-color: #172B46; padding: 28px 32px; color: #FFFFFF; text-align: center; }
          .gold-bar { height: 3px; background-color: #B08D57; width: 100%; }
          .content { padding: 32px; color: #172B46; font-size: 14px; line-height: 1.6; }
          .footer { padding: 20px 32px; background-color: #F7F5F0; font-size: 12px; color: #172B46; opacity: 0.7; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 22px; font-weight: normal; color: #FFFFFF;">VANTAGE WEALTH</h2>
            <p style="margin: 6px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #B08D57;">A Clearer Perspective on Your Wealth</p>
          </div>
          <div class="gold-bar"></div>
          <div class="content">
            <p>Dear ${enquiry.fullName},</p>
            <p>Thank you for reaching out to Vantage Wealth. We have received your inquiry at our Senior Advisory Desk.</p>
            <p>One of our senior wealth advisors is reviewing your communication and will reach out to you within one business day to address your requirements.</p>
            <p>If your inquiry requires immediate coordination, you may also reach our principal advisory desk directly at <strong>${settings.phone}</strong>.</p>
            <br/>
            <p style="margin-bottom: 0;">Warm regards,<br/><strong>Client Advisory Services</strong><br/>Vantage Wealth</p>
          </div>
          <div class="footer">
            &copy; 2026 Vantage Wealth. All communications are confidential.<br/>${settings.address}
          </div>
        </div>
      </body>
    </html>
  `;

  await sendViaResend({
    to: enquiry.email,
    subject: `We have received your message | Vantage Wealth`,
    html,
  });
}

/**
 * 3. Admin Notification for Consultation Request
 */
export async function sendConsultationNotificationToAdmin(consultation: {
  fullName: string;
  email: string;
  phone: string;
  serviceSlug?: string | null;
  preferredMode?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  message?: string | null;
  createdAt?: string;
}): Promise<void> {
  const settings = await getBusinessSettings();
  const recipient = process.env.ADVISORY_NOTIFICATION_EMAIL || settings.email || "hello@vantagewealth.in";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F5F0; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5DFD5; border-radius: 4px; overflow: hidden; }
          .header { background-color: #172B46; padding: 24px 32px; color: #FFFFFF; }
          .gold-bar { height: 3px; background-color: #B08D57; width: 100%; }
          .content { padding: 32px; color: #172B46; }
          .badge { display: inline-block; background-color: #B08D57; color: #172B46; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 2px; text-transform: uppercase; margin-bottom: 16px; }
          .field { margin-bottom: 14px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #B08D57; font-weight: bold; }
          .value { font-size: 14px; color: #172B46; line-height: 1.5; margin-top: 2px; }
          .highlight { background-color: #F7F5F0; padding: 14px; border-left: 3px solid #B08D57; margin-top: 14px; font-size: 13px; }
          .footer { padding: 16px 32px; background-color: #F7F5F0; font-size: 12px; color: #172B46; opacity: 0.7; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 20px; font-weight: normal; color: #FFFFFF;">Consultation Booking Request</h2>
            <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.8;">Action Required: Senior Advisor Schedule Confirmation</p>
          </div>
          <div class="gold-bar"></div>
          <div class="content">
            <span class="badge">Discovery Session</span>
            <div class="field">
              <div class="label">Prospective Client</div>
              <div class="value"><strong>${consultation.fullName}</strong></div>
            </div>
            <div class="field">
              <div class="label">Contact Info</div>
              <div class="value">Email: <a href="mailto:${consultation.email}">${consultation.email}</a><br/>Phone: <a href="tel:${consultation.phone}">${consultation.phone}</a></div>
            </div>
            <div class="field">
              <div class="label">Practice Area / Service</div>
              <div class="value">${consultation.serviceSlug || "Comprehensive Wealth Review"}</div>
            </div>
            <div class="field">
              <div class="label">Meeting Preference</div>
              <div class="value">${consultation.preferredMode === "IN_PERSON" ? "In-Person (New Delhi Desk)" : "Virtual Video Consultation"}</div>
            </div>
            <div class="field">
              <div class="label">Requested Date & Window</div>
              <div class="value">Date: ${consultation.preferredDate || "Earliest Availability"}<br/>Time: ${consultation.preferredTime || "Standard Advisory Hours"}</div>
            </div>
            ${
              consultation.message
                ? `<div class="field"><div class="label">Client Notes & Objectives</div><div class="highlight">${consultation.message.replace(/\n/g, "<br/>")}</div></div>`
                : ""
            }
          </div>
          <div class="footer">
            Submitted at ${consultation.createdAt || new Date().toLocaleString()} &bull; Vantage Wealth Admin Console
          </div>
        </div>
      </body>
    </html>
  `;

  await sendViaResend({
    to: recipient,
    subject: `[Consultation Request] ${consultation.fullName} - ${consultation.serviceSlug || "Discovery"}`,
    html,
    replyTo: consultation.email,
  });
}

/**
 * 4. Client Acknowledgement for Consultation Request
 */
export async function sendConsultationAcknowledgementToClient(consultation: {
  fullName: string;
  email: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  preferredMode?: string | null;
}): Promise<void> {
  const settings = await getBusinessSettings();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F5F0; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5DFD5; border-radius: 4px; overflow: hidden; }
          .header { background-color: #172B46; padding: 28px 32px; color: #FFFFFF; text-align: center; }
          .gold-bar { height: 3px; background-color: #B08D57; width: 100%; }
          .content { padding: 32px; color: #172B46; font-size: 14px; line-height: 1.6; }
          .details-card { background-color: #F7F5F0; border-left: 3px solid #B08D57; padding: 16px; margin: 20px 0; font-size: 13px; }
          .footer { padding: 20px 32px; background-color: #F7F5F0; font-size: 12px; color: #172B46; opacity: 0.7; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 22px; font-weight: normal; color: #FFFFFF;">VANTAGE WEALTH</h2>
            <p style="margin: 6px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #B08D57;">Confidential Discovery Session</p>
          </div>
          <div class="gold-bar"></div>
          <div class="content">
            <p>Dear ${consultation.fullName},</p>
            <p>Thank you for requesting a discovery consultation with Vantage Wealth. We have safely received your scheduling preferences.</p>
            
            <div class="details-card">
              <strong>Requested Meeting Summary:</strong><br/>
              &bull; Format: ${consultation.preferredMode === "IN_PERSON" ? "In-Person Advisory" : "Virtual Video Consultation"}<br/>
              &bull; Preferred Date: ${consultation.preferredDate || "To be confirmed"}<br/>
              &bull; Preferred Window: ${consultation.preferredTime || "Standard Advisory Hours"}
            </div>

            <p><strong>Next Steps:</strong> A senior advisor will review your requested time against current availability and reach out to you shortly via phone or email to finalize your calendar appointment.</p>
            <p>Please note that this initial message confirms receipt of your scheduling request; our advisory desk will confirm the finalized session details directly with you.</p>
            <br/>
            <p style="margin-bottom: 0;">With high regard,<br/><strong>Senior Advisory Desk</strong><br/>Vantage Wealth</p>
          </div>
          <div class="footer">
            &copy; 2026 Vantage Wealth &bull; ${settings.address} &bull; ${settings.phone}
          </div>
        </div>
      </body>
    </html>
  `;

  await sendViaResend({
    to: consultation.email,
    subject: `Your Consultation Request has been Received | Vantage Wealth`,
    html,
  });
}
