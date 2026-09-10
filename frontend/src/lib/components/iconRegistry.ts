import type { Component } from 'svelte';
import AlarmClock from '@lucide/svelte/icons/alarm-clock';
import ArrowDown from '@lucide/svelte/icons/arrow-down';
import ArrowUp from '@lucide/svelte/icons/arrow-up';
import CalendarDays from '@lucide/svelte/icons/calendar-days';
import Check from '@lucide/svelte/icons/check';
import ChevronDown from '@lucide/svelte/icons/chevron-down';
import ChevronLeft from '@lucide/svelte/icons/chevron-left';
import ChevronRight from '@lucide/svelte/icons/chevron-right';
import ChevronUp from '@lucide/svelte/icons/chevron-up';
import Circle from '@lucide/svelte/icons/circle';
import CircleCheck from '@lucide/svelte/icons/circle-check';
import GripVertical from '@lucide/svelte/icons/grip-vertical';
import Group from '@lucide/svelte/icons/group';
import List from '@lucide/svelte/icons/list';
import Menu from '@lucide/svelte/icons/menu';
import NotebookText from '@lucide/svelte/icons/notebook-text';
import Pencil from '@lucide/svelte/icons/pencil';
import Plus from '@lucide/svelte/icons/plus';
import Repeat from '@lucide/svelte/icons/repeat';
import Save from '@lucide/svelte/icons/save';
import Star from '@lucide/svelte/icons/star';
import Tag from '@lucide/svelte/icons/tag';
import Trash2 from '@lucide/svelte/icons/trash-2';
import UserRound from '@lucide/svelte/icons/user-round';
import X from '@lucide/svelte/icons/x';

export type AppIconName =
	| 'assignee'
	| 'back'
	| 'cancel'
	| 'category'
	| 'check'
	| 'close'
	| 'collapse'
	| 'date'
	| 'delete'
	| 'done'
	| 'drag'
	| 'edit'
	| 'expand'
	| 'group'
	| 'list'
	| 'menu'
	| 'next'
	| 'notes'
	| 'plus'
	| 'recurrence'
	| 'save'
	| 'sortAscending'
	| 'sortDescending'
	| 'star'
	| 'status'
	| 'time';

export interface IconSizePreset {
	size: number;
	strokeWidth: number;
}

export interface IconTouchTargetPreset {
	className: string;
}

export type IconSizePresetName =
	| 'action'
	| 'compact'
	| 'metadata'
	| 'header'
	| 'control'
	| 'controlCompact'
	| 'itemStatus';

export type IconTouchTargetPresetName = 'control' | 'controlCompact' | 'header';

export const iconSizePresets: Record<IconSizePresetName, IconSizePreset> = {
	action: { size: 18, strokeWidth: 2 },
	compact: { size: 16, strokeWidth: 2 },
	metadata: { size: 14, strokeWidth: 2 },
	header: { size: 24, strokeWidth: 2.75 },
	control: { size: 18, strokeWidth: 2 },
	controlCompact: { size: 16, strokeWidth: 2 },
	itemStatus: { size: 24, strokeWidth: 2.5 }
};

export const iconTouchTargetPresets: Record<IconTouchTargetPresetName, IconTouchTargetPreset> = {
	control: { className: 'h-10 w-10 rounded-lg p-0' },
	controlCompact: { className: 'h-8 w-8 rounded p-0' },
	header: { className: 'h-11 w-11 rounded-lg p-0' }
};

export const appIcons: Record<AppIconName, Component<any>> = {
	assignee: UserRound,
	back: ChevronLeft,
	cancel: X,
	category: Tag,
	check: Check,
	close: X,
	collapse: ChevronUp,
	date: CalendarDays,
	delete: Trash2,
	done: CircleCheck,
	drag: GripVertical,
	edit: Pencil,
	expand: ChevronDown,
	group: Group,
	list: List,
	menu: Menu,
	next: ChevronRight,
	notes: NotebookText,
	plus: Plus,
	recurrence: Repeat,
	save: Save,
	sortAscending: ArrowUp,
	sortDescending: ArrowDown,
	star: Star,
	status: Circle,
	time: AlarmClock
};
