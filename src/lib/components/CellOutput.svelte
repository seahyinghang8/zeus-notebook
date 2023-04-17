<script lang="ts" context="module">
	export interface Output<T> {
		type: 'stdout' | 'stderr' | 'pythonError' | 'returnValue' | 'drawDOMCanvas';
		format: 'string' | 'html' | 'latex' | 'canvas';
		value: T;
	}

	export interface DrawCanvasValue {
		pixels: Uint8Array;
		height: number;
		width: number;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import CellStatusIndicator from './CellStatusIndicator.svelte';

	export let output: Output<unknown>;
	export let cellStatus: string;

	const { type, format, value } = output;

	const displayText =
		format === 'string' && value instanceof String && value.length === 0 ? '\n' : value;

	let canvasElement: HTMLCanvasElement;
	if (type === 'drawDOMCanvas' && format === 'canvas') {
		const { height, width, pixels } = value as DrawCanvasValue;
		onMount(() => {
			canvasElement.height = height;
			canvasElement.width = width;
			let ctx = canvasElement.getContext('2d');
			if (ctx === null) {
				console.error('Cannot retrieve get 2d context for canvas');
				return;
			}
			const image = new ImageData(new Uint8ClampedArray(pixels), width, height);
			ctx.putImageData(image, 0, 0);
		});
	}

	const baseTextOutputClass = 'text-base break-words whitespace-pre-wrap font-mono';
</script>

<div class="flex my-0.5">
	{#if type === 'drawDOMCanvas'}
		<!-- type drawDOMCanvas -->
		<div class="no-status-indicator">
			<canvas bind:this={canvasElement} />
		</div>
	{:else if type === 'returnValue'}
		<!-- type returnValue -->
		<CellStatusIndicator {cellStatus} />
		<!-- TODO - use format to show return value for html and latex -->
		<pre class="{baseTextOutputClass} text-gray-900">{displayText}</pre>
	{:else if type === 'stdout'}
		<!-- type stdout -->
		<pre class="{baseTextOutputClass} text-gray-900 no-status-indicator">{displayText}</pre>
	{:else}
		<!-- type stderr and python error -->
		<pre class="{baseTextOutputClass} text-red-500 no-status-indicator">{displayText}</pre>
	{/if}
</div>

<style>
	.no-status-indicator {
		margin-left: 4rem;
	}
</style>
