let _isDraggingAny = $state(false);

export function isDraggingAny(): boolean {
	return _isDraggingAny;
}

export function setDraggingAny(value: boolean): void {
	_isDraggingAny = value;
}
