import type { SetDocument } from '@setflow/shared';import {option,tracks}from './util.js';
export function youtubeList(doc:SetDocument,id:string){return tracks(doc,option(doc,id)).map(t=>t.youtubeUrl??`https://www.youtube.com/results?search_query=${encodeURIComponent([t.artist,t.title,t.mix].filter(Boolean).join(' '))}`).join('\n')+'\n';}
