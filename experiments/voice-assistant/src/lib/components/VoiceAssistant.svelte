<script lang="ts">
	// Voice assistant component using Svelte 5 runes
	import type {
		Speaker,
		SpeechRecognition,
		SpeechRecognitionEvent,
		SpeechRecognitionErrorEvent
	} from '$lib/types';
	import type {
		Message,
		VoiceProfile,
		SpeakerEventHandlers,
		MessageEventHandlers,
		SpeakerDetectionAlgorithm,
		SpeakerDetectionResult
	} from './voice-assistant/types';
	import { onMount, onDestroy } from 'svelte';
	import SpeakerList from './voice-assistant/SpeakerList.svelte';
	import MessageList from './voice-assistant/MessageList.svelte';
	import TranscriptDisplay from './voice-assistant/TranscriptDisplay.svelte';
	import VoiceControls from './voice-assistant/VoiceControls.svelte';
	import { SpeakerDetector } from './voice-assistant/SpeakerDetection';
	import { EnhancedSpeakerDetector } from './voice-assistant/EnhancedSpeakerDetection';
	import { AdvancedSpeakerDetector } from './voice-assistant/AdvancedSpeakerDetection';
	import { GoogleSpeakerDiarization } from './voice-assistant/GoogleSpeakerDiarization';
	import { MFCCSpeakerDetection } from './voice-assistant/MFCCSpeakerDetection';
	import { browser } from '$app/environment';

	// Import speaker store
	import {
		speakerStore,
		speakers,
		activeSpeakerId,
		currentlySpeakingSpeakerId
	} from './voice-assistant/stores/speakerStore';

	// Types for the detector options
	type DetectorType = 'basic' | 'enhanced' | 'advanced' | 'google' | 'mfcc';

	// State variables using Svelte 5 runes
	let listening: boolean = $state(false);
	let transcript: string = $state('');
	let messages: string[] = $state([]);
	let recognition: SpeechRecognition | null = null;

	// No longer need these state variables as they're in the store
	// let activeSpeakerId: string | null = $state(null);
	// let currentlySpeakingSpeakerId: string | null = $state(null);
	// let speakers: Speaker[] = $state([]);
	// let showAddSpeaker: boolean = $state(false);
	// let newSpeakerName: string = $state('');

	let speakerDetectionEnabled: boolean = $state(true);
	let selectedDetectorType: DetectorType = $state('basic');
	let autoDetectedSpeakerCount: number = $state(0);

	// Speaker detection
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let microphone: MediaStreamAudioSourceNode | null = null;
	let mediaStream: MediaStream | null = null;
	let speakerDetectionInterval: number | null = null;
	let dataArray: Uint8Array | null = null;
	let voiceCharacteristics: number[] = [];
	let lastDetectedSpeakerId: string | null = null;
	let isSpeaking: boolean = false;
	let silenceCounter: number = 0;
	const SILENCE_THRESHOLD = -70; // Adjust based on testing
	const VOICE_SAMPLES = 20; // Number of samples to collect for voice profile
	const SIMILARITY_THRESHOLD = 0.75; // How similar voices need to be to match (0-1)

	// Speaker detector instances
	let basicDetector: SpeakerDetector | null = null;
	let enhancedDetector: EnhancedSpeakerDetector | null = null;
	let advancedDetector: AdvancedSpeakerDetector | null = null;
	let googleDetector: GoogleSpeakerDiarization | null = null;
	let mfccDetector: MFCCSpeakerDetection | null = null;
	let currentDetector:
		| SpeakerDetectionAlgorithm
		| SpeakerDetector
		| AdvancedSpeakerDetector
		| GoogleSpeakerDiarization
		| MFCCSpeakerDetection
		| null = null;

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
		// Load speakers from store instead of directly from localStorage
		speakerStore.loadSpeakers();

		return () => {
			stopSpeakerDetection();
			if (recognition) {
				recognition.stop();
			}
		};
	});

	// Initialize audio processing for speaker detection
	async function initSpeakerDetection() {
		if (!speakerDetectionEnabled) return;

		// Stop any existing detection first
		stopSpeakerDetection();

		// Initialize the selected detector
		try {
			switch (selectedDetectorType) {
				case 'basic':
					if (!basicDetector) {
						basicDetector = new SpeakerDetector(
							$speakers,
							handleSpeakerDetected,
							handleNewSpeakerDetected
						);
					}
					await basicDetector.startDetection();
					currentDetector = basicDetector;
					break;

				case 'enhanced':
					if (!enhancedDetector) {
						enhancedDetector = new EnhancedSpeakerDetector({
							silenceThreshold: SILENCE_THRESHOLD,
							similarityThreshold: SIMILARITY_THRESHOLD
						});
					}
					await enhancedDetector.initialize();
					currentDetector = enhancedDetector;
					// Start processing audio in a loop
					processMFCCAudio();
					break;

				case 'mfcc':
					if (!mfccDetector) {
						mfccDetector = new MFCCSpeakerDetection({
							silenceThreshold: SILENCE_THRESHOLD,
							similarityThreshold: SIMILARITY_THRESHOLD,
							onSpeakerDetected: handleSpeakerDetected,
							onNewSpeakerDetected: handleNewSpeakerDetected
						});
					}
					await mfccDetector.startDetection();
					currentDetector = mfccDetector;
					// Start processing audio for MFCC detection
					processMFCCDetection();
					break;

				case 'advanced':
					if (!advancedDetector) {
						advancedDetector = new AdvancedSpeakerDetector(
							$speakers,
							handleSpeakerDetected,
							handleNewSpeakerDetected
						);
					}
					await advancedDetector.startDetection();
					currentDetector = advancedDetector;
					break;

				case 'google':
					if (!googleDetector) {
						googleDetector = new GoogleSpeakerDiarization(
							null, // API key would be set in a production environment
							handleSpeakerDetected
						);
					}
					await googleDetector.startDetection();
					currentDetector = googleDetector;
					break;

				default:
					// Fallback to built-in detection method
					try {
						mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
						audioContext = new AudioContext();
						analyser = audioContext.createAnalyser();
						microphone = audioContext.createMediaStreamSource(mediaStream);
						microphone.connect(analyser);

						analyser.fftSize = 256;
						const bufferLength = analyser.frequencyBinCount;
						dataArray = new Uint8Array(bufferLength);

						startSpeakerDetection();
					} catch (error) {
						console.error('Error initializing built-in speaker detection:', error);
						speakerDetectionEnabled = false;
					}
					break;
			}
		} catch (error) {
			console.error('Error initializing speaker detection:', error);
			speakerDetectionEnabled = false;
		}
	}

	// Process audio data for MFCC-based detector
	async function processMFCCAudio() {
		if (!enhancedDetector || !listening || selectedDetectorType !== 'enhanced') return;

		try {
			// Create audio context and analyzer if they don't exist
			if (!audioContext) {
				audioContext = new AudioContext();
				mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				microphone = audioContext.createMediaStreamSource(mediaStream);
				analyser = audioContext.createAnalyser();
				analyser.fftSize = 2048;
				microphone.connect(analyser);
				dataArray = new Uint8Array(analyser.frequencyBinCount);
			}

			// Process audio data in intervals
			speakerDetectionInterval = window.setInterval(async () => {
				if (!listening || !analyser || !dataArray || selectedDetectorType !== 'enhanced') {
					if (speakerDetectionInterval) {
						clearInterval(speakerDetectionInterval);
						speakerDetectionInterval = null;
					}
					return;
				}

				analyser.getByteFrequencyData(dataArray);

				// Check if sound is above threshold (someone is speaking)
				const average =
					Array.from(dataArray).reduce((sum, value) => sum + value, 0) / dataArray.length;
				const isSomeoneCurrentlySpeaking = average > SILENCE_THRESHOLD;

				// Detect speaker
				const result = await enhancedDetector!.detect(dataArray);
				console.log('Result', result);
				if (
					result.isNewSpeaker &&
					result.voiceProfile &&
					result.voiceProfile.features &&
					transcript.trim().length > 10
				) {
					console.log('New speaker detected', result, result.voiceProfile.features);
					// Train the detector with the new speaker
					const speakerId = speakerStore.createAutoDetectedSpeaker(result.voiceProfile.features);
					await enhancedDetector!.train(speakerId, [dataArray]);
					speakerStore.setActiveSpeaker(speakerId);
					if (isSomeoneCurrentlySpeaking) {
						speakerStore.setCurrentlySpeaking(speakerId);
					}
				} else if (result.speakerId) {
					speakerStore.setActiveSpeaker(result.speakerId);
					if (isSomeoneCurrentlySpeaking) {
						speakerStore.setCurrentlySpeaking(result.speakerId);
					}
				} else if (!isSomeoneCurrentlySpeaking) {
					// No one is speaking
					speakerStore.setCurrentlySpeaking(null);
				}
			}, 500); // Check every 500ms
		} catch (error) {
			console.error('Error processing MFCC audio:', error);
		}
	}

	// Start monitoring for different speakers
	function startSpeakerDetection() {
		if (!analyser || !dataArray || !speakerDetectionEnabled) return;

		speakerDetectionInterval = window.setInterval(() => {
			if (!listening) return;

			if (dataArray && analyser) {
				analyser.getByteFrequencyData(dataArray);

				// Calculate average frequency energy
				const average =
					Array.from(dataArray).reduce((sum, value) => sum + value, 0) / dataArray.length;

				// Check if someone is speaking based on audio energy
				if (average > SILENCE_THRESHOLD) {
					silenceCounter = 0;
					if (!isSpeaking) {
						isSpeaking = true;
						// Start collecting voice characteristics
						collectVoiceCharacteristics();
					}
					// If we already know who's speaking, keep showing them as currently speaking
					if ($activeSpeakerId) {
						speakerStore.setCurrentlySpeaking($activeSpeakerId);
					}
				} else {
					silenceCounter++;
					if (silenceCounter > 15 && isSpeaking) {
						// About 750ms of silence
						isSpeaking = false;
						// Process the collected voice characteristics
						if (voiceCharacteristics.length > 0) {
							processSpeakerIdentification();
							voiceCharacteristics = [];
						}
						// No one is speaking anymore
						speakerStore.setCurrentlySpeaking(null);
					}
				}
			}
		}, 50); // Check every 50ms
	}

	// Collect voice characteristics for speaker identification
	function collectVoiceCharacteristics() {
		if (!analyser || !dataArray) return;

		// Only collect if we have enough data points
		if (voiceCharacteristics.length < VOICE_SAMPLES && isSpeaking) {
			// Get specific frequency bands that help identify speakers
			analyser.getByteFrequencyData(dataArray);

			// Create a simplified voice profile from frequency data
			// We focus on certain frequency ranges most useful for voice identification
			const profile = calculateVoiceProfile(dataArray);
			voiceCharacteristics.push(...profile);
		}
	}

	// Calculate a voice profile from frequency data
	function calculateVoiceProfile(frequencyData: Uint8Array): number[] {
		// Simplify the frequency data into characteristic bands
		// This is a simplified approach - proper speaker identification would use more sophisticated methods
		const bandSize = Math.floor(frequencyData.length / 8);
		const profile = [];

		for (let i = 0; i < 8; i++) {
			const start = i * bandSize;
			const end = start + bandSize;
			let bandAverage = 0;

			for (let j = start; j < end; j++) {
				bandAverage += frequencyData[j];
			}

			profile.push(bandAverage / bandSize);
		}

		return profile;
	}

	// Process voice characteristics to identify speaker
	function processSpeakerIdentification() {
		if (voiceCharacteristics.length < 4) return; // Not enough data

		// Average the collected samples for a more stable profile
		const currentProfile: number[] = [];
		const samples = Math.min(Math.floor(voiceCharacteristics.length / 8), VOICE_SAMPLES);

		for (let i = 0; i < 8; i++) {
			let sum = 0;
			for (let j = 0; j < samples; j++) {
				sum += voiceCharacteristics[i + j * 8];
			}
			currentProfile.push(sum / samples);
		}

		// Try to match with existing speakers
		let bestMatchId: string | null = null;
		let bestMatchScore = 0;

		$speakers.forEach((speaker) => {
			if (speaker.voiceProfile?.features) {
				const similarityScore = calculateSimilarity(currentProfile, speaker.voiceProfile.features);
				if (similarityScore > SIMILARITY_THRESHOLD && similarityScore > bestMatchScore) {
					bestMatchScore = similarityScore;
					bestMatchId = speaker.id;
				}
			}
		});

		if (bestMatchId) {
			// Found a matching speaker
			speakerStore.setActiveSpeaker(bestMatchId);
			lastDetectedSpeakerId = bestMatchId;
		} else if (transcript.trim().length > 10) {
			// No match found, create a new speaker if we have enough of a transcript
			const newSpeakerId = speakerStore.createAutoDetectedSpeaker(currentProfile);
			speakerStore.setActiveSpeaker(newSpeakerId);
			lastDetectedSpeakerId = newSpeakerId;
		}
	}

	// Calculate similarity between two voice profiles (0-1 where 1 is identical)
	function calculateSimilarity(profile1: number[], profile2: number[]): number {
		if (!profile1?.length || !profile2?.length || profile1.length !== profile2.length) {
			return 0;
		}

		// Normalize the profiles for comparison
		const normalize = (profile: number[]) => {
			const max = Math.max(...profile);
			return profile.map((value) => value / (max || 1));
		};

		const normalizedProfile1 = normalize(profile1);
		const normalizedProfile2 = normalize(profile2);

		// Calculate Euclidean distance between normalized profiles
		let sumSquaredDiff = 0;
		for (let i = 0; i < normalizedProfile1.length; i++) {
			sumSquaredDiff += Math.pow(normalizedProfile1[i] - normalizedProfile2[i], 2);
		}

		const distance = Math.sqrt(sumSquaredDiff);
		const maxDistance = Math.sqrt(normalizedProfile1.length); // Maximum possible distance

		// Convert distance to similarity score (0-1)
		return 1 - distance / maxDistance;
	}

	// Handlers for speaker detection callbacks
	function handleSpeakerDetected(speakerId: string) {
		speakerStore.setActiveSpeaker(speakerId);
		lastDetectedSpeakerId = speakerId;

		// Check if there's currently audio (speaking)
		if (analyser && dataArray) {
			analyser.getByteFrequencyData(dataArray);
			const average =
				Array.from(dataArray).reduce((sum, value) => sum + value, 0) / dataArray.length;
			if (average > SILENCE_THRESHOLD) {
				speakerStore.setCurrentlySpeaking(speakerId);
			}
		}
	}

	function handleNewSpeakerDetected(voiceProfile: number[]) {
		if (transcript.trim().length > 10) {
			const speakerId = speakerStore.createAutoDetectedSpeaker(voiceProfile);
			speakerStore.setActiveSpeaker(speakerId);
			lastDetectedSpeakerId = speakerId;
		}
	}

	// Stop speaker detection and clean up
	function stopSpeakerDetection() {
		// Clear interval used for built-in or MFCC detection
		if (speakerDetectionInterval) {
			clearInterval(speakerDetectionInterval);
			speakerDetectionInterval = null;
		}

		// Reset speaking state
		speakerStore.setCurrentlySpeaking(null);

		// Stop basic detector
		if (basicDetector && selectedDetectorType === 'basic') {
			basicDetector.stopDetection();
		}

		// Stop enhanced detector
		if (enhancedDetector && selectedDetectorType === 'enhanced') {
			// If there's a specific stop method for enhanced detector
		}

		// Stop MFCC detector
		if (mfccDetector && selectedDetectorType === 'mfcc') {
			mfccDetector.stopDetection();
		}

		// Stop advanced detector
		if (advancedDetector && selectedDetectorType === 'advanced') {
			advancedDetector.stopDetection();
		}

		// Stop google detector
		if (googleDetector && selectedDetectorType === 'google') {
			googleDetector.stopDetection();
		}

		// Clean up audio resources
		if (microphone) {
			microphone.disconnect();
			microphone = null;
		}

		if (mediaStream) {
			mediaStream.getTracks().forEach((track) => track.stop());
			mediaStream = null;
		}

		if (audioContext && audioContext.state !== 'closed') {
			audioContext.close();
			audioContext = null;
		}

		analyser = null;
		dataArray = null;
		voiceCharacteristics = [];
		currentDetector = null;
	}

	// Change detector type
	async function changeDetectorType(newType: DetectorType) {
		if (listening) return; // Can't change while listening

		// Stop current detection
		stopSpeakerDetection();

		// Update the selected type
		selectedDetectorType = newType;

		// Reset state
		transcript = '';
		speakerStore.setActiveSpeaker(null);
		speakerStore.setCurrentlySpeaking(null);

		// Update current detector
		currentDetector = null;
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
						// Initialize speaker detection when speech recognition starts
						if (speakerDetectionEnabled) {
							initSpeakerDetection();
						}
					};

					recognition.onresult = (event: SpeechRecognitionEvent) => {
						const current = event.resultIndex;
						transcript = event.results[current][0].transcript;
					};

					recognition.onend = () => {
						listening = false;
						// Reset active speaker when stopping
						speakerStore.setActiveSpeaker(null);
						// Stop speaker detection
						stopSpeakerDetection();
					};

					recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
						console.error('Speech recognition error', event.error);
						listening = false;
						// Reset active speaker on error
						speakerStore.setActiveSpeaker(null);
						// Stop speaker detection
						stopSpeakerDetection();
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

	// Toggle speaker detection
	function toggleSpeakerDetection() {
		speakerDetectionEnabled = !speakerDetectionEnabled;

		if (listening) {
			if (speakerDetectionEnabled) {
				initSpeakerDetection();
			} else {
				stopSpeakerDetection();
			}
		}
	}

	// Add the current transcript to messages
	function addMessage() {
		if (transcript.trim()) {
			const message = transcript.trim();
			// Add speaker information if a speaker is active
			const formattedMessage = $activeSpeakerId
				? {
						text: message,
						speakerId: $activeSpeakerId,
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

	// Set active speaker with Google detection integration
	function setActiveSpeaker(id: string | null) {
		// Call the store's setActiveSpeaker
		speakerStore.setActiveSpeaker(id);

		// Add Google detection integration
		if (id && selectedDetectorType === 'google' && googleDetector) {
			// For now we'll use tag 1 as default, in production we'd want to get the actual tag from Google
			const googleSpeakerTag = 1;
			const speaker = speakerStore.getSpeaker(id);
			if (speaker) {
				// Update the speaker with Google Speaker ID
				// This now updates both the local mapping in googleDetector and the store
				googleDetector.setSpeakerMapping(speaker, googleSpeakerTag);
			}
		}
	}

	// Set currently speaking with store integration
	function setCurrentlySpeaking(id: string | null) {
		// Call the store's setCurrentlySpeaking
		speakerStore.setCurrentlySpeaking(id);
	}

	// Get speaker is now in the store
	function getSpeaker(id: string) {
		return speakerStore.getSpeaker(id);
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
			stopSpeakerDetection();
			if (recognition) {
				recognition.stop();
			}
		};
	});

	// Function to ensure Speaker array type safety
	function ensureSpeakerArray(speakerList: any[]): Speaker[] {
		return speakerList as Speaker[];
	}

	// Fix type safety issues with speaker.voiceProfile?.features
	function findBestMatch(currentProfile: number[]): string | null {
		let bestMatchId: string | null = null;
		let highestSimilarity = SIMILARITY_THRESHOLD;

		$speakers.forEach((speaker) => {
			if (speaker.voiceProfile?.features) {
				const similarity = calculateSimilarity(currentProfile, speaker.voiceProfile.features);
				if (similarity > highestSimilarity) {
					highestSimilarity = similarity;
					bestMatchId = speaker.id;
				}
			}
		});

		return bestMatchId;
	}

	// Process audio data for MFCC-based detector
	async function processMFCCDetection() {
		if (!mfccDetector || !listening || selectedDetectorType !== 'mfcc') return;

		try {
			// Start collecting audio and analyzing
			const result = await mfccDetector.detect();

			// Handle active speaker detection directly through the detector
			if (result.speakerId) {
				// The detector will update the store through callbacks
				console.log(
					`MFCC detection identified speaker: ${result.speakerId} with confidence ${result.confidence.toFixed(2)}`
				);
			} else if (result.isNewSpeaker && result.voiceProfile) {
				console.log('MFCC detection identified new speaker');
				// The detector will handle new speaker creation through callbacks
			}

			// Continue processing
			setTimeout(processMFCCDetection, 1000);
		} catch (error) {
			console.error('Error processing MFCC audio:', error);
		}
	}
</script>

<div class="voice-assistant mx-auto flex max-w-5xl overflow-hidden rounded-xl bg-white shadow-sm">
	<!-- Left Sidebar for Speakers -->
	<SpeakerList
		{speakerDetectionEnabled}
		{listening}
		useGoogleDetection={selectedDetectorType === 'google'}
		onToggleSpeakerDetection={toggleSpeakerDetection}
	/>

	<!-- Main Content Area -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Header with voice controls -->
		<div class="flex items-center justify-between border-b border-gray-100 px-4 py-2">
			<VoiceControls {listening} onToggleListening={toggleListening} />

			<!-- Detector selection dropdown -->
			<div class="ml-4 flex items-center">
				<label for="detector-select" class="mr-2 text-sm font-medium text-gray-700">
					Detector:
				</label>
				<select
					id="detector-select"
					class="rounded-md border-gray-300 bg-white py-1 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					value={selectedDetectorType}
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						changeDetectorType(target.value as DetectorType);
					}}
					disabled={listening}
				>
					<option value="basic">Basic</option>
					<option value="enhanced">Enhanced (Simple MFCC)</option>
					<option value="mfcc">Advanced MFCC (Voice Fingerprinting)</option>
					<option value="advanced">Neural Network</option>
					<option value="google">Google Cloud API</option>
				</select>
			</div>
		</div>

		<!-- Transcript area (only visible when listening) -->
		{#if listening}
			<TranscriptDisplay {transcript} activeSpeakerId={$activeSpeakerId} {getSpeaker} />
		{/if}

		<!-- Messages area -->
		<MessageList
			{messages}
			{transcript}
			onAddMessage={addMessage}
			onClearMessages={clearMessages}
			{getSpeaker}
			{parseMessage}
		/>

		<!-- Footer with subtle background -->
		<div class="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
			Using Web Speech API • Detector: {selectedDetectorType} • Compatible with Chrome, Edge, and Safari
		</div>
	</div>
</div>
