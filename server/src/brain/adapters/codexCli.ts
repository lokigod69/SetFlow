import { execa } from 'execa';
import type { BrainAdapter, BrainAdapterInfo } from '@setflow/shared';
export class CodexCliAdapter implements BrainAdapter {
  id='codex-cli' as const; constructor(private readonly path='codex') {}
  async complete(prompt:string, opts:{timeoutMs?:number}={}) { const args=['exec','--skip-git-repo-check','--sandbox','read-only','--json',prompt]; let r; try { r=await execa(this.path,args,{timeout:opts.timeoutMs,preferLocal:false}); } catch { r=await execa(this.path,['exec','--skip-git-repo-check','--sandbox','read-only',prompt],{timeout:opts.timeoutMs,preferLocal:false}); }
    const messages=r.stdout.split(/\r?\n/).flatMap(line=>{try{const e=JSON.parse(line); return [e.item?.text ?? e.message?.content ?? ''];}catch{return [];}}).filter(Boolean); return messages.at(-1) ?? r.stdout.replace(/^.*(?:Codex|OpenAI).*$/gmi,'').trim(); }
  async probe():Promise<BrainAdapterInfo> { try { const r=await execa(this.path,['--version'],{timeout:5000,preferLocal:false}); return {id:this.id,label:'Codex CLI',available:true,detail:r.stdout.trim()}; } catch { return {id:this.id,label:'Codex CLI',available:false,detail:'not found on PATH'}; } }
}
