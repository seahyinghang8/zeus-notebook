<script lang="ts">
	import { beforeUpdate, afterUpdate } from 'svelte';
	import ShuffleIcon from '$lib/components/ShuffleIcon.svelte';
	import Message, { type MessageData } from '$lib/components/Message.svelte';

	export let messages: MessageData[] = [];
	export let isGeneratingResponse: boolean;

	let messagesElement: HTMLDivElement | undefined;
	let autoscroll: boolean = true;

	beforeUpdate(() => {
		if (messagesElement === undefined) return;
		autoscroll =
			messagesElement &&
			messagesElement.offsetHeight + messagesElement.scrollTop > messagesElement.scrollHeight - 20;
	});

	afterUpdate(() => {
		if (autoscroll) {
			setTimeout(() => {
				messagesElement?.scrollTo(0, messagesElement.scrollHeight);
			});
		}
	});
</script>

<div bind:this={messagesElement} class="overflow-y-auto flex-1 p-2">
	{#each messages as message}
		<div class="chat {message.role === 'assistant' ? 'chat-start' : 'chat-end'}">
			<Message {message} on:copyToNotebook />
		</div>
	{/each}
	{#if isGeneratingResponse}
		<div class="chat chat-start">
			<div class="chat-bubble bg-teal-600">
				<ShuffleIcon />
			</div>
		</div>
	{/if}
</div>
