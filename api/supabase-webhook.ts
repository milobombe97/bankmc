import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase admin client to fetch user profile data
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  // 1. Verify Secret Header from Supabase pg_net
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

      // If email isn't directly on the transaction record, fetch it from profiles
      if (!recipientEmail && record?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', record.user_id)
          .single();

        recipientEmail = profile?.email;
      }

      // Fallback if no user email found
      if (!recipientEmail) {
        console.error('No recipient email found for user_id:', record?.user_id);
        return res.status(400).json({ error: 'No recipient email found' });
      }

      console.log(`Sending top-up notification to: ${recipientEmail}`);

      const { data, error } = await resend.emails.send({
        from: 'info@nevoluteinc.com',
        to: recipientEmail, // Dynamically routes to the actual user's email
        subject: 'New Transaction Top-Up Successful!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Transaction Successful</h2>
            <p>Your top-up of <strong>${record?.amount} XAF</strong> has been processed.</p>
            <p><strong>Category:</strong> ${record?.category}</p>
            <p><strong>Status:</strong> ${record?.status}</p>
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
