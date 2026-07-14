import { z } from 'zod';
export function extractJsonObject(text: string): unknown {
  const clean = text.replace(/```(?:json)?/gi, '').replace(/```/g, ''); const start = clean.indexOf('{');
  if (start < 0) throw new Error('No JSON object found'); let depth=0, quote=false, esc=false;
  for (let i=start;i<clean.length;i++) { const c=clean[i]!; if (quote) { if (esc) esc=false; else if(c==='\\') esc=true; else if(c==='"') quote=false; continue; } if(c==='"') quote=true; else if(c==='{') depth++; else if(c==='}' && --depth===0) return JSON.parse(clean.slice(start,i+1)); }
  throw new Error('Truncated JSON object');
}
export function parseWithRepair<T>(text:string, schema:z.ZodType<T>): T { return schema.parse(extractJsonObject(text)); }
