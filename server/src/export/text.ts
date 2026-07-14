import type { SetDocument } from '@setflow/shared';import {option,tracks}from './util.js';
export function textTracklist(doc:SetDocument,id:string){const o=option(doc,id);return [`${doc.name} — ${o.label}`,...tracks(doc,o).map((t,i)=>`${i+1}. ${t.artist} - ${t.title}${t.mix?` (${t.mix})`:''} [${t.key.value||'?'} · ${t.bpm.value} BPM]`)].join('\n')+'\n';}
