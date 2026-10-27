import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_EMAIL = 'info@nevoluteinc.com';

export default async function handler(req: any, res: any) {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    console.error('Unauthorized webhook attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = req.body;
    console.log('--- INCOMING WEBHOOK PAYLOAD ---', JSON.stringify(payload, null, 2));

    const { table, type, record } = payload;

    async function getRecipientEmail(userId: string) {
      if (!userId) return null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      return profile?.email;
    }

    let recipientEmail = null;
    let adminSubject = '';
    let adminHtml = '';
    let sendToUser = false;
    let userSubject = '';
    let userHtml = '';

    // ==========================================
    // 1. PROFILES (New User Signup)
    // ==========================================
    if (table === 'profiles' && type === 'INSERT') {
      adminSubject = '👤 New User Account Created';
      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #0284c7;">New User Registration</h2>
          <p>A new user has registered on Nevolute Inc.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${record?.email || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>User ID:</strong> ${record?.id}</p>
            <p style="margin: 5px 0;"><strong>Created At:</strong> ${record?.created_at || new Date().toISOString()}</p>
          </div>
        </div>
      `;
    }

    // ==========================================
    // 2. TRANSACTIONS (Topup, Withdrawal, Transfer)
    // ==========================================
    else if (table === 'transactions' && type === 'INSERT') {
      recipientEmail = await getRecipientEmail(record.user_id);
      const category = record?.category || 'transaction';

      // User notification
      sendToUser = true;
      userSubject = category === 'topup' ? 'Top-Up Successful!' : 'Transaction Alert';
      userHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Transaction Alert</h2>
          <p>Your ${category} of <strong>${record?.amount} XAF</strong> was recorded.</p>
        </div>
      `;

      // Admin alert
      adminSubject = `💰 New Transaction: ${category.toUpperCase()}`;
      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #16a34a;">New Transaction Recorded</h2>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>User ID:</strong> ${record?.user_id}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${category}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${record?.amount} XAF</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${record?.status}</p>
            <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${record?.id}</p>
          </div>
        </div>
      `;
    }

    // ==========================================
    // 3. RECEIPTS
    // ==========================================
    else if (table === 'receipts') {
      const status = record?.status;

      if (type === 'INSERT') {
        adminSubject = '🧾 New Receipt Submitted for Review';
        adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #ca8a04;">New Receipt Submission</h2>
            <p>A user has uploaded a receipt for review.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>User ID:</strong> ${record?.user_id}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> ${record?.amount} XAF</p>
              <p style="margin: 5px 0;"><strong>Receipt ID:</strong> ${record?.id}</p>
            </div>
          </div>
        `;
      } else if (type === 'UPDATE' && (status === 'approved' || status === 'rejected')) {
        recipientEmail = await getRecipientEmail(record.user_id);
        sendToUser = true;
        const isApproved = status === 'approved';
        userSubject = isApproved ? 'Receipt Approved!' : 'Receipt Rejected';
        const color = isApproved ? '#2e7d32' : '#c62828';

        userHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2>Receipt Status Update</h2>
            <p>Your receipt status is: <strong style="color: ${color}; text-transform: uppercase;">${status}</strong></p>
            ${record?.reason ? `<p><strong>Reason:</strong> ${record.reason}</p>` : ''}
          </div>
        `;
      }
    }

    // ==========================================
    // 4. KYC SUBMISSIONS
    // ==========================================
    else if (table === 'kyc_submissions') {
      const status = record?.status;

      if (type === 'INSERT') {
        adminSubject = '🛡️ New KYC Verification Submitted';
        adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #9333ea;">New KYC Submission</h2>
            <p>A user submitted identity documents for verification.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>User ID:</strong> ${record?.user_id}</p>
              <p style="margin: 5px 0;"><strong>Document Type:</strong> ${record?.document_type || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Submission ID:</strong> ${record?.id}</p>
            </div>
          </div>
        `;
      } else if (type === 'UPDATE' && (status === 'approved' || status === 'rejected')) {
        recipientEmail = await getRecipientEmail(record.user_id);
        sendToUser = true;
        const isApproved = status === 'approved';
        userSubject = isApproved ? 'KYC Verification Approved!' : 'KYC Verification Rejected';
        const color = isApproved ? '#2e7d32' : '#c62828';

        userHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2>KYC Verification Update</h2>
            <p>Your identity verification status is: <strong style="color: ${color}; text-transform: uppercase;">${status}</strong></p>
            ${record?.rejection_reason ? `<p><strong>Reason:</strong> ${record.rejection_reason}</p>` : ''}
          </div>
        `;
      }
    }

    // Dispatch Emails via Resend
    const promises = [];

    if (sendToUser && recipientEmail && userHtml) {
      console.log(`Sending USER email [${userSubject}] to: ${recipientEmail}`);
      promises.push(
        resend.emails.send({
          from: 'info@nevoluteinc.com',
          to: recipientEmail,
          subject: userSubject,
          html: userHtml,
        })
      );
    }

    if (adminHtml && adminSubject) {
      console.log(`Sending ADMIN email [${adminSubject}] to: ${ADMIN_EMAIL}`);
      promises.push(
        resend.emails.send({
          from: 'info@nevoluteinc.com',
          to: ADMIN_EMAIL,
          subject: adminSubject,
          html: adminHtml,
        })
      );
    }

    if (promises.length === 0) {
      console.log('Skipping email: No matching event rules produced an email.');
      return res.status(200).json({ message: 'Webhook received, no email triggered.' });
    }

    await Promise.all(promises);
    console.log('Webhook emails dispatched successfully.');
    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error('Webhook execution error:', err);
    return res.status(500).json({ error: err.message });
  }
}
