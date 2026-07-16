import type { BrainRequest } from '@setflow/shared';
import type { Settings } from '../config.js';
export const DEFAULT_PROMPTS: Record<BrainRequest['kind'], string> = {
  propose: 'Build a 20-30 track pool and two options A/B with orders as pool indices and transitions.', replace: 'Replace only the unresolved tracks while preserving their arc roles.', finalize: 'Order the starred tracks into one coherent final journey.', 'fix-transition': 'Return a corrected proposal/order which fixes this one transition.', alternatives: 'Return exactly three compatible replacement alternatives.'
};
const trackShape = '{"artist":"","title":"","mix":"","estBpm":120,"estKey":"8A","estEnergy":5,"moodTags":[],"slot":"","why":""}';
const shape = `{"pool":[${trackShape}],"options":[{"id":"A","label":"","rationale":"","order":[0],"transitions":[{"blend":"long-blend","note":""}]}],"arcs":{"A":[5]}}`;
const apply = (s:string, vars:Record<string,string>) => s.replace(/{{\s*(\w+)\s*}}/g,(_,k)=>vars[k] ?? '');
export function buildPrompt(request:BrainRequest, settings:Settings): string {
  const c=request.context; const context=`intent=${JSON.stringify(c.intent)} constraints=${JSON.stringify(c.constraints)} targetCurve=${JSON.stringify(c.targetCurve)}`;
  let extra=''; if(request.kind==='replace') extra=` unresolved=${JSON.stringify(request.unresolved)} pool=${request.poolSummary}`; if(request.kind==='finalize') extra=` starred=${request.starredSummary}`; if(request.kind==='fix-transition') extra=` option=${request.optionSummary} problem=${request.problem}`; if(request.kind==='alternatives') extra=` target=${request.target} neighbors=${request.neighbors}`;
  const template=settings.brain.promptOverrides[request.kind] || DEFAULT_PROMPTS[request.kind];
  return `You are a veteran DJ and selector with impeccable taste. Respond with ONLY a valid JSON object, no prose, no markdown fences. ${apply(template,{context,extra})} ${context}${extra} JSON shape example: ${request.kind==='replace' ? `{"replacements":[{"replacesIndex":0,"track":${trackShape}}]}. Each replacement has EXACTLY two keys: "replacesIndex" (the "index" value from the unresolved list) and "track" (an object with ALL fields shown in the example).` : request.kind==='alternatives' ? `{"alternatives":[${trackShape}]}` : shape}`;
}
