import type { SetDocument, SetOption } from '@setflow/shared';
export const option=(d:SetDocument,id:string)=>{const x=d.options.find(o=>o.id===id);if(!x)throw new Error('Option not found');return x;};
export const tracks=(d:SetDocument,o:SetOption)=>o.trackIds.map(id=>d.pool.find(t=>t.id===id)).filter(Boolean) as SetDocument['pool'];
export const esc=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`;
