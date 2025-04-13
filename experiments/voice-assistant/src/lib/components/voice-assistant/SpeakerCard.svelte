<script lang="ts">
	import type { Speaker } from './types';
	import { speakerStore } from './stores/speakerStore';

	// Props
	export let speaker: Speaker;
	export let isActive: boolean;
	export let listening: boolean;
	export let useGoogleDetection: boolean = false;

	// Handle speaker name update
	function handleUpdateName(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		speakerStore.updateSpeakerName(speaker.id, target.value);
	}

	// Handle speaker removal
	function handleRemove() {
		speakerStore.removeSpeaker(speaker.id);
	}

	// Handle setting active speaker
	function handleSetActive() {
		speakerStore.setActiveSpeaker(speaker.id);
	}
</script>

<div
	class={`relative rounded-lg border-l-4 shadow-sm ${
		isActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
	} transition-all`}
>
	<div class="p-3">
		<!-- Status indicator when active -->
		{#if speaker.isActive}
			<span
				class="absolute right-3 top-3 block h-2.5 w-2.5 animate-pulse rounded-full bg-green-400 ring-1 ring-white"
			></span>
		{/if}

		<!-- Speaker info and controls -->
		<div class="mb-1.5 flex items-center">
			<div
				class={`mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${speaker.color}`}
				aria-label="Speaker avatar"
				class:opacity-60={!listening}
			>
				<span class="text-sm font-medium">{speaker.name.charAt(0).toUpperCase()}</span>
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex items-center">
					<input
						type="text"
						value={speaker.name}
						on:change={handleUpdateName}
						class="w-full truncate border-none bg-transparent p-0 text-sm font-medium focus:outline-none focus:ring-0"
					/>
					{#if speaker.voiceProfile}
						<span
							title="Auto-detected speaker"
							class="ml-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">Auto</span
						>
					{/if}
				</div>
				<p class="text-xs text-gray-500">
					{#if speaker.isActive}
						<span class="text-green-600">Currently speaking</span>
					{:else if isActive}
						<span class="text-blue-600">Detected</span>
					{:else}
						<span>Inactive</span>
					{/if}
				</p>
			</div>
			<button
				on:click={handleRemove}
				class="ml-1 text-gray-400 hover:text-gray-500 focus:outline-none"
				aria-label="Remove speaker"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
					<path
						d="M6 18L18 6M6 6L18 18"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>

		<!-- Select as speaker button -->
		{#if useGoogleDetection && listening}
			<div class="mt-2 flex justify-between">
				<button
					on:click={handleSetActive}
					class="flex-grow rounded bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none"
					title="Associate this speaker with the current Google speaker"
				>
					<div class="flex items-center justify-center">
						<svg class="mr-1 h-3 w-3" viewBox="0 0 24 24" fill="none">
							<path
								d="M12 15.5C14.21 15.5 16 13.71 16 11.5V6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6V11.5C8 13.71 9.79 15.5 12 15.5Z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M12 15.5V19.5"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						{speaker.voiceProfile?.googleSpeakerId
							? `Mapped to Speaker ${speaker.voiceProfile.googleSpeakerId}`
							: 'Map to current speaker'}
					</div>
				</button>
			</div>
		{/if}
	</div>
</div>
