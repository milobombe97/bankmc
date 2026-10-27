import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'info@nevoluteinc.com';

export default async function handler(req: any, res: any) {
  try {
    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
      console.error('Unauthorized webhook attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = req.body;
    console.log('--- INCOMING WEBHOOK PAYLOAD ---', JSON.stringify(payload, null, 2));

    const { table, type, record } = payload;
    if (!record) {
      return res.status(200).json({ message: 'No record in payload' });
    }

    async function getRecipientEmail(userId: string) {
      try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) return null;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();

        return profile?.email || null;
      } catch (err) {
        console.error('Error fetching user email:', err);
        return null;
      }
    }

    let recipientEmail = null;
    let adminSubject = '';
    let adminHtml = '';
    let sendToUser = false;
    let userSubject = '';
    let userHtml = '';

    // 1. PROFILES
    if (table === 'profiles' && type === 'INSERT') {
      adminSubject = '👤 New User Account Created';
      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #0284c7;">New User Registration</h2>
          <p>Email: ${record?.email || 'N/A'}</p>
        </div>
      `;
    }

    // 2. TRANSACTIONS
    else if (table === 'transactions' && type === 'INSERT') {
      recipientEmail = await getRecipientEmail(record.user_id);
      const category = record?.category || 'transaction';

      sendToUser = true;
      userSubject = category === 'topup' ? 'Top-Up Successful!' : 'Transaction Alert';
      userHtml = `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Transaction Alert</h2><p>Your ${category} of <strong>${record?.amount} XAF</strong> was recorded.</p></div>`;

      adminSubject = `💰 New Transaction: ${category.toUpperCase()}`;
      adminHtml = `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>New Transaction</h2><p>Type: ${category}</p><p>Amount: ${record?.amount} XAF</p></div>`;
    }

    // 3. RECEIPTS
    else if (table === 'receipts') {
      const status = record?.status;
      if (type === 'INSERT') {
        adminSubject = '🧾 New Receipt Submitted for Review';
        adminHtml = `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>New Receipt</h2><p>Amount: ${record?.amount} XAF</p></div>`;
      } else if (type === 'UPDATE' && (status === 'approved' || status === 'rejected')) {
        recipientEmail = await getRecipientEmail(record.user_id);
        sendToUser = true;
        const isApproved = status === 'approved';
        userSubject = isApproved ? 'Receipt Approved!' : 'Receipt Rejected';
        const reasonText = record?.reason || record?.rejection_reason;
        const color = isApproved ? '#2e7d32' : '#c62828';

        userHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2>Receipt Status Update</h2>
            <p>Your receipt status is: <strong style="color: ${color}; text-transform: uppercase;">${status}</strong></p>
            ${reasonText ? `<p><strong>Reason:</strong> ${reasonText}</p>` : ''}
          </div>
        `;
      }
    }

    // 4. KYC SUBMISSIONS
    else if (table === 'kyc_submissions') {
      const status = record?.status;
      if (type === 'INSERT') {
        adminSubject = '🛡️ New KYC Verification Submitted';
        adminHtml = `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>New KYC Submission</h2><p>Document: ${record?.document_type || 'N/A'}</p></div>`;
      } else if (type === 'UPDATE' && (status === 'approved' || status === 'rejected')) {
        recipientEmail = await getRecipientEmail(record.user_id);
        sendToUser = true;
        const isApproved = status === 'approved';
        userSubject = isApproved ? 'KYC Verification Approved!' : 'KYC Verification Rejected';
        const reasonText = record?.rejection_reason || record?.reason;
        const color = isApproved ? '#2e7d32' : '#c62828';

        userHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2>KYC Verification Update</h2>
            <p>Your identity verification status is: <strong style="color: ${color}; text-transform: uppercase;">${status}</strong></p>
            ${reasonText ? `<p><strong>Reason:</strong> ${reasonText}</p>` : ''}
          </div>
        `;
      }
    }

    // Dispatch Emails
    const promises = [];
    if (sendToUser && recipientEmail && userHtml) {
      promises.push(resend.emails.send({ from: 'info@nevoluteinc.com', to: recipientEmail, subject: userSubject, html: userHtml }));
    }
    if (adminHtml && adminSubject) {
      promises.push(resend.emails.send({ from: 'info@nevoluteinc.com', to: ADMIN_EMAIL, subject: adminSubject, html: adminHtml }));
    }

    if (promises.length === 0) {
      return res.status(200).json({ message: 'No action taken' });
    }

    const results = await Promise.all(promises);
    return res.status(200).json({ success: true, results });

  } catch (err: any) {
    console.error('Webhook Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
