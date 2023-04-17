<script lang="ts">
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';
	import Messages from '$lib/components/Messages.svelte';
	import { Configuration, OpenAIApi } from 'openai';
	import { type SvelteComponent, onMount } from 'svelte';
	import { getChatModels, type OpenaiModelInfo } from '$lib/functions/parser';
	import { firstAssistantMessage, systemMessage } from '$lib/functions/prompts';
	import type { MessageData } from '$lib/components/Message.svelte';

	export function pasteToChat(text: string) {
		userInput += text;
	}

	const storageApiKey = 'OPENAI_API_KEY';
	const storageModelKey = 'CHOSEN_MODEL';

	let settingModalComponent: SvelteComponent | undefined;
	let userInput: string = '';
	let messages: MessageData[] = [];
	let apiKey: string | null = null;
	let chosenModel: string | null = null;
	let availableModels: string[] = [];
	let apiKeyIssue: string | undefined = 'Oh no, your API key is not valid!!';

	if (typeof localStorage !== 'undefined') {
		apiKey = localStorage.getItem(storageApiKey);
		chosenModel = localStorage.getItem(storageModelKey);
	}

	$: if (typeof localStorage !== 'undefined' && apiKey !== null) {
		localStorage.setItem(storageApiKey, apiKey);
	}

	$: if (typeof localStorage !== 'undefined' && chosenModel !== null) {
		localStorage.setItem(storageModelKey, chosenModel);
	}

	// Setup to get openai key and chosen model
	let configuration: Configuration | undefined;
	let openai: OpenAIApi | undefined;
	let openaiInitialized: boolean = false;
	$: if (apiKey !== null && apiKey.length > 0) {
		configuration = new Configuration({
			apiKey
		});
		delete configuration.baseOptions.headers['User-Agent'];
		openai = new OpenAIApi(configuration);
		openai
			.listModels()
			.then((response) => {
				apiKeyIssue = undefined;
				availableModels = getChatModels(response.data.data as any as OpenaiModelInfo[]);
				openaiInitialized = true;
			})
			.catch((reason) => {
				const errorMessage = reason.response?.data?.error?.message;
				if (errorMessage !== undefined) {
					console.error(errorMessage);
					apiKeyIssue = errorMessage;
				} else {
					console.error('Error retrieving model list from openai');
					apiKeyIssue = 'Unknown error retrieving model list from openai. Please try again.';
				}
				openaiInitialized = false;
			});
	}

	onMount(() => {
		// Set the first message from the assistant
		messages = [
			...messages,
			{
				role: 'assistant',
				content: firstAssistantMessage
			}
		];
	});

	let isGeneratingResponse: boolean = false;
	async function requestAssistantResponse() {
		if (openai === undefined || chosenModel === null) return;
		isGeneratingResponse = true;
		try {
			const completion = await openai.createChatCompletion({
				model: chosenModel,
				messages: [{ role: 'system', content: systemMessage }, ...messages]
			});
			const assistantMessage = completion.data.choices[0].message as MessageData;
			messages = [...messages, assistantMessage];
		} catch (e) {
			console.error(e);
		} finally {
			isGeneratingResponse = false;
		}
	}

	$: userInputDisabled =
		userInput.length === 0 ||
		!openaiInitialized ||
		chosenModel === null ||
		isGeneratingResponse === true;

	function sendChatMessage() {
		if (userInputDisabled) {
			if (!openaiInitialized || chosenModel === null) {
				settingModalComponent?.toggle();
			}
			return;
		}
		messages = [
			...messages,
			{
				role: 'user',
				content: userInput
			}
		];
		requestAssistantResponse();
		// reset user input
		userInput = '';
	}
</script>

<!-- Place the modal on the top right corner of the page -->
<div class="absolute top-0 right-0 z-10">
	<SettingsModal
		bind:this={settingModalComponent}
		bind:apiKey
		bind:availableModels
		bind:chosenModel
		{apiKeyIssue}
	/>
</div>
<div class="flex flex-col h-screen z-0">
	<!-- Messages -->
	<Messages bind:messages on:copyToNotebook {isGeneratingResponse} />
	<!-- User Input -->
	<ChatInput bind:value={userInput} bind:disabled={userInputDisabled} on:send={sendChatMessage} />
</div>
