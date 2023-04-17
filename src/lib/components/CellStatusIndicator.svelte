<script lang="ts">
	export let cellStatus: string;
</script>

<div
	class="status-indicator text-gray-400 text-base text-center
        {cellStatus === '' && 'brackets-apart'}"
>
	[ {cellStatus} ]
</div>

<style>
	.status-indicator {
		margin-top: -0.8px;
		width: 4rem;
	}

	.brackets-apart {
		letter-spacing: 0.2rem;
	}
</style>
