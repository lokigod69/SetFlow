import { execa } from 'execa';
import { tmpdir } from 'node:os';
import type { BrainAdapter, BrainAdapterInfo } from '@setflow/shared';
export class ClaudeCliAdapter implements BrainAdapter {
  id = 'claude-cli' as const; constructor(private readonly path='claude') {}
  // cwd MUST be a neutral dir: run from the repo, the CLI walks up, loads SETFLOW's own
  // CLAUDE.md and answers as a project session instead of as the DJ brain.
  // Prompt goes via STDIN, never argv: cmd.exe mangles argv prompts containing & (track names
  // like "Antdot & Maz"), and Windows caps command lines at ~8k chars.
  async complete(prompt:string, opts:{timeoutMs?:number}={}) { const cwd=tmpdir(); const run=(file:string,args:string[])=>execa(file,args,{timeout:opts.timeoutMs,reject:true,preferLocal:false,input:prompt,cwd}); try { const r=await run(this.path,['-p','--output-format','json']); try { return JSON.parse(r.stdout).result ?? r.stdout; } catch { return r.stdout; } } catch (error) { if(process.platform==='win32' && this.path==='claude') { const r=await run('cmd',['/c','claude.cmd','-p','--output-format','json']); try{return JSON.parse(r.stdout).result??r.stdout;}catch{return r.stdout;} } throw error; } }
  async probe():Promise<BrainAdapterInfo> { try { const r=await execa(this.path,['--version'],{timeout:5000,preferLocal:false}); return {id:this.id,label:'Claude Code CLI',available:true,detail:r.stdout.trim()}; } catch { return {id:this.id,label:'Claude Code CLI',available:false,detail:'not found on PATH'}; } }
}
