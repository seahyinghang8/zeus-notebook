<script lang="ts">
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import Notebook from './Notebook.svelte';
	import Chat from './Chat.svelte';
	import type { SvelteComponent } from 'svelte';

	let chatComponent: SvelteComponent | undefined;
	let notebookComponent: SvelteComponent | undefined;
	let windowInnerWidth: number;

	function copyToChat(ev: CustomEvent) {
		let text = ev.detail;
		chatComponent?.pasteToChat(text);
	}

	function copyToNotebook(ev: CustomEvent) {
		let text = ev.detail;
		notebookComponent?.pasteToNotebook(text);
	}
</script>

<svelte:window bind:innerWidth={windowInnerWidth} />

<svelte:head>
	<title>Zeus Notebook</title>
	<meta name="robots" content="noindex nofollow" />
	<html lang="en" />
</svelte:head>

<div class="h-screen split-pane-container">
	<Splitpanes theme="modern-theme" horizontal={windowInnerWidth < 768}>
		<Pane size={60} minSize={20}>
			<Notebook bind:this={notebookComponent} on:copyToChat={copyToChat} />
		</Pane>
		<Pane minSize={20}>
			<Chat bind:this={chatComponent} on:copyToNotebook={copyToNotebook} />
		</Pane>
	</Splitpanes>
</div>

<style>
	.split-pane-container :global(.splitpanes__pane) {
		background-color: white;
	}
</style>
