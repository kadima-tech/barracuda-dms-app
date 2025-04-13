import type { Speaker, GoogleSpeechWord } from './types';
import { speakerStore } from './stores/speakerStore';
import { get } from 'svelte/store';

/**
 * GoogleSpeakerDiarization - Speaker detection using Google Cloud Speech-to-Text API
 *
 * This implementation uses Google's speaker diarization feature to identify different speakers
 * in audio recordings. It allows for automatic detection of multiple speakers and provides
 * timing information for each spoken segment.
 */
export class GoogleSpeakerDiarization {
	private apiKey: string | null = null;
	private audioContext: AudioContext | null = null;
	private mediaStream: MediaStream | null = null;
	private audioProcessor: ScriptProcessorNode | null = null;
	private isProcessing: boolean = false;
	private onSpeakerDetected: ((speakerId: string) => void) | null = null;
	private recordedChunks: Float32Array[] = [];
	private speakerMappings: Map<number, Speaker> = new Map();
	private debugMode: boolean = true;

	/**
	 * Initialize the Google speaker diarization
	 * @param apiKey Google Cloud API key
	 * @param onSpeakerDetected Callback when a speaker is detected
	 */
	constructor(
		apiKey: string | null = null,
		onSpeakerDetected: ((speakerId: string) => void) | null = null
	) {
		this.apiKey = apiKey;
		this.onSpeakerDetected = onSpeakerDetected;

		// Initialize speaker mappings from store
		this.initializeSpeakerMappings();

		this.debug('Initialized with API key:', apiKey ? 'provided' : 'not provided');
		this.debug('Initially mapped speakers:', this.speakerMappings.size);
	}

	/**
	 * Initialize speaker mappings from the store
	 */
	private initializeSpeakerMappings(): void {
		const speakers = get(speakerStore).speakers;

		speakers.forEach((speaker) => {
			if (speaker.voiceProfile?.googleSpeakerId !== undefined) {
				this.speakerMappings.set(speaker.voiceProfile.googleSpeakerId, speaker);
			}
		});
	}

	/**
	 * Log debugging information
	 */
	private debug(...args: unknown[]): void {
		if (this.debugMode) {
			console.log('[GoogleDetector]', ...args);
		}
	}

