import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  // 1. Verify Secret Header from Supabase pg_net
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    console.error('Unauthorized webhook attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = req.body;
    console.log('Incoming Supabase Webhook Payload:', JSON.stringify(payload, null, 2));

    const { type, table, record } = payload;

    // Trigger on inserts into transactions table
    if (table === 'transactions') {
      console.log('Processing transaction notification for amount:', record?.amount);

      const { data, error } = await resend.emails.send({
        from: 'info@nevoluteinc.com',
        to: 'info@nevoluteinc.com', // Change to your active inbox for testing
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

      console.log('Resend Email Sent Successfully:', data);
      return res.status(200).json({ success: true, emailData: data });
    }

    return res.status(200).json({ message: 'Webhook received, but table not matched' });
  } catch (err: any) {
    console.error('Webhook execution error:', err);
    return res.status(500).json({ error: err.message });
  }
}
