import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { EmailRequestBody } from '@/lib/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: EmailRequestBody;

  try {
    body = (await req.json()) as EmailRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, pdfBase64 } = body ?? {};

  if (!email || !pdfBase64) {
    return NextResponse.json({ error: 'Missing email or PDF data' }, { status: 400 });
  }

  // Basic email format guard — full validation happens on Resend's side
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = Buffer.from(pdfBase64, 'base64');
  } catch {
    return NextResponse.json({ error: 'Invalid PDF data' }, { status: 400 });
  }

  try {
    const result = await resend.emails.send({
      // onboarding@resend.dev works without domain verification.
      // Once velahealth.app is verified in the Resend dashboard,
      // switch this to: 'Vela <noreply@velahealth.app>'
      from: 'Vela <onboarding@resend.dev>',
      to: [email],
      subject: 'Your Vela Pre-Visit Clinical Brief',
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2D1B2E;">
          <h2 style="color: #C084FC; font-size: 22px; margin-bottom: 8px;">Your Clinical Brief is Ready</h2>
          <p style="line-height: 1.6; color: #4a3550;">
            Thank you for using Vela. Your personalized pre-visit clinical brief is attached to this email.
          </p>
          <p style="line-height: 1.6; color: #4a3550;">
            Bring this document to your next healthcare appointment to help your provider understand your
            symptom history, patterns, and questions. It was generated from the information you shared
            during your session — no data has been stored on our servers.
          </p>
          <p style="line-height: 1.6; color: #888; font-size: 13px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
            This document is for informational purposes only and is not a substitute for professional
            medical advice, diagnosis, or treatment. Always seek the guidance of your physician or
            other qualified health provider.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'vela-clinical-brief.pdf',
          content: pdfBuffer,
        },
      ],
    });

    if (result.error) {
      console.error('[/api/email] Resend rejected send:', result.error);
      return NextResponse.json(
        { error: result.error.message ?? 'Resend rejected the request' },
        { status: 422 },
      );
    }

    // Return immediately — no session data is stored or logged
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    console.error('[/api/email] Resend error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
