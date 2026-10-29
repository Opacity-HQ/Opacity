// Browser fixture: real trial/completion handlers and model, in-memory persistence.
// It deliberately does not exercise Supabase authentication, RLS, or migrations.
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import ts from 'typescript';

export const childId = '11111111-1111-4111-8111-111111111111';
const js = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
async function moduleUrl(file, replacements = {}) {
  let source = await readFile(new URL(file, import.meta.url), 'utf8');
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(`"${from}"`, JSON.stringify(to));
  return js(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
}
export const contract = JSON.parse(await readFile(new URL('../lib/gameplay/contract.json', import.meta.url), 'utf8'));
const artifact = JSON.parse(await readFile(new URL('../lib/gameplay/model.json', import.meta.url), 'utf8'));
const features = await moduleUrl('../lib/gameplay/features.ts', { './contract.json': js(`export default ${JSON.stringify(contract)}`) });
const model = await moduleUrl('../lib/gameplay/model.ts', { 'server-only': js('export {};'), zod: import.meta.resolve('zod'), './features': features, './model.json': js(`export default ${JSON.stringify(artifact)}`) });
const { createGameplayHandler } = await import(await moduleUrl('../lib/gameplay/route.ts', { zod: import.meta.resolve('zod'), './features': features, './model': model }));
export const tables = { game_sessions: [], game_trials: [], session_scores: [], skill_states: [] };
const db = { from(table) {
  const filters = []; let patch; let writes; let conflict; let single = false; const orders = []; let max = Infinity;
  const q = {
    select() { return q; }, eq(key, value) { filters.push(r => r[key] === value); return q; },
    gte(key, value) { filters.push(r => r[key] >= value); return q; },
    order(key, options = {}) { orders.push([key, options.ascending !== false]); return q; },
    limit(n) { max = n; return q; }, maybeSingle() { single = true; return q; },
    update(value) { patch = value; return q; },
    upsert(value, options = {}) { writes = Array.isArray(value) ? value : [value]; conflict = (options.onConflict ?? 'session_id').split(','); return q; },
    then(resolve, reject) {
      return Promise.resolve().then(() => {
        const rows = tables[table];
        if (writes) for (const write of writes) {
          const old = rows.find(row => conflict.every(key => row[key] === write[key]));
          if (old) Object.assign(old, write); else rows.push({ ...write });
        }
        let matched = rows.filter(row => filters.every(f => f(row)));
        if (patch) matched.forEach(row => Object.assign(row, patch));
        for (const [key, asc] of [...orders].reverse()) matched.sort((a,b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (asc ? 1 : -1));
        matched = matched.slice(0, max);
        return { data: single ? matched[0] ?? null : matched, error: null };
      }).then(resolve, reject);
    },
  }; return q;
} };
globalThis.__gameplayBrowserDb = db;
const auth = js('export async function requireUser() { return { supabase: globalThis.__gameplayBrowserDb }; }');
const response = js(`export const apiSuccess = data => Response.json({ok:true,data});
export const apiError = (code,message,details) => Response.json({ok:false,error:{code,message,details}}, {status:400});
export const toApiErrorResponse = error => apiError('fixture_error',error.message);`);
const handlers = {};
for (const game of contract.games) {
  const root = `../app/api/games/${game.id}`;
  const extras = game.id === 'word-builder' ? { './word-bank': await moduleUrl(`${root}/word-bank.ts`) } : {};
  const plan = await moduleUrl(`${root}/plan.ts`, extras);
  const dependencies = { zod: import.meta.resolve('zod'), '@/lib/api/auth': auth, '@/lib/api/response': response, '../plan': plan };
  if (game.id === 'letter-detective') dependencies['../feature-statistics'] = await moduleUrl(`${root}/feature-statistics.ts`);
  handlers[game.id] = {
    trial: (await import(await moduleUrl(`${root}/trial/route.ts`, dependencies))).POST,
    complete: (await import(await moduleUrl(`${root}/complete/route.ts`, dependencies))).POST,
  };
}
export let latestPrediction;
export let mode = 'normal';
export function setMode(value) { mode = value; }
const predict = createGameplayHandler({ enabled: () => true,
  loadAuthorizedSessions: async id => tables.game_sessions.filter(r => r.child_id === id).map(r => ({ ...r, session_scores: tables.session_scores.find(s => s.session_id === r.id) ?? null })),
  errorResponse: error => Response.json({ ok: false, error: { message: error.message } }, { status: 500 }),
});
function newPlan(game) {
  const trials = Array.from({ length: game === 'memory-quest' ? 3 : 2 }, (_, index) => {
    const common = { index, isWarmup: false, exposureMs: 100, timeoutMs: 600 };
    if (game === 'letter-detective') return { ...common, roundType: 'lineup', targetLetter: 'b', twinLetter: 'd', options: ['b','d','p','q'] };
    if (game === 'rapid-match') return { ...common, roundType: 'compare', leftSymbol: 'A', rightSymbol: 'A', isMatch: true };
    if (game === 'sound-match') return { ...common, level: 1, questionNumber: index + 1, roundType: 'first-sound', prompt: 'Find the same first sound', targetWord: 'cat', spokenText: 'cat', options: [{label:'cat'}, {label:'dog'}], correctIndex: 0 };
    if (game === 'word-builder') return { ...common, word: 'cat', tiles: ['c','a','t'], previewMs: 100, difficultyTier: 1 };
    return { index, roundType: 'position', level: 1, gridSize: 3, grid: ['Star','','','','','','','',''], target: 'Star', displayMs: 100 };
  });
  return { version: 1, difficultyLevel: 1, level: 1, pair: {letterA:'b',letterB:'d',confusionType:'mirror'}, trials };
}
export async function respond(request) {
  const url = new URL(request.url);
  if (url.pathname === '/api/dashboard') return Response.json({ok:true,data:{children:[{id:childId,displayName:'Synthetic browser fixture',birthYear:2015,gradeLevel:null,locale:'en',history:[],skills:[],latestReport:null,games:contract.games.map(g=>({gameId:g.id,gameName:g.name,sessionsCompleted:0,lastPlayedAt:null,difficultyLevel:1}))}]}});
  if (url.pathname === '/api/signin/onboarding') return Response.json({ok:true,data:{signedIn:true,needsOnboarding:false,hasChildren:true,displayName:'Fixture'}});
  if (url.pathname === '/api/experimental/gameplay') {
    if (mode === 'error') return Response.json({ok:false,error:{code:'model_unavailable',message:'Fixture outage'}},{status:503});
    if (mode === 'pending') url.searchParams.set('sessionId', '99999999-9999-4999-8999-999999999999');
    const response = await predict(new Request(url)); latestPrediction = (await response.clone().json()).data; return response;
  }
  const match = url.pathname.match(/^\/api\/games\/([^/]+)(?:\/(trial|complete))?$/);
  if (!match) return null;
  const [, game, action] = match;
  if (action) return handlers[game][action](request);
  const plan = newPlan(game), id = randomUUID();
  tables.game_sessions.push({id,child_id:childId,game_id:game,status:'in_progress',difficulty_level:1,started_at:new Date().toISOString(),completed_at:null,config:plan});
  return Response.json({ok:true,data:{sessionId:id,...plan}});
}
