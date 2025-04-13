<script lang="ts">
	// Voice assistant component using Svelte 5 runes
	import type {
		SpeechRecognition,
		SpeechRecognitionEvent,
		SpeechRecognitionErrorEvent
	} from '$lib/types';
	import { onMount } from 'svelte';

	// State variables using Svelte 5 runes
	let listening: boolean = $state(false);
	let transcript: string = $state('');
	let messages: string[] = $state([]);
	let recognition: SpeechRecognition | null = null;
	let activeSpeakerId: string | null = $state(null);

	// Speaker management
	type Speaker = {
		id: string;
		name: string;
		color: string;
		isActive: boolean;
	};

	let speakers: Speaker[] = $state([]);
	let showAddSpeaker: boolean = $state(false);
	let newSpeakerName: string = $state('');

	// Colors for speaker avatars
	const avatarColors = [
		'bg-blue-100 text-blue-600',
		'bg-green-100 text-green-600',
		'bg-purple-100 text-purple-600',
		'bg-amber-100 text-amber-600',
		'bg-pink-100 text-pink-600',
		'bg-cyan-100 text-cyan-600'
	];

	// Define a derived state for message count
	let messageCount: number = $derived(messages.length);

	// Load speakers from localStorage on mount
	onMount(() => {
		const savedSpeakers = localStorage.getItem('voice-assistant-speakers');
		if (savedSpeakers) {
			try {
				speakers = JSON.parse(savedSpeakers);
			} catch (e) {
				console.error('Failed to parse saved speakers', e);
			}
		}
	});

	// Save speakers to localStorage
	function saveSpeakers() {
		localStorage.setItem('voice-assistant-speakers', JSON.stringify(speakers));
	}

	// Initialize speech recognition when the component is mounted
	function initSpeechRecognition() {
		if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
			const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
			if (SpeechRecognitionCtor) {
				recognition = new SpeechRecognitionCtor();
				// Now we can safely assert that recognition is not null
				if (recognition) {
					recognition.continuous = true;
					recognition.interimResults = true;

					recognition.onstart = () => {
						listening = true;
					};

					recognition.onresult = (event: SpeechRecognitionEvent) => {
						const current = event.resultIndex;
						transcript = event.results[current][0].transcript;
					};

					recognition.onend = () => {
						listening = false;
						// Reset active speaker when stopping
						setActiveSpeaker(null);
					};

					recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
						console.error('Speech recognition error', event.error);
						listening = false;
						// Reset active speaker on error
						setActiveSpeaker(null);
					};
				}
			}
		} else {
			alert('Speech recognition is not supported in your browser.');
		}
	}

	// Toggle speech recognition
	function toggleListening() {
		if (!recognition) {
			initSpeechRecognition();
		}

		if (listening && recognition) {
			recognition.stop();
		} else if (recognition) {
			recognition.start();
			transcript = '';
		}
	}

	// Add the current transcript to messages
	function addMessage() {
		if (transcript.trim()) {
			const message = transcript.trim();
			// Add speaker information if a speaker is active
			const formattedMessage = activeSpeakerId
				? {
						text: message,
						speakerId: activeSpeakerId,
						timestamp: new Date().toISOString()
					}
				: {
						text: message,
						timestamp: new Date().toISOString()
					};

			messages = [...messages, JSON.stringify(formattedMessage)];
			transcript = '';
		}
	}

	// Clear all messages
	function clearMessages() {
		messages = [];
		transcript = '';
	}

	// Add a new speaker
	function addSpeaker() {
		if (newSpeakerName.trim()) {
			const colorIndex = speakers.length % avatarColors.length;
			const newSpeaker = {
				id: crypto.randomUUID(),
				name: newSpeakerName.trim(),
				color: avatarColors[colorIndex],
				isActive: false
			};

			speakers = [...speakers, newSpeaker];
			newSpeakerName = '';
			showAddSpeaker = false;
			saveSpeakers();
		}
	}

	// Update speaker name
	function updateSpeakerName(id: string, name: string) {
		if (name.trim()) {
			speakers = speakers.map((speaker) =>
				speaker.id === id ? { ...speaker, name: name.trim() } : speaker
			);
			saveSpeakers();
		}
	}

	// Remove a speaker
	function removeSpeaker(id: string) {
		speakers = speakers.filter((speaker) => speaker.id !== id);
		if (activeSpeakerId === id) {
			activeSpeakerId = null;
		}
		saveSpeakers();
	}

	// Set active speaker
	function setActiveSpeaker(id: string | null) {
		activeSpeakerId = id;
		speakers = speakers.map((speaker) => ({
			...speaker,
			isActive: speaker.id === id
		}));
	}

	// Get speaker by ID
	function getSpeaker(id: string): Speaker | undefined {
		return speakers.find((speaker) => speaker.id === id);
	}

	// Parse message to get speaker info
	function parseMessage(message: string) {
		try {
			return JSON.parse(message);
		} catch (e) {
			return { text: message };
		}
	}

	// Clean up when component is destroyed
	$effect(() => {
		// Return cleanup function
		return () => {
			if (recognition) {
				recognition.stop();
			}
		};
	});
