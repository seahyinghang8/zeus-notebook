<script lang="ts">
	import PlayButton from '$lib/components/buttons/PlayButton.svelte';
	import { createEventDispatcher } from 'svelte';
	import DeleteButton from '$lib/components/buttons/DeleteButton.svelte';
	import ChatButton from '$lib/components/buttons/ChatButton.svelte';

	const dispatch = createEventDispatcher<{ play: void; copy: void; delete: void }>();
</script>

<div
	class="absolute flex gap-2 top-1 right-2 opacity-0 group-hover/cell:opacity-100 group-hover/cell:z-10 ease-in-out duration-300"
>
	<div class="tooltip" data-tip="Run Cell">
		<PlayButton
			on:click={() => {
				dispatch('play');
			}}
		/>
	</div>
	<div class="tooltip" data-tip="Copy to Chat">
		<ChatButton
			on:click={() => {
				dispatch('copy');
			}}
		/>
	</div>
	<div class="tooltip" data-tip="Delete Cell">
		<DeleteButton
			on:click={() => {
				dispatch('delete');
			}}
		/>
	</div>
</div>
