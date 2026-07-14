import { execa } from 'execa';
import type { BrainAdapter, BrainAdapterInfo } from '@setflow/shared';
export class ClaudeCliAdapter implements BrainAdapter {
  id = 'claude-cli' as const; constructor(private readonly path='claude') {}
  async complete(prompt:string, opts:{timeoutMs?:number}={}) { try { const r=await execa(this.path,['-p',prompt,'--output-format','json'],{timeout:opts.timeoutMs,reject:true,preferLocal:false,stdin:'ignore'}); try { return JSON.parse(r.stdout).result ?? r.stdout; } catch { return r.stdout; } } catch (error) { if(process.platform==='win32' && this.path==='claude') { const r=await execa('cmd',['/c','claude.cmd','-p',prompt,'--output-format','json'],{timeout:opts.timeoutMs,stdin:'ignore'}); try{return JSON.parse(r.stdout).result??r.stdout;}catch{return r.stdout;} } throw error; } }
  async probe():Promise<BrainAdapterInfo> { try { const r=await execa(this.path,['--version'],{timeout:5000,preferLocal:false}); return {id:this.id,label:'Claude Code CLI',available:true,detail:r.stdout.trim()}; } catch { return {id:this.id,label:'Claude Code CLI',available:false,detail:'not found on PATH'}; } }
}
