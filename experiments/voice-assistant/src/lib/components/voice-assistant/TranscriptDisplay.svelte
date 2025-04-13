<script lang="ts">
	import type { Speaker } from './types';

	// Props
	export let transcript: string;
	export let activeSpeakerId: string | null;

	// Functions
	export let getSpeaker: (id: string) => Speaker | undefined;
</script>

<div class="border-b border-indigo-100 bg-indigo-50 px-4 py-3">
	<div class="mb-1 flex items-center justify-between">
		<div class="flex items-center">
			<p class="text-xs font-medium text-indigo-600">Transcript</p>
			{#if activeSpeakerId}
				<span class="ml-2 rounded-full bg-white px-1.5 py-0.5 text-xs">
					{getSpeaker(activeSpeakerId)?.name || 'Unknown'}
				</span>
			{/if}
		</div>
		<div class="flex space-x-1">
			<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-300"></span>
			<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 delay-150"></span>
			<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500 delay-300"></span>
		</div>
	</div>
	<p class="min-h-[24px] text-sm text-gray-700">{transcript || 'Say something...'}</p>
</div>
