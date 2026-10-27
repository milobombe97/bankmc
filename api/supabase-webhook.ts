import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  // 1. Enforce POST requests only
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Validate the shared secret token
  const authHeader = req.headers['x-webhook-secret'];
  if (!authHeader || authHeader !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }

  // 3. Extract the payload sent by pg_net
  const { type, table, record, old_record } = req.body;

  try {
    // ------------------------------------------------------------------
    // EVENT 1: Profile updated to approved KYC
    // ------------------------------------------------------------------
    if (table === 'profiles' && type === 'UPDATE') {
      const isApprovedNow =
        old_record?.kyc_status !== 'approved' && record?.kyc_status === 'approved';

      const userEmail = record?.email || record?.user_email;

      if (isApprovedNow && userEmail) {
        await resend.emails.send({
          from: 'Nevolute Support <info@nevoluteinc.com>',
          to: [userEmail],
          subject: 'Identity Verification Approved - Nevolute',
          html: `
            <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
              <h2 style="color: #059669; margin-top: 0;">KYC Verification Approved</h2>
              <p>Hello <strong>${record?.full_name || record?.first_name || 'Valued User'}</strong>,</p>
              <p>Your identity verification (KYC) documents have been successfully reviewed and approved.</p>
              <p>You now have unrestricted access to deposits, withdrawals, and store features on Nevolute.</p>
            </div>
          `,
        });
      }
    }

    // ------------------------------------------------------------------
    // EVENT 2: New wallet top-up / transaction inserted
    // ------------------------------------------------------------------
    if (table === 'transactions' && type === 'INSERT') {
      const userEmail = record?.user_email || record?.email;

      if (userEmail) {
        await resend.emails.send({
          from: 'Nevolute Billing <info@nevoluteinc.com>',
          to: [userEmail],
          subject: `Transaction Received (${record?.currency || 'USD'} ${record?.amount || ''})`,
          html: `
            <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
              <h2 style="color: #2563eb; margin-top: 0;">Transaction Confirmed</h2>
              <p>A new activity was recorded on your account balance:</p>
              <ul style="background-color: #f8fafc; padding: 16px 24px; border-radius: 8px;">
                <li><strong>Amount:</strong> ${record?.currency || 'USD'} ${record?.amount || '0'}</li>
                <li><strong>Status:</strong> ${record?.status || 'Completed'}</li>
                <li><strong>Reference:</strong> ${record?.id || 'N/A'}</li>
              </ul>
            </div>
          `,
        });
      }
    }

    return res.status(200).json({ success: true, message: 'Event processed' });
  } catch (error: any) {
    console.error('Webhook execution failed:', error);
    return res.status(500).json({ error: error.message });
  }
}