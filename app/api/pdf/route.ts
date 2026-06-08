import { NextRequest, NextResponse } from 'next/server';
import type { PDFRequestBody } from '@/lib/types';
import { buildClinicalDocument } from '@/lib/pdfgen/template';

// pdfmake is CommonJS; import via require to avoid ESM issues in Next.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmake = require('pdfmake') as {
  addFonts: (fonts: Record<string, Record<string, string>>) => void;
  setUrlAccessPolicy: (cb: (url: string) => boolean) => void;
  setLocalAccessPolicy: (cb: (path: string) => boolean) => void;
  virtualfs: { writeFileSync: (name: string, buf: Buffer) => void };
  createPdf: (def: object) => { getBuffer: () => Promise<Buffer> };
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const vfsData = require('pdfmake/build/vfs_fonts') as Record<string, string>;

let fontsLoaded = false;

function ensureFonts(): void {
  if (fontsLoaded) return;

  // Load Roboto TTFs into pdfmake's virtual file system
  for (const [filename, base64] of Object.entries(vfsData)) {
    pdfmake.virtualfs.writeFileSync(filename, Buffer.from(base64, 'base64'));
  }

  pdfmake.setLocalAccessPolicy(() => false);
  pdfmake.setUrlAccessPolicy(() => false);

  pdfmake.addFonts({
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf',
    },
  });

  fontsLoaded = true;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: PDFRequestBody;

  try {
    body = (await req.json()) as PDFRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body?.session) {
    return NextResponse.json({ error: 'Missing session data' }, { status: 400 });
  }

  try {
    ensureFonts();

    const docDefinition = buildClinicalDocument(body.session);
    const pdfDoc = pdfmake.createPdf(docDefinition);
    const buffer = await pdfDoc.getBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="vela-clinical-brief.pdf"',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[/api/pdf] PDF generation error:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
