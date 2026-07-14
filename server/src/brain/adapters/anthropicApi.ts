import type { BrainAdapter, BrainAdapterInfo } from '@setflow/shared';
export class AnthropicApiAdapter implements BrainAdapter {
  id='anthropic-api' as const; constructor(private readonly key?:string, private readonly model='claude-sonnet-5') {}
  async complete(prompt:string, opts:{timeoutMs?:number}={}) { if(!this.key) throw new Error('Anthropic API key not configured'); const ac=new AbortController(); const timer=setTimeout(()=>ac.abort(),opts.timeoutMs??240000); try { const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal:ac.signal,headers:{'content-type':'application/json','x-api-key':this.key,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:this.model,max_tokens:8192,messages:[{role:'user',content:prompt}]})}); if(!res.ok) throw new Error(`Anthropic ${res.status}`); const json=await res.json() as {content?:{type:string;text?:string}[]}; return json.content?.find(x=>x.type==='text')?.text ?? ''; } finally {clearTimeout(timer);} }
  async probe():Promise<BrainAdapterInfo> { return {id:this.id,label:'Anthropic API',available:Boolean(this.key),detail:this.key?'API key configured':'API key not configured'}; }
}
