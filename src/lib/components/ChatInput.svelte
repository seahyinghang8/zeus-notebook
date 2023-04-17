<script lang="ts">
	import SendButton from '$lib/components/buttons/SendButton.svelte';
	import { createEventDispatcher, afterUpdate } from 'svelte';

	export let value: string = '';
	export let disabled = false;

	const dispatch = createEventDispatcher<{ send: string }>();

	// Using strange hack to make text area auto-resizable
	let firstUpdate = true;
	let textAreaElement: HTMLTextAreaElement | undefined;
	let textAreaHeight: number = 40;

	function handleKeyDown(ev: KeyboardEvent) {
		if (ev.key === 'Enter' && !(ev.ctrlKey || ev.altKey || ev.shiftKey)) {
			dispatch('send', value);
			textAreaHeight = 0;
			ev.preventDefault();
		}
	}

	afterUpdate(() => {
		if (
			textAreaElement !== undefined &&
			!firstUpdate &&
			textAreaElement.scrollHeight !== textAreaElement.offsetHeight
		) {
			textAreaHeight = textAreaElement.scrollHeight;
		}
		firstUpdate = false;
	});
</script>

<div class="flex-initial flex p-2 gap-1 border-t border-gray-300 items-center">
	<div class="flex-1 relative">
		<textarea
			bind:value
			bind:this={textAreaElement}
			on:keydown={handleKeyDown}
			on:input={() => {
				textAreaHeight = 0;
			}}
			placeholder="Send a message..."
			style="height: {textAreaHeight}px"
			class="
			 	w-full resize-none rounded-md p-2 -mb-1 bg-white max-h-96 overflow-y-auto
				text-base font-sans
				border border-gray-300
				focus-visible:outline focus-visible:outline-1 focus-visible:outline-blue-500
			"
		/>
	</div>
	<SendButton
		on:click={() => {
			dispatch('send', value);
		}}
		{disabled}
	/>
</div>

<style>
</style>
