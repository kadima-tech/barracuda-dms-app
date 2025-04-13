<script lang="ts">
	import type { Speaker } from './types';

	// Props
	export let messages: string[];
	export let transcript: string;

	// Events
	export let onAddMessage: () => void;
	export let onClearMessages: () => void;

	// Functions
	export let getSpeaker: (id: string) => Speaker | undefined;
	export let parseMessage: (message: string) => any;

	$: messageCount = messages.length;
</script>

<div class="flex flex-1 flex-col">
	<div class="border-b border-gray-100 px-4 py-3">
		<div class="mb-2 flex items-center justify-between">
			<h3 class="text-sm font-medium text-gray-700">Messages ({messageCount})</h3>
			<div class="flex space-x-2">
				<!-- Save message button (only enabled when there's transcript) -->
				<button
					on:click={onAddMessage}
					disabled={!transcript.trim()}
					class="flex items-center rounded bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 transition-colors hover:bg-indigo-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					<svg class="mr-1 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
						<path
							d="M5 12H19M19 12L12 5M19 12L12 19"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					Save
				</button>

				<!-- Clear all button (only enabled when there are messages) -->
				<button
					on:click={onClearMessages}
					disabled={messages.length === 0}
					class="flex items-center rounded bg-gray-50 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					<svg class="mr-1 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
						<path
							d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					Clear all
				</button>
			</div>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto px-4 py-3">
		{#if messages.length > 0}
			<ul class="space-y-3">
				{#each messages as messageStr, i}
					{@const message = parseMessage(messageStr)}
					<li
						class="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 shadow-sm transition-all hover:bg-gray-100"
					>
						<div class="flex">
							{#if message.speakerId && getSpeaker(message.speakerId)}
								{@const speaker = getSpeaker(message.speakerId)}
								<div class="mr-3 flex-shrink-0">
									<span
										class={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${speaker?.color || 'bg-gray-100 text-gray-600'}`}
									>
										{speaker?.name.charAt(0).toUpperCase() || '?'}
									</span>
									<p class="mt-1 text-center text-xs text-gray-500">{speaker?.name}</p>
								</div>
								<div>
									<p>{message.text}</p>
									<p class="mt-1 text-xs text-gray-400">
										{new Date(message.timestamp).toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit'
										})}
									</p>
								</div>
							{:else}
								<div class="mr-3 flex-shrink-0">
									<span
										class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-800"
									>
										{i + 1}
									</span>
								</div>
								<div>
									<p>{message.text}</p>
									{#if message.timestamp}
										<p class="mt-1 text-xs text-gray-400">
											{new Date(message.timestamp).toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit'
											})}
										</p>
									{/if}
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="flex h-full flex-col items-center justify-center py-6 text-center">
				<div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
					<svg
						class="h-6 w-6 text-gray-400"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.418 16.97 20 12 20C10.5286 20 9.14625 19.6375 7.94358 19C7.60128 18.8284 7.43013 18.7426 7.32898 18.7426C7.22782 18.7426 7.12624 18.7798 7.02987 18.854C6.9335 18.9283 6.86283 19.0358 6.72149 19.2506L4 23L4.93643 18.9636C5.10864 18.4321 5.19474 18.1664 5.15735 17.9124C5.12003 17.6584 4.95967 17.428 4.63894 16.9672C3.59375 15.5424 3 13.8431 3 12C3 7.58172 7.02944 4 12 4C16.97 4 21 7.58172 21 12Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
				<p class="text-sm text-gray-500">No messages yet</p>
				<p class="mt-1 text-xs text-gray-400">Click the microphone to start listening</p>
			</div>
		{/if}
	</div>
</div>
