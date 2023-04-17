<script lang="ts">
	import Cell, { type ExecutionState } from '$lib/components/Cell.svelte';
	import { SvelteComponent, onMount, tick } from 'svelte';
	import PyodideRunner from '$lib/functions/pyodide.runner';
	import type { Output } from '$lib/components/CellOutput.svelte';

	export async function pasteToNotebook(text: string) {
		const nextCell = insertCell();
		nextCell.value = text;
		await tick();
		nextCell.cellComponent?.focusEditor();
	}

	let notebookElement: HTMLDivElement;
	const runner = new PyodideRunner();

	runner.onPyodideLoaded = () => {
		console.debug('Webworker has loaded pyodide.');
	};

	onMount(async () => {
		// Start with one cell
		insertCell();
		const PyodideWorker = await import('$lib/workers/pyodide.worker?worker');
		runner.addWorker(new PyodideWorker.default());
	});

	interface CellData {
		id: string;
		executionState: ExecutionState;
		executionIndex?: number;
		value: string;
		outputs: Output<unknown>[];
		cellComponent?: SvelteComponent;
	}

	let selectedCellId: string | undefined;
	let cells: CellData[] = [];

	// cell will be inserted to the end if index is not provided
	function insertCell(index?: number): CellData {
		const newCell: CellData = {
			id: crypto.randomUUID(),
			value: '',
			executionState: 'new',
			outputs: []
		};
		if (index === undefined) {
			cells = [...cells, newCell];
		} else {
			cells = [...cells.slice(0, index), newCell, ...cells.slice(index)];
		}
		return newCell;
	}

	function deleteCell(index: number) {
		cells = [...cells.slice(0, index), ...cells.slice(index + 1)];
	}

	function getCellIndexById(cellId: string) {
		return cells.findIndex((cell) => cell.id === cellId);
	}

	function getCellIndexByExecutionIndex(executionIndex: number) {
		return cells.findIndex((cell) => cell.executionIndex === executionIndex);
	}

	async function handleCellExecute(ev: CustomEvent) {
		let { cellId, value }: { cellId: string; value: string } = ev.detail;
		const cellIndex = getCellIndexById(cellId);
		if (cellIndex === -1) {
			console.error(`Cell of id ${cellId} cannot be found`);
			return;
		}
		const cell = cells[cellIndex];
		// Do not reprocess cells that are being processed
		if (!['queued', 'executing'].includes(cell.executionState)) {
			// Clear
			cell.outputs = [];
			// Reset cell state if code is only whitespace or empty
			if (value.trim().length === 0) {
				cell.executionState = 'new';
				cells[cellIndex] = cell;
			} else {
				// Add cell to queue
				cell.executionState = 'queued';
				cell.executionIndex = runner.addToExecutionQueue(value);
				cells[cellIndex] = cell;
			}
		}

		if (ev.detail.shiftKey && cellIndex < cells.length - 1) {
			// Jump to the next cell
			const nextCell = cells[cellIndex + 1];
			nextCell.cellComponent?.focusEditor();
		} else if (ev.detail.altKey || ev.detail.shiftKey) {
			// Insert and focus on next cell
			const nextCell = insertCell(cellIndex + 1);
			await tick();
			nextCell.cellComponent?.focusEditor();
		}
	}

	runner.onExecutionStart = (index) => {
		const cellIndex = getCellIndexByExecutionIndex(index);
		if (cellIndex === -1) {
			console.warn('Cell to be executed can no longer be found. Skipping execution');
			return false;
		}
		runner.onOutput = (output) => {
			const cellIndex = getCellIndexByExecutionIndex(index);
			if (cellIndex === -1) {
				console.warn('Output for cell can no longer be found');
				return;
			}
			const cell = cells[cellIndex];
			cell.outputs.push(output);
			cells[cellIndex] = cell;
		};
		// Set cell to be in executing state
		const cell = cells[cellIndex];
		cell.executionState = 'executing';
		cells[cellIndex] = cell;
		return true;
	};

	runner.onExecutionCompleted = (index) => {
		const cellIndex = getCellIndexByExecutionIndex(index);
		if (cellIndex === -1) {
			console.warn('Cell to be executed can no longer be found. Skipping execution');
		}
		// Clear runner output from cell
		delete runner.onOutput;
		// Set cell to be done
		const cell = cells[cellIndex];
		cell.executionState = 'done';
		cells[cellIndex] = cell;
	};
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="py-3 px-6 h-screen overflow-y-auto"
	bind:this={notebookElement}
	on:click={(ev) => {
		if (ev.target === notebookElement) {
			selectedCellId = undefined;
		}
	}}
>
	{#each cells as { id, outputs, value, executionIndex, executionState, cellComponent }, cellIndex}
		<Cell
			on:execute={handleCellExecute}
			bind:this={cellComponent}
			bind:value
			{id}
			{outputs}
			{executionIndex}
			{executionState}
			selected={selectedCellId === id}
			on:focus={() => {
				selectedCellId = id;
			}}
			on:goToPrevCell={(ev) => {
				const prevCellIndex = cellIndex - 1;
				if (prevCellIndex < 0) return;
				const prevCell = cells[prevCellIndex];
				if (ev.detail.focusEditor) {
					prevCell.cellComponent?.focusEditor();
				} else {
					prevCell.cellComponent?.focusCell();
				}
			}}
			on:goToNextCell={(ev) => {
				const nextCellIndex = cellIndex + 1;
				if (nextCellIndex >= cells.length) return;
				const nextCell = cells[nextCellIndex];
				if (ev.detail.focusEditor) {
					nextCell.cellComponent?.focusEditor();
				} else {
					nextCell.cellComponent?.focusCell();
				}
			}}
			on:delete={async () => {
				cellComponent?.unfocus();
				deleteCell(cellIndex);
			}}
			on:copyToChat
		/>
	{/each}
	<div
		class="flex cursor-pointer items-center gap-2 group/add pt-1 pb-6"
		on:click={async () => {
			const nextCell = insertCell();
			await tick();
			nextCell.cellComponent?.focusEditor();
		}}
	>
		<div class="flex-1 h-px bg-gray-300 group-hover/add:bg-blue-400 ease-in-out duration-300" />
		<div
			class="flex-none text-sm text-gray-400 group-hover/add:text-blue-400 ease-in-out duration-300"
		>
			+ Add Cell
		</div>
		<div class="flex-1 h-px bg-gray-300 group-hover/add:bg-blue-400 ease-in-out duration-300" />
	</div>
</div>