</script>

<div class="voice-assistant mx-auto flex max-w-5xl overflow-hidden rounded-xl bg-white shadow-sm">
	<!-- Left Sidebar for Speakers -->
	<div class="flex w-64 flex-col border-r border-gray-100 bg-gray-50">
		<!-- Sidebar Header -->
		<div class="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-4">
			<h3 class="mb-1 flex items-center font-medium text-gray-700">
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
			<button
				onclick={() => (showAddSpeaker = !showAddSpeaker)}
				class="mt-2 flex w-full items-center justify-center rounded-md bg-indigo-50 px-2 py-1.5 text-xs text-indigo-600 transition-colors hover:bg-indigo-100 focus:outline-none"
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
				{showAddSpeaker ? 'Cancel' : 'Add Speaker'}
			</button>
		</div>

		<!-- Add Speaker Form -->
		{#if showAddSpeaker}
			<div class="border-b border-gray-100 p-3">
				<div class="flex flex-col rounded-lg bg-white p-2 shadow-sm">
					<input
						type="text"
						bind:value={newSpeakerName}
						placeholder="Speaker name"
						class="mb-2 rounded border-gray-200 py-1.5 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
					/>
					<button
						onclick={addSpeaker}
						disabled={!newSpeakerName.trim()}
						class="rounded bg-indigo-500 px-2 py-1.5 text-xs text-white transition-colors hover:bg-indigo-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						Add Speaker
					</button>
				</div>
			</div>
		{/if}

		<!-- Speaker Cards -->
		<div class="flex-1 overflow-y-auto p-3">
			{#if speakers.length > 0}
				<div class="space-y-2">
					{#each speakers as speaker}
						<div
							class={`relative rounded-lg border-l-4 shadow-sm ${
								activeSpeakerId === speaker.id
									? 'border-indigo-500 bg-indigo-50'
									: 'border-gray-200 bg-white'
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
										onclick={() =>
											listening &&
											setActiveSpeaker(activeSpeakerId === speaker.id ? null : speaker.id)}
										role="button"
										aria-label={listening
											? 'Set as active speaker'
											: 'Cannot change speaker while not listening'}
										class:cursor-pointer={listening}
										class:cursor-not-allowed={!listening}
										class:opacity-60={!listening}
									>
										<span class="text-sm font-medium">{speaker.name.charAt(0).toUpperCase()}</span>
									</div>
									<div class="min-w-0 flex-1">
										<input
											type="text"
											value={speaker.name}
											onchange={(e) => updateSpeakerName(speaker.id, e.currentTarget.value)}
											class="w-full truncate border-none bg-transparent p-0 text-sm font-medium focus:outline-none focus:ring-0"
										/>
										<p class="text-xs text-gray-500">
											{speaker.isActive ? 'Currently speaking' : 'Inactive'}
										</p>
									</div>
									<button
										onclick={() => removeSpeaker(speaker.id)}
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

								<!-- Speaker selection controls -->
								<div class="flex">
									<button
										onclick={() =>
											listening &&
											setActiveSpeaker(activeSpeakerId === speaker.id ? null : speaker.id)}
										disabled={!listening}
										class={`w-full rounded-md py-1 text-xs transition-colors ${
											activeSpeakerId === speaker.id
												? 'bg-indigo-100 text-indigo-700'
												: 'bg-gray-50 text-gray-700 hover:bg-gray-100'
										} focus:outline-none disabled:cursor-not-allowed disabled:opacity-50`}
									>
										{activeSpeakerId === speaker.id ? 'Active' : 'Select as speaker'}
									</button>
								</div>
							</div>
						</div>
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
					<p class="mt-1 text-xs text-gray-400">Click the Add Speaker button to start</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="flex flex-1 flex-col">
		<!-- Header with soft gradient background -->
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
				onclick={toggleListening}
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

		<!-- Transcript area (only visible when listening) -->
		{#if listening}
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
		{/if}

		<!-- Messages area -->
		<div class="flex flex-1 flex-col">
			<div class="border-b border-gray-100 px-4 py-3">
				<div class="mb-2 flex items-center justify-between">
					<h3 class="text-sm font-medium text-gray-700">Messages ({messageCount})</h3>
					<div class="flex space-x-2">
						<!-- Save message button (only enabled when there's transcript) -->
						<button
							onclick={addMessage}
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
							onclick={clearMessages}
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

		<!-- Footer with subtle background -->
		<div class="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
			Using Web Speech API • Compatible with Chrome, Edge, and Safari
		</div>
	</div>
</div>
