<script lang="ts" context="module">
	export type ExecutionState = 'new' | 'queued' | 'executing' | 'done';

	interface ExecutionDispatch {
		cellId: string;
		value: string;
		ctrlKey?: boolean;
		altKey?: boolean;
		shiftKey?: boolean;
	}
</script>

<script lang="ts">
	import CellControls from '$lib/components/CellControls.svelte';
	import CellStatusIndicator from '$lib/components/CellStatusIndicator.svelte';
	import CellOutput, { type Output } from '$lib/components/CellOutput.svelte';
	import CodeMirror from '$lib/components/Codemirror.svelte';
	import { EditorView } from '@codemirror/view';
	import { python } from '@codemirror/lang-python';
	import { basicLight } from 'cm6-theme-basic-light';

	import { SvelteComponent, createEventDispatcher } from 'svelte';
	import { combineCodeAndOutputToString } from '$lib/functions/parser';

	export let id: string;
	export let value: string = '';
	export let outputs: Output<unknown>[];
	export let executionIndex: number | undefined;
	export let executionState: ExecutionState;
	export let selected: boolean;

	export function unfocus() {
		cellElement?.blur();
		editorComponent?.blur();
	}

	export function focusCell() {
		cellElement?.focus();
	}

	export function focusEditor() {
		editorComponent?.focus();
	}

	let cellElement: HTMLDivElement;
	let editorComponent: SvelteComponent;
	let editorFocused = false;
	let combinedFocused = false;
	let mainCursorPos = 0;
	let prevCursorPosAtKeydown = 0;

	const dispatch = createEventDispatcher<{
		execute: ExecutionDispatch;
		focus: void;
		blur: void;
		goToNextCell: { focusEditor: boolean };
		goToPrevCell: { focusEditor: boolean };
		delete: void;
		copyToChat: string;
	}>();

	$: if (combinedFocused) {
		dispatch('focus');
	} else {
		dispatch('blur');
	}

	function handleCellKeydown(ev: KeyboardEvent) {
		switch (ev.key) {
			case 'Enter': {
				ev.stopImmediatePropagation();
				if (ev.ctrlKey) {
					dispatch('execute', {
						cellId: id,
						value,
						ctrlKey: true
					});
					cellElement.focus();
				} else if (ev.shiftKey) {
					dispatch('execute', {
						cellId: id,
						value,
						shiftKey: true
					});
				} else if (ev.altKey) {
					dispatch('execute', {
						cellId: id,
						value,
						altKey: true
					});
				} else {
					// Enter key with no modifier keys
					// Focus on editor if editor not already
					if (!editorFocused) {
						ev.preventDefault();
						editorComponent?.focus();
					}
				}
				break;
			}
			case 'Escape': {
				if (editorFocused) {
					cellElement?.focus();
				} else if (combinedFocused) {
					cellElement?.blur();
				}
				break;
			}
			case 'ArrowUp': {
				if (!editorFocused) {
					dispatch('goToPrevCell', { focusEditor: false });
				} else if (mainCursorPos === 0 && mainCursorPos === prevCursorPosAtKeydown) {
					dispatch('goToPrevCell', { focusEditor: true });
				}
				break;
			}
			case 'ArrowDown': {
				if (!editorFocused) {
					dispatch('goToNextCell', { focusEditor: false });
				} else if (mainCursorPos === value.length && mainCursorPos === prevCursorPosAtKeydown) {
					dispatch('goToNextCell', { focusEditor: true });
				}
				break;
			}
			case 'Delete':
			case 'Backspace': {
				if (!editorFocused) {
					dispatch('delete');
				}
			}
		}
		prevCursorPosAtKeydown = mainCursorPos;
	}

	const fontSizeTheme = EditorView.theme({
		'&': {
			fontSize: '1rem'
		}
	});

	let cellStatus: string;
	$: switch (executionState) {
		case 'new':
			cellStatus = '';
			break;
		case 'queued':
			cellStatus = '...';
			break;
		case 'executing':
			cellStatus = '*';
			break;
		case 'done':
			cellStatus = `${executionIndex}`;
			break;
	}
</script>

<div
	class="cell flex py-3 group/cell"
	tabindex="-1"
	bind:this={cellElement}
	on:keydown={handleCellKeydown}
	on:focus={(ev) => {
		// acquired focus from element NOT inner code editor
		if (!(ev.relatedTarget instanceof Node && cellElement.contains(ev.relatedTarget))) {
			combinedFocused = true;
		}
	}}
	on:blur={(ev) => {
		// lost focus from element NOT inner code editor
		if (!(ev.relatedTarget instanceof Node && cellElement.contains(ev.relatedTarget))) {
			combinedFocused = false;
		}
	}}
>
	<div
		class="flex-none selected-indicator rounded {selected
			? combinedFocused
				? 'bg-blue-500'
				: 'bg-gray-400'
			: ''}"
	/>
	<div class="flex-1 code-and-output">
		<div class="flex">
			<div class="flex-none status-container">
				<CellStatusIndicator {cellStatus} />
			</div>
			<div class="flex-1 code-container relative">
				<CellControls
					on:play={() => {
						dispatch('execute', {
							cellId: id,
							value
						});
						cellElement.focus();
					}}
					on:delete={() => {
						dispatch('delete');
					}}
					on:copy={() => {
						dispatch('copyToChat', combineCodeAndOutputToString(value, outputs));
					}}
				/>
				<CodeMirror
					bind:this={editorComponent}
					bind:value
					bind:mainCursorPos
					lang={python()}
					extensions={[fontSizeTheme]}
					theme={basicLight}
					on:focus={(ev) => {
						editorFocused = true;
						// acquired focus from NOT parent cell element
						if (!(ev.detail instanceof Node && ev.detail === cellElement)) {
							combinedFocused = true;
						}
					}}
					on:blur={(ev) => {
						editorFocused = false;
						// lost focus from NOT parent cell element
						if (!(ev.detail instanceof Node && ev.detail === cellElement)) {
							combinedFocused = false;
						}
					}}
				/>
			</div>
		</div>
		<div class="text-base {outputs.length > 0 && 'mt-2'}">
			{#each outputs as output}
				<CellOutput {output} {cellStatus} />
			{/each}
		</div>
	</div>
</div>

<style>
	.cell:focus-visible {
		outline: none;
	}

	.selected-indicator {
		width: 0.4rem;
	}

	.code-and-output {
		width: calc(100% - 0.4rem);
	}

	.status-container {
		width: 4rem;
		padding-top: 2.3px;
	}

	.code-container {
		width: calc(100% - 5rem);
	}

	.brackets-apart {
		letter-spacing: 4px;
	}
</style>
