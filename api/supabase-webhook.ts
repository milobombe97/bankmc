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
    const { table, type, record, old_record } = payload;

    // Helper to find recipient email
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
    // 1. TRANSACTIONS (Topups, Withdrawals, Transfers)
    // ==========================================
    if (table === 'transactions' && type === 'INSERT') {
      recipientEmail = await getRecipientEmail(record.user_id);
      const category = record?.category || 'transaction';
      
      if (category === 'topup') {
        subject = 'Top-Up Successful!';
      } else if (category === 'withdrawal') {
        subject = 'Withdrawal Processed';
      } else if (category === 'transfer') {
        subject = 'Transfer Sent Successfully';
      } else {
        subject = 'Transaction Update';
      }

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #333;">Nevolute Transaction Alert</h2>
          <p>Your recent <strong>${category}</strong> has been successfully processed.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${record?.amount} XAF</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${record?.status}</p>
            <p style="margin: 5px 0;"><strong>Reference ID:</strong> ${record?.id}</p>
          </div>
        </div>
      `;
    }

    // ==========================================
    // 2. RECEIPTS (Approval & Rejection)
    // ==========================================
    else if (table === 'receipts' && type === 'UPDATE') {
      // Only trigger if status actually changed to approved or rejected
      const newStatus = record?.status;
      const oldStatus = old_record?.status;

      if (newStatus !== oldStatus && (newStatus === 'approved' || newStatus === 'rejected')) {
        recipientEmail = await getRecipientEmail(record.user_id);
        const isApproved = newStatus === 'approved';

        subject = isApproved ? 'Receipt Approved!' : 'Receipt Rejected';
        const statusColor = isApproved ? '#2e7d32' : '#c62828';

        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #333;">Receipt Status Update</h2>
            <p>Your submitted receipt has been reviewed.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${newStatus}</span></p>
              ${record?.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${record.reason}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Reference ID:</strong> ${record?.id}</p>
            </div>
          </div>
        `;
      }
    }

    // ==========================================
    // 3. KYC (Approval & Rejection)
    // ==========================================
    // Assuming KYC status is stored in 'profiles' or a 'kyc_submissions' table
    else if ((table === 'profiles' || table === 'kyc_submissions') && type === 'UPDATE') {
      const newKycStatus = record?.kyc_status || record?.status;
      const oldKycStatus = old_record?.kyc_status || old_record?.status;

      if (newKycStatus !== oldKycStatus && (newKycStatus === 'approved' || newKycStatus === 'rejected')) {
        const userId = record?.user_id || record?.id;
        recipientEmail = await getRecipientEmail(userId) || record?.email;
        const isApproved = newKycStatus === 'approved';

        subject = isApproved ? 'KYC Verification Approved!' : 'KYC Verification Rejected';
        const statusColor = isApproved ? '#2e7d32' : '#c62828';

        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #333;">KYC Verification Update</h2>
            <p>Your identity verification status has been updated.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${newKycStatus}</span></p>
              ${record?.rejection_reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${record.rejection_reason}</p>` : ''}
            </div>
          </div>
        `;
      }
    }

    // If no email or content generated, exit gracefully
    if (!recipientEmail || !htmlContent) {
      return res.status(200).json({ message: 'Webhook received, no email triggered for this event.' });
    }

    console.log(`Sending ${subject} email to: ${recipientEmail}`);

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

    return res.status(200).json({ success: true, emailData: data });

  } catch (err: any) {
    console.error('Webhook execution error:', err);
    return res.status(500).json({ error: err.message });
  }
}
