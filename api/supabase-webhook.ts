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
    const { table, record } = payload;

    if (table === 'transactions') {
      let recipientEmail = record?.user_email || record?.email;

      // Fetch email from profiles if not present on record
      if (!recipientEmail && record?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', record.user_id)
          .single();

        recipientEmail = profile?.email;
      }

      if (!recipientEmail) {
        console.error('No recipient email found for user_id:', record?.user_id);
        return res.status(400).json({ error: 'No recipient email found' });
      }

      // Determine email content based on transaction category/type
      const category = record?.category || 'transaction';
      let subject = 'Transaction Update';
      let actionText = 'processed';

      if (category === 'topup') {
        subject = 'Top-Up Successful!';
        actionText = 'top-up of';
      } else if (category === 'withdrawal') {
        subject = 'Withdrawal Initiated / Processed';
        actionText = 'withdrawal of';
      } else if (category === 'transfer') {
        subject = 'Transfer Sent Successfully';
        actionText = 'transfer of';
      }

      console.log(`Sending ${category} notification to: ${recipientEmail}`);

      const { data, error } = await resend.emails.send({
        from: 'info@nevoluteinc.com',
        to: recipientEmail,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #333;">Nevolute Transaction Alert</h2>
            <p>Hello,</p>
            <p>Your recent <strong>${category}</strong> has been successfully processed.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Amount:</strong> ${record?.amount} XAF</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${record?.status}</p>
              <p style="margin: 5px 0;"><strong>Reference ID:</strong> ${record?.id}</p>
            </div>
            <p style="color: #666; font-size: 12px;">Thank you for using Nevolute.</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend API Error:', error);
        return res.status(400).json({ error });
      }

      return res.status(200).json({ success: true, emailData: data });
    }

    return res.status(200).json({ message: 'Webhook received, but table not matched' });
  } catch (err: any) {
    console.error('Webhook execution error:', err);
    return res.status(500).json({ error: err.message });
  }
}
