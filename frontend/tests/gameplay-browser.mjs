// Run against a running Next server. Uses real UI, grading and inference with
// synthetic plans/in-memory storage; no real Supabase records are accessed.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { respond, contract, tables, latestPrediction, setMode } from './gameplay-browser-fixture.mjs';

const base = process.env.GAMEPLAY_TEST_URL ?? 'http://127.0.0.1:3011';
const out = path.resolve('.next/gameplay-qa');
await mkdir(out, { recursive: true });
const profile = path.join(out, `profile-${Date.now()}`);
const edge = spawn(process.env.GAMEPLAY_TEST_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let ws, sessionId; let seq = 0;
const pending = new Map(), errors = [];
const send = (method, params = {}, browser = false) => new Promise((resolve, reject) => {
  const id = ++seq;
  const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 15000);
  pending.set(id, {resolve: value => {clearTimeout(timer);resolve(value);}, reject: error => {clearTimeout(timer);reject(error);}});
  ws.send(JSON.stringify({id,method,params,...(!browser && sessionId ? {sessionId} : {})}));
});
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {expression,returnByValue:true,awaitPromise:true});
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression) {
  for (let i=0; i<300; i++) { if (await evaluate(expression)) return; await delay(100); }
  throw Error(`UI timed out: ${expression}\n${await evaluate('document.body.innerText')}\n${errors.join('\n')}`);
}
async function click(expression, keyboard = false) {
  await waitFor(`Boolean(${expression})`);
  const point = await evaluate(`(() => {const b=${expression};b.scrollIntoView({block:'center'});b.focus();const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  if (keyboard) {
    await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
    await send('Input.dispatchKeyEvent', {type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  } else {
    await send('Input.dispatchMouseEvent', {type:'mousePressed',button:'left',clickCount:1,...point});
    await send('Input.dispatchMouseEvent', {type:'mouseReleased',button:'left',clickCount:1,...point});
  }
}
const panelText = () => evaluate("document.querySelector('[data-gameplay-result]')?.innerText ?? ''");
const byText = text => `[...document.querySelectorAll('button')].find(b=>b.textContent.trim().toLowerCase()===${JSON.stringify(text)})`;
async function screenshot(name) {
  await evaluate("document.querySelector('[data-gameplay-result]').scrollIntoView({block:'start'})");
  await delay(200);
  await writeFile(path.join(out,name+'.png'), Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
}
try {
  let details;
  for (let i=0; i<100; i++) {try {details=(await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).trim().split(/\r?\n/);break;}catch {await delay(100);}}
  if (!details) throw Error('Browser did not start; set GAMEPLAY_TEST_BROWSER to a Chromium executable.');
  ws = new WebSocket(`ws://127.0.0.1:${details[0]}${details[1]}`);
  await new Promise((resolve,reject) => {ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message', async event => {
    const msg = JSON.parse(event.data);
    if (msg.id) {const p=pending.get(msg.id);pending.delete(msg.id);if(msg.error) p?.reject(Error(msg.error.message));else p?.resolve(msg.result);return;}
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
    if (msg.method !== 'Fetch.requestPaused') return;
    const {requestId,request} = msg.params;
    try {
      const url = new URL(request.url);
      if (url.origin !== base && url.protocol.startsWith('http')) return await send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});
      const response = url.pathname.startsWith('/api/') ? await respond(new Request(request.url,{method:request.method,...(request.postData?{body:request.postData}:{}),headers:request.headers})) : null;
      if (url.pathname.startsWith('/api/') && !response) throw Error(`Unexpected API: ${url.pathname}`);
      if (response) {
        const body = await response.text();
        if (!response.ok && !url.pathname.includes('/experimental/')) errors.push(`${url.pathname}: ${body}`);
        await send('Fetch.fulfillRequest',{requestId,responseCode:response.status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(body).toString('base64')});
      } else await send('Fetch.continueRequest',{requestId});
    } catch (error) {errors.push(error.message);await send('Fetch.failRequest',{requestId,errorReason:'Failed'}).catch(()=>{});}
  });
  const {targetId} = await send('Target.createTarget',{url:'about:blank'},true);
  ({sessionId} = await send('Target.attachToTarget',{targetId,flatten:true},true));
  await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'}]});
  const games = contract.games.filter(game => !process.env.GAMEPLAY_TEST_GAME || game.id === process.env.GAMEPLAY_TEST_GAME);
  for (let i=0; i<games.length; i++) {
    const game = games[i];
    await send('Page.navigate',{url:base+'/'+game.id});
    await waitFor(`location.pathname === ${JSON.stringify('/'+game.id)} && document.readyState === 'complete'`);
    await click("[...document.querySelectorAll('button')].find(b=>/start game|start case|open case|start matching|start building/i.test(b.textContent))", i%2===0);
    if (game.id === 'memory-quest') {
      for (let round=0; round<3; round++) {
        await click("document.querySelector('button[aria-label=\"row 1, column 1\"]')");
        await click("document.querySelector('#memory-quest-next')",true);
        await waitFor("!document.querySelector('#memory-quest-next')");
      }
    }
    if (game.id === 'rapid-match') {
      for (let round=0; round<2; round++) {
        await waitFor(`document.body.innerText.includes('${round+1}/2')`);
        await click("[...document.querySelectorAll('button')].find(b=>/^same/i.test(b.textContent.trim()))");
        await delay(800);
      }
    }
    // Letter, Sound and Word exercise real timeout/omission paths on short plans.
    await waitFor("document.querySelector('[data-gameplay-result]')?.innerText.includes('Model confidence:')");
    assert.equal(await evaluate('location.pathname'), '/'+game.id);
    const current = tables.game_sessions.at(-1);
    assert.equal(current.status,'completed');
    assert.ok(latestPrediction.sessionsIncluded.includes(current.id));
    assert.equal(latestPrediction.games.filter(g=>g.ready).length,i+1);
    const expected = latestPrediction.classification === 'dyslexia' ? latestPrediction.score : 1-latestPrediction.score;
    assert.equal(latestPrediction.confidence,expected);
    assert.ok((await panelText()).includes(`Model confidence: ${(expected*100).toFixed(1)}%`));
    assert.ok((await panelText()).toLowerCase().includes('simulated result'));
    assert.equal(errors.length,0,errors.join('\n'));
    await screenshot(game.id+'-desktop');
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await delay(200);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,game.id+' mobile overflow');
    await screenshot(game.id+'-mobile');
    await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
    console.log(`PASS ${game.id}: submitted trials -> server grading -> saved scores -> in-game ${latestPrediction.classification} / ${(expected*100).toFixed(1)}%, desktop/mobile`);
  }
  setMode('pending'); await click(byText('refresh result'),true);
  await waitFor("document.querySelector('[data-gameplay-result]')?.innerText.includes('not available for classification yet')");
  assert.ok(!(await panelText()).includes('Model confidence:'));
  setMode('error');await click(byText('refresh result'));
  await waitFor("document.querySelector('[data-gameplay-result]')?.innerText.includes('Could not load a prediction')");
  assert.ok(!(await panelText()).includes('Model confidence:'));
  setMode('normal');await click(byText('refresh result'),true);
  await waitFor("document.querySelector('[data-gameplay-result]')?.innerText.includes('Model confidence:')");
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'}]});
  await screenshot('result-dark');
  await click("[...document.querySelectorAll('button')].find(b=>/play again|new match/i.test(b.textContent))");
  await waitFor("!document.querySelector('[data-gameplay-result]')");
  // A fresh child fixture with only successful recall exercises the other class.
  for (const rows of Object.values(tables)) rows.length = 0;
  await send('Page.navigate',{url:base+'/memory-quest'});
  await click("document.querySelector('#memory-quest-start')");
  for (let round=0; round<3; round++) {
    await waitFor("Boolean(document.querySelector('button[aria-label=\"row 1, column 1\"]'))");
    await delay(300);
    await click("document.querySelector('button[aria-label=\"row 1, column 1\"]')");
    await click("document.querySelector('#memory-quest-next')",true);
    await waitFor("!document.querySelector('#memory-quest-next')");
  }
  await waitFor("document.querySelector('[data-gameplay-result]')?.innerText.includes('Model confidence:')");
  assert.equal(latestPrediction.classification,'no_dyslexia');
  assert.ok((await panelText()).includes('No dyslexia'));
  assert.ok((await panelText()).includes(`Model confidence: ${((1-latestPrediction.score)*100).toFixed(1)}%`));
  await screenshot('no-dyslexia-result');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: keyboard/pointer refresh, missing current session hides stale result, outage/recovery, replay clears panel. Authentication and database are fixtures.');
  console.log('Screenshots: '+out);
} finally {
  if (ws?.readyState === WebSocket.OPEN) {try {await send('Browser.close',{},true);}catch {}ws.close();}
  edge.kill();
}
