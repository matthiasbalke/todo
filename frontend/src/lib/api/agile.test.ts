import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./authedClient',()=>({authedFetch:vi.fn()}));
import { authedFetch } from './authedClient';
import { getAgileItems,getAgileCount,selectAgileItem,reorderAgile } from './agile';
beforeEach(()=>vi.clearAllMocks());
it('uses authenticated Agile contracts without request-supplied owners',async()=>{
  vi.mocked(authedFetch).mockResolvedValueOnce([]).mockResolvedValueOnce({count:2}).mockResolvedValueOnce({selected:true,count:3}).mockResolvedValueOnce(undefined);
  await getAgileItems();expect(await getAgileCount()).toBe(2);await selectAgileItem('item',true);await reorderAgile(['b','a']);
  expect(authedFetch).toHaveBeenNthCalledWith(1,'/api/agile',undefined,fetch);
  expect(authedFetch).toHaveBeenNthCalledWith(3,'/api/agile/items/item',{method:'PUT',body:'{"selected":true}'});
  expect(authedFetch).toHaveBeenNthCalledWith(4,'/api/agile/order',{method:'PUT',body:'{"itemIds":["b","a"]}'});
});
