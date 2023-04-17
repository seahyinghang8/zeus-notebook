<script lang="ts" context="module">
	export interface MessageData {
		role: 'assistant' | 'user';
		content: string;
	}
</script>

<script lang="ts">
	import { parseCodeAndTextContent } from '$lib/functions/parser';
	import CodeMirror from '$lib/components/Codemirror.svelte';
	import { EditorView } from '@codemirror/view';
	import { python } from '@codemirror/lang-python';
	import { basicDark } from 'cm6-theme-basic-dark';
	import CopyButton from '$lib/components/buttons/CopyButton.svelte';
	import { createEventDispatcher } from 'svelte';

	export let message: MessageData;

	let dispatch = createEventDispatcher<{ copyToNotebook: string }>();

	let parsedContents = parseCodeAndTextContent(message.content);
	const fontSizeTheme = EditorView.theme({
		'&': {
			fontSize: '1rem',
			border: '1px solid #c0c0c0'
		},
		'&.cm-editor.cm-focused': {
			outline: 'none'
		}
	});
</script>

<div class="chat-bubble {message.role === 'assistant' ? 'bg-teal-600' : 'bg-gray-500'}">
	{#each parsedContents as { type, content }}
		{#if type === 'text'}
			<pre class="text-base text-white break-words whitespace-pre-wrap font-sans">{content}</pre>
		{:else if type === 'output'}
			<pre class="text-base text-white break-words whitespace-pre-wrap font-mono">{content}</pre>
		{:else if type === 'python'}
			<div class="my-2">
				<div
					class="flex items-center justify-between rounded-t bg-gray-700 text-white font-mono text-sm px-2 py-1"
				>
					<p>python</p>
					{#if message.role === 'assistant'}
						<div class="tooltip" data-tip="Copy to Notebook">
							<CopyButton
								on:click={() => {
									dispatch('copyToNotebook', content);
								}}
							/>
						</div>
					{/if}
				</div>
				<CodeMirror
					value={content}
					readonly
					lang={python()}
					extensions={[fontSizeTheme]}
					theme={basicDark}
				/>
			</div>
		{/if}
	{/each}
</div>
