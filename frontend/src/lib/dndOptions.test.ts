import { describe, expect, it } from 'vitest';
import { dragAutoScrollOptions, withDragAutoScrollOptions } from './dndOptions';

describe('drag auto-scroll DnD options', () => {
	it('uses cursor detection without recentering the dragged element', () => {
		expect(dragAutoScrollOptions).toEqual({ useCursorForDetection: true });
		expect(dragAutoScrollOptions).not.toHaveProperty('centreDraggedOnCursor');
	});

	it('does not delay touch start by default', () => {
		expect(dragAutoScrollOptions).not.toHaveProperty('delayTouchStart');
	});

	it('merges shared tuning into zone-specific options', () => {
		const item = { id: 'item-1' };
		const options = withDragAutoScrollOptions({
			items: [item],
			type: 'list-card',
			flipDurationMs: 200,
			dropTargetStyle: {},
		});

		expect(options).toMatchObject({
			items: [item],
			type: 'list-card',
			flipDurationMs: 200,
			dropTargetStyle: {},
			useCursorForDetection: true,
		});
		expect(options).not.toHaveProperty('centreDraggedOnCursor');
		expect(options).not.toHaveProperty('delayTouchStart');
	});
});
