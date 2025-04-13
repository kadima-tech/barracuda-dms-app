<script lang="ts">
	// Props
	export let listening: boolean;

	// Events
	export let onToggleListening: () => void;
</script>

<div
	class="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4"
>
	<div class="flex items-center">
		<div class="relative mr-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
				<svg
					class="h-5 w-5 text-indigo-600"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12 15.5C14.21 15.5 16 13.71 16 11.5V6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6V11.5C8 13.71 9.79 15.5 12 15.5Z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M4.34961 9.65002V11.35C4.34961 15.57 7.77961 19 11.9996 19C16.2196 19 19.6496 15.57 19.6496 11.35V9.65002"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M12 19V22"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</div>
			{#if listening}
				<span
					class="absolute right-0 top-0 block h-2.5 w-2.5 animate-pulse rounded-full bg-green-400 ring-2 ring-white"
				></span>
			{/if}
		</div>
		<div>
			<h2 class="text-lg font-medium text-gray-800">Voice Assistant</h2>
			<p class="text-xs text-gray-500">
				{listening ? 'Listening...' : 'Ready to listen'}
			</p>
		</div>
	</div>

	<!-- Voice control button -->
	<button
		class="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 focus:outline-none"
		class:bg-red-100={listening}
		class:text-red-600={listening}
		class:bg-indigo-100={!listening}
		class:text-indigo-600={!listening}
		on:click={onToggleListening}
	>
		{#if listening}
			<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M16 8L8 16M8 8L16 16"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		{:else}
			<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M12 15.5C14.21 15.5 16 13.71 16 11.5V6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6V11.5C8 13.71 9.79 15.5 12 15.5Z"
					fill="currentColor"
				/>
				<path
					d="M4.34961 9.65002V11.35C4.34961 15.57 7.77961 19 11.9996 19C16.2196 19 19.6496 15.57 19.6496 11.35V9.65002"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M12 19V22"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		{/if}
	</button>
</div>
