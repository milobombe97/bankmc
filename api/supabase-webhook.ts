import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_EMAIL = 'info@nevoluteinc.com';

export default async function handler(req: any, res: any) {
  // Validate Webhook Secret
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

    // 1. PROFILES (New User Signups)
    if (table === 'profiles' && type === 'INSERT') {
      adminSubject = '👤 New User Account Created';
      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #0284c7;">New User Registration</h2>
          <p>A new user registered on Nevolute Inc.</p>
          <p><strong>Email:</strong> ${record?.email || 'N/A'}</p>
          <p><strong>User ID:</strong> ${record?.id}</p>
        </div>
      `;
    }

    // 2. TRANSACTIONS (Topup, Withdrawal, Transfer)
    else if (table === 'transactions' && type === 'INSERT') {
      recipientEmail = await getRecipientEmail(record.user_id);
      const category = record?.category || 'transaction';

      sendToUser = true;
      userSubject = category === 'topup' ? 'Top-Up Successful!' : 'Transaction Alert';
      userHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Transaction Alert</h2>
          <p>Your ${category} of <strong>${record?.amount} XAF</strong> was recorded.</p>
        </div>
      `;

      adminSubject = `💰 New Transaction: ${category.toUpperCase()}`;
      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2>New Transaction Recorded</h2>
          <p><strong>Type:</strong> ${category}</p>
          <p><strong>Amount:</strong> ${record?.amount} XAF</p>
          <p><strong>User ID:</strong> ${record?.user_id}</p>
        </div>
      `;
    }

    // 3. RECEIPTS
    else if (table === 'receipts') {
      if (type === 'INSERT') {
        adminSubject = '🧾 New Receipt Submitted for Review';
        adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #ca8a04;">New Receipt Submission</h2>
            <p>A user submitted a payment receipt for review.</p>
            <p><strong>Amount:</strong> ${record?.amount} XAF</p>
            <p><strong>User ID:</strong> ${record?.user_id}</p>
            <p><strong>Receipt ID:</strong> ${record?.id}</p>
          </div>
        `;
      } else if (type === 'UPDATE' && (record?.status === 'approved' || record?.status === 'rejected')) {
        recipientEmail = await getRecipientEmail(record.user_id);
        sendToUser = true;
        const isApproved = record.status === 'approved';
        userSubject = isApproved ? 'Receipt Approved!' : 'Receipt Rejected';
        userHtml = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Receipt Status: ${record.status}</h2>
          </div>
        `;
      }
    }

    // 4. KYC SUBMISSIONS
    else if (table === 'kyc_submissions') {
      if (type === 'INSERT') {
        adminSubject = '🛡️ New KYC Verification Submitted';
        adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #9333ea;">New KYC Submission</h2>
            <p>A user submitted verification documents.</p>
            <p><strong>Document:</strong> ${record?.document_type || 'N/A'}</p>
            <p><strong>User ID:</strong> ${record?.user_id}</p>
          </div>
        `;
      } else if (type === 'UPDATE' && (record?.status === 'approved' || record?.status === 'rejected')) {
        recipientEmail = await getRecipientEmail(record.user_id);
        sendToUser = true;
        const isApproved = record.status === 'approved';
        userSubject = isApproved ? 'KYC Verification Approved!' : 'KYC Verification Rejected';
        userHtml = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>KYC Status: ${record.status}</h2>
          </div>
        `;
      }
    }

    // Execute Email Dispatch
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
      console.log('Skipping email: No rules matched to generate content.');
      return res.status(200).json({ message: 'No email generated' });
    }

    const results = await Promise.all(promises);
    console.log('Resend Response Results:', JSON.stringify(results, null, 2));
    return res.status(200).json({ success: true, results });

  } catch (err: any) {
    console.error('Webhook Execution Exception:', err);
    return res.status(500).json({ error: err.message });
  }
}
