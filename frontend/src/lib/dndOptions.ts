import type { Item, Options } from 'svelte-dnd-action';

export const dragAutoScrollOptions = {
	useCursorForDetection: true,
} satisfies Pick<Options, 'useCursorForDetection' | 'centreDraggedOnCursor' | 'delayTouchStart'>;

export function withDragAutoScrollOptions<T extends Item>(options: Options<T>): Options<T> {
	return {
		...options,
		...dragAutoScrollOptions,
	};
}