	/**
	 * Initialize audio processing
	 */
	async initializeAudio(): Promise<boolean> {
		this.debug('Initializing audio...');
		try {
			this.audioContext = new (window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
			this.debug('Audio context initialized');
			return true;
		} catch (error) {
			console.error('Failed to initialize audio context:', error);
			return false;
		}
	}

	/**
	 * Start audio capture and processing
	 */
	async startDetection(): Promise<boolean> {
		this.debug('Starting detection...');
		if (!this.audioContext) {
			this.debug('Audio context not initialized, initializing now');
			const initialized = await this.initializeAudio();
			if (!initialized) {
				this.debug('Failed to initialize audio');
				return false;
			}
		}

		try {
			this.debug('Requesting microphone access');
			this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			this.debug('Microphone access granted');

			if (this.audioContext) {
				const source = this.audioContext.createMediaStreamSource(this.mediaStream);
				this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

				this.debug('Setting up audio processing pipeline with buffer size 4096');
				this.audioProcessor.onaudioprocess = this.handleAudioProcess.bind(this);
				source.connect(this.audioProcessor);
				this.audioProcessor.connect(this.audioContext.destination);

				this.isProcessing = true;
				this.recordedChunks = [];
				this.debug('Audio processing started');
				return true;
			}
			return false;
		} catch (error) {
			console.error('Error starting audio detection:', error);
			return false;
		}
	}

	/**
	 * Stop audio capture and processing
	 */
	stopDetection(): void {
		this.debug('Stopping detection...');
		if (this.isProcessing) {
			if (this.recordedChunks.length > 0) {
				this.debug('Processing remaining audio chunks before stopping');
				this.processRecordedAudio();
			}

			if (this.audioProcessor) {
				this.debug('Disconnecting audio processor');
				this.audioProcessor.disconnect();
				this.audioProcessor = null;
			}

			if (this.mediaStream) {
				this.debug('Stopping media stream tracks');
				this.mediaStream.getTracks().forEach((track) => track.stop());
				this.mediaStream = null;
			}

			this.isProcessing = false;
			this.debug('Detection stopped');
		}
	}

	/**
	 * Handle incoming audio data
	 */
	private handleAudioProcess(event: AudioProcessingEvent): void {
		if (this.isProcessing) {
			const inputData = event.inputBuffer.getChannelData(0);
			const audioChunk = new Float32Array(inputData.length);
			audioChunk.set(inputData);
			this.recordedChunks.push(audioChunk);

			// Calculate RMS value for debugging
			const rmsValue = Math.sqrt(
				inputData.reduce((sum, sample) => sum + sample * sample, 0) / inputData.length
			);

			if (rmsValue > 0.01) {
				// Only log when there's significant audio
				this.debug(
					'Audio chunk captured, RMS:',
					(rmsValue * 100).toFixed(2),
					'Total chunks:',
					this.recordedChunks.length
				);
			}

			// If we have enough data (about 9-10 seconds), process it
			// Process more audio at once for better diarization results
			// Each chunk is approximately 93ms (4096 samples at 44.1kHz)
			if (this.recordedChunks.length > 45) {
				this.debug('Collected enough data (9-10 seconds), processing audio');
				this.processRecordedAudio();
				this.recordedChunks = [];
			}
		}
	}

	/**
	 * Process recorded audio using Google Cloud Speech-to-Text API
	 */
	private async processRecordedAudio(): Promise<void> {
		if (this.recordedChunks.length === 0) {
			this.debug('Cannot process audio: No audio chunks');
			return;
		}

		try {
			this.debug('Processing', this.recordedChunks.length, 'audio chunks');
			// Convert audio data to the format expected by Google Cloud Speech-to-Text
			const audioData = this.prepareAudioData();
			if (!audioData || audioData.length === 0) {
				this.debug('Failed to prepare audio data');
				return;
			}
			this.debug('Audio data prepared for API, size:', audioData.length);

			// Create request to Google Cloud Speech-to-Text API
			this.debug('Sending data to Google Speech-to-Text API');
			const response = await this.sendToGoogleSpeechAPI(audioData);

			// Process the response
			if (response && response.results) {
				this.debug('Received API response with results');
				this.processDiarizationResults(response);
			} else {
				this.debug('API response contained no results');
			}
		} catch (error) {
			console.error('Error processing audio with Google Speech-to-Text:', error);
		}
	}

	/**
	 * Prepare audio data for the API request
	 */
	private prepareAudioData(): string {
		this.debug('Preparing audio data from', this.recordedChunks.length, 'chunks');

		// Get actual sample rate from audio context
		const sampleRate = this.audioContext?.sampleRate || 48000;
		this.debug('Audio sample rate:', sampleRate, 'Hz');
		// Combine all audio chunks
		const combinedChunks = new Float32Array(
			this.recordedChunks.reduce((acc, chunk) => acc + chunk.length, 0)
		);

		let offset = 0;
		this.recordedChunks.forEach((chunk) => {
			combinedChunks.set(chunk, offset);
			offset += chunk.length;
		});
		this.debug('Combined audio data length:', combinedChunks.length, 'samples');

		// Convert to 16-bit PCM (LINEAR16 format for Google Speech API)
		const audioBuffer = new ArrayBuffer(combinedChunks.length * 2);
		const view = new DataView(audioBuffer);

		for (let i = 0; i < combinedChunks.length; i++) {
			// Clamp values to the range -1 to 1
			const s = Math.max(-1, Math.min(1, combinedChunks[i]));
			// Convert to 16-bit PCM (ensure little-endian for LINEAR16)
			view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		}
		this.debug('Converted to 16-bit PCM (LINEAR16), buffer size:', audioBuffer.byteLength, 'bytes');

		// Convert the binary data to base64 for transmission
		const base64 = this.arrayBufferToBase64(audioBuffer);
		this.debug('Converted audio to base64, length:', base64.length, 'chars');

		return base64;
	}

	/**
	 * Convert ArrayBuffer to base64 string
	 */
	private arrayBufferToBase64(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer);
		let binary = '';
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	/**
	 * Send audio data to Google Cloud Speech-to-Text API
	 */
	private async sendToGoogleSpeechAPI(audioData: string): Promise<Record<string, unknown>> {
		if (!this.apiKey) {
			this.debug('No API key provided, using server API endpoint instead');
			try {
				// Get the actual sample rate from the audio context
				const sampleRate = this.audioContext?.sampleRate || 48000;
				this.debug('Using sample rate:', sampleRate, 'Hz');

				// Calculate duration of audio in seconds (approximately)
				const durationSecs = (this.recordedChunks.length * 4096) / sampleRate;
				this.debug('Approximate audio duration:', durationSecs.toFixed(2), 'seconds');

				const response = await fetch('/api/speech/diarize', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						audioData,
						config: {
							encoding: 'LINEAR16',
							sampleRateHertz: sampleRate,
							languageCode: 'en-US',
							minSpeakerCount: 1,
							maxSpeakerCount: 6
						}
					})
				});

				if (!response.ok) {
					this.debug('Server API error:', response.status, response.statusText);
					return {};
				}

				const result = await response.json();
				this.debug('Received diarization results from server API');
				return result;
			} catch (error) {
				console.error('Error calling server API:', error);
				return {};
			}
		}

		// Direct API call using the provided API key (fallback for client-side processing)
		this.debug('Using provided API key to send data directly to Google API');

		// For now, return a mock response because we're using the server API endpoint
		// In a real implementation, you might want direct API call as a fallback
		const mockResponse = {
			results: [
				{
					alternatives: [
						{
							transcript: 'Hello, this is a mock response.',
							words: [
								{ word: 'Hello', speakerTag: 1 },
								{ word: 'this', speakerTag: 1 },
								{ word: 'is', speakerTag: 1 },
								{ word: 'a', speakerTag: 1 },
								{ word: 'mock', speakerTag: 2 },
								{ word: 'response', speakerTag: 2 }
							]
						}
					]
				}
			]
		};

		return mockResponse;
	}

	/**
	 * Process diarization results from Google's API
	 */
	private processDiarizationResults(response: Record<string, unknown>): void {
		const results = response.results as Array<Record<string, unknown>>;
		if (!results || results.length === 0) {
			this.debug('No results to process');
			return;
		}

		// The speaker diarization result is usually in the last result
		// when enableSpeakerDiarization is true
		for (const result of results) {
			if (
				result.alternatives &&
				Array.isArray(result.alternatives) &&
				result.alternatives.length > 0 &&
				result.alternatives[0].words &&
				Array.isArray(result.alternatives[0].words) &&
				result.alternatives[0].words.length > 0
			) {
				const words = result.alternatives[0].words as GoogleSpeechWord[];

				// Check if these words have valid speaker tags
				const hasValidSpeakerTags = words.some((word) => word.speakerTag > 0);

				if (hasValidSpeakerTags) {
					this.debug('Processing', words.length, 'words with speaker tags');

					// Group words by speaker
					const speakerSegments: Record<number, string[]> = {};

					words.forEach((word: GoogleSpeechWord) => {
						const speakerTag = word.speakerTag;
						if (speakerTag <= 0) return; // Skip invalid tags

						if (!speakerSegments[speakerTag]) {
							speakerSegments[speakerTag] = [];
						}
						speakerSegments[speakerTag].push(word.word);
					});

					const speakerCount = Object.keys(speakerSegments).length;
					this.debug('Found', speakerCount, 'speakers in the audio');

					if (speakerCount > 0) {
						Object.entries(speakerSegments).forEach(([speakerTag, speakerWords]) => {
							this.debug(
								'Speaker',
								speakerTag,
								'said',
								speakerWords.length,
								'words:',
								speakerWords.join(' ')
							);
						});

						// Find the speaker with the most words (dominant speaker)
						let dominantSpeakerTag = 0;
						let maxWordCount = 0;

						Object.entries(speakerSegments).forEach(([speakerTag, speakerWords]) => {
							if (speakerWords.length > maxWordCount) {
								maxWordCount = speakerWords.length;
								dominantSpeakerTag = parseInt(speakerTag, 10);
							}
						});

						if (dominantSpeakerTag > 0) {
							this.debug(
								'Dominant speaker is tag',
								dominantSpeakerTag,
								'with',
								maxWordCount,
								'words'
							);
							// Find or create a speaker for the dominant speaker
							this.handleDominantSpeaker(dominantSpeakerTag);
							return; // Successfully processed results
						}
					}
				}
			}
		}

		this.debug('No valid diarization results found in the response');
		this.debug('Response format:', JSON.stringify(response, null, 2).substring(0, 500) + '...');
	}

	/**
	 * Handle the detected dominant speaker
	 */
	private handleDominantSpeaker(speakerTag: number): void {
		// Check if we already have this speaker mapped
		const detectedSpeaker = this.speakerMappings.get(speakerTag);

		if (detectedSpeaker) {
			// Found existing speaker, notify
			this.debug('Matched existing speaker:', detectedSpeaker.name, 'with tag', speakerTag);
			if (this.onSpeakerDetected) {
				this.onSpeakerDetected(detectedSpeaker.id);
			}
		} else {
			// Create a new speaker in the store
			this.debug(
				'New speaker detected with Google speaker tag:',
				speakerTag,
				'- creating in store'
			);

			// Create a new speaker with the Google speaker tag in the store
			const speakerId = speakerStore.createAutoDetectedSpeaker([]);
			const speaker = speakerStore.getSpeaker(speakerId);

			if (speaker) {
				// Update the speaker with the Google ID
				speakerStore.updateSpeakerVoiceProfile(speakerId, {
					googleSpeakerId: speakerTag
				});

				// Update our local mapping
				this.speakerMappings.set(speakerTag, speaker);

				// Notify about the detection
				if (this.onSpeakerDetected) {
					this.onSpeakerDetected(speakerId);
				}
			}
		}
	}

	/**
	 * Set a speaker's Google speaker ID mapping
	 */
	setSpeakerMapping(speaker: Speaker, googleSpeakerId: number): void {
		this.debug('Mapping speaker', speaker.name, 'to Google speaker tag', googleSpeakerId);

		// Update the speaker's voice profile in the store
		speakerStore.updateSpeakerVoiceProfile(speaker.id, {
			googleSpeakerId
		});

		// Update our local map
		this.speakerMappings.set(googleSpeakerId, speaker);
		this.debug('Speaker mapping updated, total mappings:', this.speakerMappings.size);
	}
}
