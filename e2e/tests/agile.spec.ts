import { test, expect } from '@playwright/test';
import { registerPasskey, uniqueEmail, waitForHydration } from './helpers';

test('Agile opt-in, selection, retained checked slots, keyboard order and backlog restoration', async ({ page, context }) => {
  await registerPasskey(page, context, 'Agile Planner', uniqueEmail('agile'));
  await page.goto('/agile');
  await expect(page).toHaveURL(/\/lists$/);
  await expect(page.locator('a[href="/agile"]')).toHaveCount(0);
  await page.goto('/account');
  const toggle = page.getByRole('switch', { name: 'Show Agile View' });
  await expect(toggle).toHaveAttribute('aria-checked','false');
  await toggle.click();
  await expect(page.getByText('Preferences saved.')).toBeVisible();
  const setup = await page.evaluate(async () => {
    const session = await fetch('/api/auth/refresh',{method:'POST'}).then(r => r.json());
    const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${session.accessToken}` };
    const createList = (name: string) => fetch('/api/lists',{method:'POST',headers,body:JSON.stringify({name})}).then(r=>r.json());
    const first = await createList('Agile First'); const second = await createList('Agile Second');
    const create = (list: string,title: string) => fetch(`/api/lists/${list}/items`,{method:'POST',headers,body:JSON.stringify({title})}).then(r=>r.json());
    const a = await create(first.id,'Plan A'); const b = await create(first.id,'Plan B'); const c = await create(second.id,'Plan C');
    return { a:a.id as string,b:b.id as string,c:c.id as string,first:first.id as string,second:second.id as string, aUpdated:a.updatedAt as string,cUpdated:c.updatedAt as string };
  });
  await page.goto(`/lists/${setup.first}`); await waitForHydration(page);
  await page.getByRole('button',{name:'Plan in Agile'}).first().click();
  await expect(page.getByRole('button',{name:'Plan in Agile'}).first()).toHaveAttribute('aria-pressed','true');
  await page.goto(`/lists/${setup.first}/items/${setup.b}`);
  await page.getByRole('button',{name:'Plan in Agile'}).click();
  await expect(page.getByRole('button',{name:'Plan in Agile'})).toHaveAttribute('aria-pressed','true');
  await page.goto(`/lists/${setup.second}/items/${setup.c}`);
  await page.getByRole('button',{name:'Plan in Agile'}).click();
  await expect(page.getByRole('button',{name:'Plan in Agile'})).toHaveAttribute('aria-pressed','true');
  await page.goto('/agile'); await waitForHydration(page);
  const rows = page.locator('[data-agile-id]');
  await expect(rows).toHaveCount(3);
  await page.locator(`[data-agile-id="${setup.b}"]`).getByRole('button',{name:/Mark done/i}).click();
  await expect(page.getByRole('region',{name:'Checked Agile items'})).toContainText('Plan B');
  await page.getByRole('checkbox',{name:'Hide checked'}).check();
  await expect(rows).toHaveCount(2);
  await page.getByRole('button',{name:'Move Plan C',exact:true}).focus();
  await page.keyboard.press('Alt+ArrowUp');
  await expect(rows.first()).toHaveAttribute('data-agile-id',setup.c);
  await expect(page.getByRole('button',{name:'Move Plan C',exact:true})).toBeFocused();
  await page.reload(); await expect(rows.first()).toHaveAttribute('data-agile-id',setup.c);
  await page.getByRole('checkbox',{name:'Hide checked'}).uncheck();
  await page.locator(`[data-agile-id="${setup.b}"]`).getByRole('button',{name:/Mark undone/i}).click();
  await expect(rows.nth(1)).toHaveAttribute('data-agile-id',setup.b);
  await page.getByText('Plan C',{exact:true}).click();
  await expect(page).toHaveURL(/returnTo=%2Fagile/);
  await page.getByRole('link',{name:'Back',exact:true}).click();
  await expect(page).toHaveURL(/\/agile$/);
  await page.goto('/account'); await toggle.click(); await expect(page.getByText('Preferences saved.')).toBeVisible();
  await page.goto('/agile'); await expect(page).toHaveURL(/\/lists$/);
  await page.goto('/account'); await toggle.click(); await expect(page.getByText('Preferences saved.')).toBeVisible();
  await page.goto('/agile'); await expect(rows).toHaveCount(3); await expect(rows.first()).toHaveAttribute('data-agile-id',setup.c);
  const sourceState = await page.evaluate(async ({first,second}) => {
    const session = await fetch('/api/auth/refresh',{method:'POST'}).then(r=>r.json());
    const headers = {Authorization:`Bearer ${session.accessToken}`};
    const firstItems=await fetch(`/api/lists/${first}/items`,{headers}).then(r=>r.json());
    const secondItems=await fetch(`/api/lists/${second}/items`,{headers}).then(r=>r.json());
    return [...firstItems,...secondItems];
  },setup);
  expect(sourceState.every(item=>item.sortOrder===0)).toBe(true);
  expect(Date.parse(sourceState.find(item=>item.id===setup.a).updatedAt)).toBe(Date.parse(setup.aUpdated));
  expect(Date.parse(sourceState.find(item=>item.id===setup.c).updatedAt)).toBe(Date.parse(setup.cUpdated));
  await page.screenshot({path:test.info().outputPath('agile-desktop.png')});

});

test('viewer personal planning and two-user recurrence inheritance remain separate from source edits', async ({ page, context, browser }) => {
  const viewerEmail = uniqueEmail('agile-viewer');
  await registerPasskey(page,context,'Agile Owner',uniqueEmail('agile-owner'));
  const viewerContext = await browser.newContext({ignoreHTTPSErrors:true});
  const viewerPage = await viewerContext.newPage();
  try {
    await registerPasskey(viewerPage,viewerContext,'Agile Viewer',viewerEmail);
    const setup = await page.evaluate(async (email) => {
      const session = await fetch('/api/auth/refresh',{method:'POST'}).then(r=>r.json());
      const headers = {'Content-Type':'application/json',Authorization:`Bearer ${session.accessToken}`};
      const list = await fetch('/api/lists',{method:'POST',headers,body:JSON.stringify({name:'Shared Agile'})}).then(r=>r.json());
      await fetch(`/api/lists/${list.id}/members`,{method:'POST',headers,body:JSON.stringify({email,role:'VIEWER'})});
      const item = await fetch(`/api/lists/${list.id}/items`,{method:'POST',headers,body:JSON.stringify({title:'Recurring plan',dueDate:'2026-11-15',recurrenceRule:{intervalUnit:'DAYS',intervalValue:1}})}).then(r=>r.json());
      await fetch(`/api/agile/items/${item.id}`,{method:'PUT',headers,body:'{"selected":true}'});
      return {listId:list.id as string,itemId:item.id as string};
    },viewerEmail);
    await viewerPage.goto('/account'); await viewerPage.getByRole('switch',{name:'Show Agile View'}).click();
    await expect(viewerPage.getByText('Preferences saved.')).toBeVisible();
    await viewerPage.goto('/agile'); await expect(viewerPage.getByText('Your plan is empty.',{exact:false})).toBeVisible();
    await viewerPage.goto(`/lists/${setup.listId}/items/${setup.itemId}`);
    await expect(viewerPage.getByRole('button',{name:'Delete item',exact:true})).toHaveCount(0);
    await viewerPage.getByRole('button',{name:'Plan in Agile'}).click();
    await expect(viewerPage.getByRole('button',{name:'Plan in Agile'})).toHaveAttribute('aria-pressed','true');
    await viewerPage.goto('/agile'); await expect(viewerPage.getByText('Recurring plan',{exact:true})).toBeVisible();
    await expect(viewerPage.getByRole('button',{name:/Mark done/i})).toHaveCount(0);
    await page.evaluate(async ({listId,itemId}) => {
      const session = await fetch('/api/auth/refresh',{method:'POST'}).then(r=>r.json());
      await fetch(`/api/lists/${listId}/items/${itemId}/done`,{method:'PATCH',headers:{Authorization:`Bearer ${session.accessToken}`}});
    },setup);
    await viewerPage.reload();
    await expect(viewerPage.locator('[data-agile-id]')).toHaveCount(2);
    const successor = viewerPage.locator('[data-agile-id]').first();
    await successor.getByRole('button',{name:'Plan in Agile'}).click();
    await expect(viewerPage.locator('[data-agile-id]')).toHaveCount(1);
    const ownerPlan = await page.evaluate(async () => {
      const session = await fetch('/api/auth/refresh',{method:'POST'}).then(r=>r.json());
      return fetch('/api/agile',{headers:{Authorization:`Bearer ${session.accessToken}`}}).then(r=>r.json());
    });
    expect(ownerPlan).toHaveLength(2);
    await page.evaluate(async ({listId,parentId,successorId}) => {
      const session=await fetch('/api/auth/refresh',{method:'POST'}).then(r=>r.json());
      const headers={Authorization:`Bearer ${session.accessToken}`};
      await fetch(`/api/lists/${listId}/items/${successorId}/done`,{method:'PATCH',headers});
      await fetch(`/api/lists/${listId}/items/${parentId}`,{method:'DELETE',headers});
    },{listId:setup.listId,parentId:setup.itemId,successorId:ownerPlan.find(item=>!item.done).id});
    await viewerPage.reload();
    await expect(viewerPage.locator('[data-agile-id]')).toHaveCount(0);
    await expect(viewerPage.getByText('Your plan is empty.',{exact:false})).toBeVisible();

  } finally { await viewerContext.close(); }
});

test.describe('Agile pointer planning', () => {
  test.use({ hasTouch:true, viewport:{width:390,height:620}, timezoneId:'UTC' });
  test('mouse and touch reorder across a long plan and auto-scroll the app container', async ({page,context}) => {
    test.setTimeout(60000);
    await registerPasskey(page,context,'Pointer Planner',uniqueEmail('agile-pointer'));
    const ids = await page.evaluate(async () => {
      const session = await fetch('/api/auth/refresh',{method:'POST'}).then(r=>r.json());
      const headers = {'Content-Type':'application/json',Authorization:`Bearer ${session.accessToken}`};
      await fetch('/api/users/me/preferences',{method:'PUT',headers,body:JSON.stringify({timeZone:'UTC',todayViewEnabled:true,themePreference:'SYSTEM',agileViewEnabled:true})});
      const list = await fetch('/api/lists',{method:'POST',headers,body:JSON.stringify({name:'Pointer plan'})}).then(r=>r.json());
      const ids: string[] = [];
      for(let index=0;index<20;index++) {
        const item = await fetch(`/api/lists/${list.id}/items`,{method:'POST',headers,body:JSON.stringify({title:`Pointer ${index}`})}).then(r=>r.json());
        await fetch(`/api/agile/items/${item.id}`,{method:'PUT',headers,body:'{"selected":true}'});ids.push(item.id);
      }
      return ids;
    });
    await page.goto('/agile');await waitForHydration(page);
    const rows=page.locator('[data-agile-id]');await expect(rows).toHaveCount(20);
    const scroller=page.getByTestId('app-scroll-container');
    const box=await page.getByRole('button',{name:'Move Pointer 0',exact:true}).boundingBox();
    const viewport=await scroller.boundingBox();if(!box||!viewport)throw new Error('Missing drag geometry');
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
    await page.mouse.move(box.x+box.width/2,viewport.y+viewport.height-5,{steps:20});
    await expect.poll(()=>scroller.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
    await page.mouse.up();
    await expect(page.getByRole('status')).toContainText('saved');
    const mouseOrder=await rows.evaluateAll(elements=>elements.map(e=>e.getAttribute('data-agile-id')));
    expect(mouseOrder[0]).not.toBe(ids[0]);
    await page.reload();await expect(rows.first()).toHaveAttribute('data-agile-id',mouseOrder[0]!);
    await scroller.evaluate(e=>{e.scrollTop=0;});
    const first=rows.first();const second=rows.nth(1);
    const from=await first.getByRole('button',{name:/^Move Pointer \d+$/}).boundingBox();
    const to=await second.boundingBox();if(!from||!to)throw new Error('Missing touch geometry');
    const session=await context.newCDPSession(page);
    const x=from.x+from.width/2,y=from.y+from.height/2;
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    await page.waitForTimeout(200);
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+10}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:to.y+to.height-10}]});
    await page.waitForTimeout(250);
    const touchSave = page.waitForResponse(response => response.url().endsWith('/api/agile/order') && response.status() === 204);
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await touchSave;
    await expect(rows.first()).toHaveAttribute('data-agile-id',mouseOrder[1]!);
    await page.reload();await expect(rows.first()).toHaveAttribute('data-agile-id',mouseOrder[1]!);
    await page.screenshot({path:test.info().outputPath('agile-touch.png')});
  });
});
