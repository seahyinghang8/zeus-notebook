<script lang="ts">
	import GearButton from '$lib/components/buttons/GearButton.svelte';
	import CloseButton from '$lib/components/buttons/CloseButton.svelte';

	export let apiKey: string | null;
	export let apiKeyIssue: string | undefined;
	export let availableModels: string[];
	export let chosenModel: string | null = null;

	export function toggle() {
		labelElement?.click();
	}

	let labelElement: HTMLLabelElement | undefined;
</script>

<!-- The button to open modal -->
<label bind:this={labelElement} for="settings-modal">
	<GearButton />
</label>

<input type="checkbox" id="settings-modal" class="modal-toggle" />
<label for="settings-modal" class="modal cursor-pointer">
	<label class="relative bg-white p-4 rounded max-w-[30rem]" for="">
		<div class="flex flex-col gap-3">
			<div class="flex justify-between items-center mb-2">
				<h3 class="text-lg font-semibold text-gray-800">Settings</h3>
				<label for="settings-modal">
					<CloseButton />
				</label>
			</div>
			<div class="flex flex-col gap-2 text-sm text-gray-500">
				<p>
					Enter your openai API key to enable chat functionality. API keys are only stored locally
					on your browser.
					<a class="link" href="https://platform.openai.com/account/api-keys"
						>Get your API key here.</a
					>
				</p>
				<input
					type="password"
					placeholder="OpenAI API key"
					bind:value={apiKey}
					on:keydown={(ev) => {
						if (ev.key === 'Enter') {
							ev.preventDefault();
							toggle();
						}
					}}
					class="
						input w-full border border-gray-300
						focus-visible:outline focus-visible:outline-offset-0 focus-visible:outline-1 focus-visible:outline-blue-500"
				/>
				{#if apiKeyIssue !== undefined}
					<p class="text-red-400">
						{apiKeyIssue}
					</p>
				{/if}
			</div>
			{#if availableModels !== undefined && availableModels.length > 0}
				<div class="flex flex-col gap-2 text-sm text-gray-500 font-normal">
					<p>Models</p>
					<select
						bind:value={chosenModel}
						class="select w-full border border-gray-300
						focus-visible:outline focus-visible:outline-offset-0 focus-visible:outline-1 focus-visible:outline-blue-500"
					>
						{#each availableModels as model}
							<option>{model}</option>
						{/each}
					</select>
				</div>
			{/if}
			<p class="pt-6 text-xs text-gray-500">
				Made by Ying Hang Seah. <a
					class="link"
					href="https://github.com/seahyinghang8/zeus-notebook">Link to GitHub</a
				>
			</p>
		</div>
	</label>
</label>
