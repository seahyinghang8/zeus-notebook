<script lang="ts">
	export let disabled: boolean = false;

	$: baseClass = disabled ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500';
	$: hoverClass = disabled ? 'group-hover/send:text-gray-300' : 'group-hover/send:text-blue-400';
</script>

<button on:click class="group/send px-2" {disabled}>
	<svg
		class="{baseClass} {hoverClass} ease-in-out duration-300"
		xmlns="http://www.w3.org/2000/svg"
		width="1.5rem"
		height="1.5rem"
		viewBox="0 0 24 24"
		><path
			fill="currentColor"
			d="M1.923 9.37c-.51-.205-.504-.51.034-.689l19.086-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.475.553-.717.07L11 13L1.923 9.37zm4.89-.2l5.636 2.255l3.04 6.082l3.546-12.41L6.812 9.17z"
		/></svg
	>
</button>
