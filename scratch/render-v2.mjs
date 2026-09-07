import { GoogleGenAI } from '@google/genai';
import { buildPrompts } from './lib/runway.ts';
import fs from 'node:fs';

const W = '/tmp/lodgeflix-v2';
const P = { name:'LODGEFLIX', style:'prestige', treatment:'minimal',
            primaryColor:'#E50914', duration:4 };
// gen4_turbo selects the UNTOUCHED styleMotion map — the program's original verbatim language.
const { videoPrompt } = buildPrompts({ ...P, videoModel:'gen4_turbo' });

if (process.argv[2] === 'start') {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  const b64 = fs.readFileSync('/tmp/lodgeflix/ref_frame0.png').toString('base64');
  const op = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: videoPrompt,
    image: { imageBytes: b64, mimeType: 'image/png' },
    config: { numberOfVideos:1, aspectRatio:'16:9', resolution:'720p', durationSeconds:4 },
  });
  if (!op.name) throw new Error('no operation name');
  fs.writeFileSync(`${W}/op.txt`, op.name);
  fs.writeFileSync(`${W}/prompt.txt`, videoPrompt);
  console.log('started:', op.name);
} else {
  const opName = fs.readFileSync(`${W}/op.txt`,'utf8').trim();
  const key = process.env.GOOGLE_AI_API_KEY;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opName}?key=${key}`);
  if (!r.ok) { console.log('poll HTTP', r.status); process.exit(1); }
  const op = await r.json();
  if (!op.done) { console.log('RUNNING'); process.exit(0); }
  if (op.error) { console.log('FAILED', JSON.stringify(op.error).slice(0,300)); process.exit(1); }
  const v = op.response?.generateVideoResponse?.generatedSamples?.[0]?.video
         ?? op.response?.generatedVideos?.[0]?.video;
  if (!v) { console.log('FAILED: done but no video'); process.exit(1); }
  let buf;
  if (v.videoBytes) buf = Buffer.from(v.videoBytes,'base64');
  else {
    const sep = v.uri.includes('?') ? '&' : '?';
    const d = await fetch(`${v.uri}${sep}key=${key}`);
    if (!d.ok) { console.log('download HTTP', d.status); process.exit(1); }
    buf = Buffer.from(await d.arrayBuffer());
  }
  fs.writeFileSync(`${W}/raw.mp4`, buf);
  console.log('SUCCEEDED  raw bytes=' + buf.length);
}
