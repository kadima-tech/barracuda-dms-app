<script lang="ts">
	import {
		speakerStore,
		speakers,
		showAddSpeaker,
		newSpeakerName,
		activeSpeakerId
	} from './stores/speakerStore';
	import type { Speaker } from './types';
	import SpeakerCard from './SpeakerCard.svelte';

	// Props that still need to be passed from parent
	export let speakerDetectionEnabled: boolean;
	export let listening: boolean;
	export let useGoogleDetection: boolean = false;

	// Events that still need to be passed from parent
	export let onToggleSpeakerDetection: () => void;

	// Handle toggle add speaker
	function handleToggleAddSpeaker() {
		speakerStore.toggleAddSpeaker();
	}

	// Handle add speaker
	function handleAddSpeaker() {
		speakerStore.addSpeaker($newSpeakerName);
	}

	// Handle new speaker name input change
	function handleNameChange(e: Event) {
		const target = e.target as HTMLInputElement;
		speakerStore.setNewSpeakerName(target.value);
	}
</script>

<div class="flex w-64 flex-col border-r border-gray-100 bg-gray-50">
	<!-- Sidebar Header -->
	<div class="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-4">
		<div class="flex items-center justify-between">
			<h3 class="flex items-center font-medium text-gray-700">
				<svg
					class="mr-2 h-4 w-4 text-indigo-500"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M17 20H7C5.89543 20 5 19.1046 5 18V9C5 7.89543 5.89543 7 7 7H17C18.1046 7 19 7.89543 19 9V18C19 19.1046 18.1046 20 17 20Z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M12 7V4"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M8 7V5"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M16 7V5"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M12 12C12.5523 12 13 11.5523 13 11C13 10.4477 12.5523 10 12 10C11.4477 10 11 10.4477 11 11C11 11.5523 11.4477 12 12 12Z"
						fill="currentColor"
					/>
					<path
						d="M12 16C12.5523 16 13 15.5523 13 15C13 14.4477 12.5523 14 12 14C11.4477 14 11 14.4477 11 15C11 15.5523 11.4477 16 12 16Z"
						fill="currentColor"
					/>
					<path
						d="M16 12C16.5523 12 17 11.5523 17 11C17 10.4477 16.5523 10 16 10C15.4477 10 15 10.4477 15 11C15 11.5523 15.4477 12 16 12Z"
						fill="currentColor"
					/>
					<path
						d="M16 16C16.5523 16 17 15.5523 17 15C17 14.4477 16.5523 14 16 14C15.4477 14 15 14.4477 15 15C15 15.5523 15.4477 16 16 16Z"
						fill="currentColor"
					/>
					<path
						d="M8 12C8.55228 12 9 11.5523 9 11C9 10.4477 8.55228 10 8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12Z"
						fill="currentColor"
					/>
					<path
						d="M8 16C8.55228 16 9 15.5523 9 15C9 14.4477 8.55228 14 8 14C7.44772 14 7 14.4477 7 15C7 15.5523 7.44772 16 8 16Z"
						fill="currentColor"
					/>
				</svg>
				Speakers
			</h3>

			<!-- Speaker detection toggle -->
			<button
				on:click={onToggleSpeakerDetection}
				class="flex items-center rounded px-1.5 py-0.5 text-xs font-medium transition-colors"
				class:bg-green-100={speakerDetectionEnabled}
				class:text-green-700={speakerDetectionEnabled}
				class:bg-gray-100={!speakerDetectionEnabled}
				class:text-gray-700={!speakerDetectionEnabled}
				title={speakerDetectionEnabled
					? 'Turn off automatic speaker detection'
					: 'Turn on automatic speaker detection'}
			>
				<span class="relative mr-1.5 flex h-2.5 w-2.5 flex-shrink-0">
					<span
						class:animate-ping={speakerDetectionEnabled}
						class="absolute inline-flex h-full w-full rounded-full opacity-75"
						class:bg-green-400={speakerDetectionEnabled}
						class:bg-gray-400={!speakerDetectionEnabled}
					></span>
					<span
						class="relative inline-flex h-2.5 w-2.5 rounded-full"
						class:bg-green-500={speakerDetectionEnabled}
						class:bg-gray-500={!speakerDetectionEnabled}
					></span>
				</span>
				Auto
			</button>
		</div>

		<div class="mt-2 flex w-full justify-between space-x-2">
			<button
				on:click={handleToggleAddSpeaker}
				class="flex flex-1 items-center justify-center rounded-md bg-indigo-50 px-2 py-1.5 text-xs text-indigo-600 transition-colors hover:bg-indigo-100 focus:outline-none"
			>
				<svg
					class="mr-1.5 h-3.5 w-3.5"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12 5V19M5 12H19"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				{$showAddSpeaker ? 'Cancel' : 'Add Speaker'}
			</button>
		</div>

		{#if speakerDetectionEnabled}
			<p class="mt-2 text-xs text-gray-500">
				Auto-detection {listening ? 'active' : 'will start when listening'}
			</p>
		{/if}
	</div>

	<!-- Add Speaker Form -->
	{#if $showAddSpeaker}
		<div class="border-b border-gray-100 p-3">
			<div class="flex flex-col rounded-lg bg-white p-2 shadow-sm">
				<input
					type="text"
					bind:value={$newSpeakerName}
					placeholder="Speaker name"
					class="mb-2 rounded border-gray-200 py-1.5 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
				/>
				<button
					on:click={handleAddSpeaker}
					disabled={!$newSpeakerName.trim()}
					class="rounded bg-indigo-500 px-2 py-1.5 text-xs text-white transition-colors hover:bg-indigo-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					Add Speaker
				</button>
			</div>
		</div>
	{/if}

	<!-- Speaker Cards -->
	<div class="flex-1 overflow-y-auto p-3">
		{#if $speakers.length > 0}
			<div class="space-y-2">
				{#each $speakers as speaker}
					<SpeakerCard
						{speaker}
						isActive={speaker.id === $activeSpeakerId}
						{listening}
						{useGoogleDetection}
					/>
				{/each}
			</div>
		{:else}
			<div class="flex h-full flex-col items-center justify-center py-6 text-center">
				<div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
					<svg class="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none">
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
				<p class="text-sm text-gray-500">No speakers added yet</p>
				{#if speakerDetectionEnabled}
					<p class="mt-1 text-xs text-gray-400">
						Speakers will be detected automatically when speaking
					</p>
				{:else}
					<p class="mt-1 text-xs text-gray-400">Click the Add Speaker button to start</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
