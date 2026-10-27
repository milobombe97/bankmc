import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    console.error('Unauthorized webhook attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = req.body;
    console.log('--- INCOMING WEBHOOK PAYLOAD ---', JSON.stringify(payload, null, 2));

    const { table, record } = payload;

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
    let subject = '';
    let htmlContent = '';

    // ==========================================
    // 1. TRANSACTIONS
    // ==========================================
    if (table === 'transactions') {
      recipientEmail = await getRecipientEmail(record.user_id);
      const category = record?.category || 'transaction';
      subject = category === 'topup' ? 'Top-Up Successful!' : 'Transaction Update';

      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Transaction Alert</h2>
          <p>Your ${category} of <strong>${record?.amount} XAF</strong> was processed.</p>
        </div>
      `;
    }

    // ==========================================
    // 2. RECEIPTS
    // ==========================================
    else if (table === 'receipts') {
      const status = record?.status;
      if (status === 'approved' || status === 'rejected') {
        recipientEmail = await getRecipientEmail(record.user_id);
        const isApproved = status === 'approved';
        subject = isApproved ? 'Receipt Approved!' : 'Receipt Rejected';
        const color = isApproved ? '#2e7d32' : '#c62828';

        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2>Receipt Status Update</h2>
            <p>Your receipt status is: <strong style="color: ${color}; text-transform: uppercase;">${status}</strong></p>
            ${record?.reason ? `<p><strong>Reason:</strong> ${record.reason}</p>` : ''}
          </div>
        `;
      }
    }

    // ==========================================
    // 3. KYC SUBMISSIONS
    // ==========================================
    else if (table === 'kyc_submissions') {
      const status = record?.status;
      console.log('Processing KYC submission with status:', status);

      if (status === 'approved' || status === 'rejected') {
        recipientEmail = await getRecipientEmail(record.user_id);
        const isApproved = status === 'approved';
        subject = isApproved ? 'KYC Verification Approved!' : 'KYC Verification Rejected';
        const color = isApproved ? '#2e7d32' : '#c62828';

        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2>KYC Verification Update</h2>
            <p>Your identity verification status is: <strong style="color: ${color}; text-transform: uppercase;">${status}</strong></p>
            ${record?.rejection_reason ? `<p><strong>Reason:</strong> ${record.rejection_reason}</p>` : ''}
          </div>
        `;
      }
    }

    if (!recipientEmail || !htmlContent) {
      console.log('Skipping email: No recipient email or HTML content generated.');
      return res.status(200).json({ message: 'Webhook received, but no email triggered.' });
    }

    console.log(`Sending email [${subject}] to: ${recipientEmail}`);

    const { data, error } = await resend.emails.send({
      from: 'info@nevoluteinc.com',
      to: recipientEmail,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return res.status(400).json({ error });
    }

    console.log('Email sent successfully:', data);
    return res.status(200).json({ success: true, emailData: data });

  } catch (err: any) {
    console.error('Webhook execution error:', err);
    return res.status(500).json({ error: err.message });
  }
}
