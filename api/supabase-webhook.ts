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
    const { type, table, record } = req.body;
    console.log(`Received webhook for table ${table}, event ${type}`);

    // Example: Handle transaction insert
    if (table === 'transactions') {
      const { data, error } = await resend.emails.send({
        from: 'info@nevoluteinc.com',
        to: 'your-personal-email@gmail.com', // Put your actual email here for testing
        subject: 'Top-up Successful!',
        html: `<p>Your top-up of ${record.amount} was processed successfully.</p>`,
      });

      if (error) {
        console.error('Resend API Error:', error);
        return res.status(400).json({ error });
      }

      console.log('Email sent successfully:', data);
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Webhook execution error:', err);
    return res.status(500).json({ error: err.message });
  }
}
