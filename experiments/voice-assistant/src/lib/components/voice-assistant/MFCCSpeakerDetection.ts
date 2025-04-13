import type { Speaker, SpeakerDetectionAlgorithm, SpeakerDetectionResult } from './types';
import { speakerStore, activeSpeakerId, currentlySpeakingSpeakerId } from './stores/speakerStore';
import { get } from 'svelte/store';

/**
 * MFCC Speaker Detection - Speaker identification using Mel-frequency cepstral coefficients
 *
 * This implementation extracts MFCC features from audio to create voice fingerprints
 * that can be used to identify speakers with high accuracy.
 */
export class MFCCSpeakerDetection implements SpeakerDetectionAlgorithm {
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private microphone: MediaStreamAudioSourceNode | null = null;
	private stream: MediaStream | null = null;
	private dataArray: Float32Array = new Float32Array();
	private speakerProfiles: Map<string, number[]> = new Map();
	private processingInterval: number | null = null;
	private isProcessing: boolean = false;
	private debugMode: boolean = true;
	private lastDetectedSpeakerId: string | null = null;
	private silenceCounter: number = 0;
	private speakingCounter: number = 0;
	private onSpeakerDetectedCallback: ((speakerId: string) => void) | null = null;
	private onNewSpeakerDetectedCallback: ((voiceProfile: number[]) => void) | null = null;

	// MFCC configuration
	private sampleRate: number = 44100;
	private fftSize: number = 1024;
	private melFilterBanks: number = 26;
	private mfccCoefficients: number = 13;
	private silenceThreshold: number = 15;
	private similarityThreshold: number = 0.75;
	private SILENCE_FRAMES_THRESHOLD = 5; // Consider silent after N silent frames
	private SPEAKING_FRAMES_THRESHOLD = 3; // Consider speaking after N speaking frames

	/**
	 * Initialize the MFCC speaker detection
	 */
	constructor(
		options: {
			silenceThreshold?: number;
			similarityThreshold?: number;
			melFilterBanks?: number;
			mfccCoefficients?: number;
			onSpeakerDetected?: (speakerId: string) => void;
			onNewSpeakerDetected?: (voiceProfile: number[]) => void;
		} = {}
	) {
		this.silenceThreshold = options.silenceThreshold || this.silenceThreshold;
		this.similarityThreshold = options.similarityThreshold || this.similarityThreshold;
		this.melFilterBanks = options.melFilterBanks || this.melFilterBanks;
		this.mfccCoefficients = options.mfccCoefficients || this.mfccCoefficients;
		this.onSpeakerDetectedCallback = options.onSpeakerDetected || null;
		this.onNewSpeakerDetectedCallback = options.onNewSpeakerDetected || null;

		// Load speaker profiles from store
		this.initializeSpeakerProfiles();

		// Subscribe to speaker store changes
		this.subscribeSpeakerStore();

		this.debug('Initialized with options:', {
			silenceThreshold: this.silenceThreshold,
			similarityThreshold: this.similarityThreshold,
			melFilterBanks: this.melFilterBanks,
			mfccCoefficients: this.mfccCoefficients
		});
	}

	/**
	 * Load speaker profiles from store
	 */
	private initializeSpeakerProfiles(): void {
		const speakers = get(speakerStore).speakers;
		this.updateSpeakerProfiles(speakers);
	}

	/**
	 * Subscribe to speaker store changes to keep profiles updated
	 */
	private subscribeSpeakerStore(): void {
		// This will ensure our profiles are always up to date with the store
		speakerStore.subscribe((state) => {
			this.updateSpeakerProfiles(state.speakers);
		});
	}

	/**
	 * Update speaker profiles from speaker list
	 */
	private updateSpeakerProfiles(speakers: Speaker[]): void {
		// Clear existing profiles
		this.speakerProfiles.clear();

		// Add profiles for speakers with voice profiles
		speakers.forEach((speaker) => {
			if (speaker.voiceProfile?.features) {
				// If features are stored as an array of arrays, we need to flatten it
				const features = Array.isArray(speaker.voiceProfile.features[0])
					? this.calculateAverageProfile(speaker.voiceProfile.features as unknown as number[][])
					: (speaker.voiceProfile.features as number[]);

				this.speakerProfiles.set(speaker.id, features);
			}
		});

		this.debug('Updated profiles for', this.speakerProfiles.size, 'speakers');
	}

	/**
	 * Debug logging
	 */
	private debug(...args: unknown[]): void {
		if (this.debugMode) {
			console.log('[MFCCDetector]', ...args);
		}
	}

	/**
	 * Initialize audio context and analyzer
	 */
	async initialize(): Promise<boolean> {
		this.debug('Initializing audio...');
		try {
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

			if (!AudioContextClass) {
				this.debug('AudioContext not supported in this browser');
				throw new Error('AudioContext not supported in this browser');
			}

			this.audioContext = new AudioContextClass();
			this.sampleRate = this.audioContext.sampleRate;
			this.debug('Using sample rate:', this.sampleRate, 'Hz');

			this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			this.debug('Microphone access granted');

			this.microphone = this.audioContext.createMediaStreamSource(this.stream);
			this.analyser = this.audioContext.createAnalyser();
			this.analyser.fftSize = this.fftSize * 2; // Must be power of 2, frequency bins will be fftSize/2
			this.microphone.connect(this.analyser);
			this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
			this.debug('Audio initialized with buffer length:', this.dataArray.length);

			return true;
		} catch (error) {
			console.error('Error initializing audio:', error);
			return false;
		}
	}

	/**
	 * Start speaker detection
	 */
	async startDetection(): Promise<boolean> {
		this.debug('Starting detection...');
		if (!this.audioContext) {
			this.debug('Audio context not initialized, initializing now');
			const success = await this.initialize();
			if (!success) {
				this.debug('Failed to initialize audio');
				return false;
			}
		}

		this.isProcessing = true;
		this.processAudio();
		this.debug('MFCC detection started');
		return true;
	}

	/**
	 * Stop speaker detection
	 */
	stopDetection(): void {
		this.debug('Stopping detection...');
		this.isProcessing = false;

		if (this.processingInterval) {
			clearInterval(this.processingInterval);
			this.processingInterval = null;
			this.debug('Processing interval cleared');
		}

		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.debug('Audio stream tracks stopped');
		}

		this.stream = null;
		this.microphone = null;
		this.analyser = null;

		if (this.audioContext) {
			if (this.audioContext.state !== 'closed') {
				this.audioContext.close();
				this.debug('Audio context closed');
			}
			this.audioContext = null;
		}
		this.debug('Detection fully stopped');
	}

	/**
	 * Process audio data for speaker detection
	 */
	private processAudio(): void {
		if (!this.analyser || !this.isProcessing) return;

		this.debug('Starting audio processing loop');
		// Create a process interval to analyze audio frames
		this.processingInterval = window.setInterval(() => {
			if (!this.analyser || !this.isProcessing) {
				if (this.processingInterval) {
					clearInterval(this.processingInterval);
					this.processingInterval = null;
					this.debug('Processing stopped due to missing analyser or processing flag');
				}
				return;
			}

			// Get frequency data
			this.analyser.getFloatFrequencyData(this.dataArray);

			// Calculate RMS to check if audio is above silence threshold
			const rms = this.calculateRMS(this.dataArray);

			if (rms < this.silenceThreshold) {
				this.silenceCounter++;

				// Check if we've been silent long enough to stop speaking
				if (this.silenceCounter >= this.SILENCE_FRAMES_THRESHOLD) {
					if (get(currentlySpeakingSpeakerId) !== null) {
						this.debug('Silence detected, stopping speaking');
						speakerStore.setCurrentlySpeaking(null);
						this.speakingCounter = 0;
					}
				}
				return; // Skip silent frames
			} else {
				// Reset silence counter as we're hearing something
				this.silenceCounter = 0;
			}

			this.debug('Processing audio frame, energy level:', rms.toFixed(2));

			// Extract MFCC features
			const mfccFeatures = this.calculateMFCC(this.dataArray);
			this.debug('Extracted MFCC features, length:', mfccFeatures.length);

			// Identify speaker based on MFCC features
			const detectionResult = this.identifySpeaker(mfccFeatures);

			// Process the detection result to update the speaker state
			this.handleDetectionResult(detectionResult);
		}, 300); // Process every 300ms
		this.debug('Audio processing interval set to 300ms');
	}

	/**
	 * Calculate RMS (Root Mean Square) energy level
	 */
	private calculateRMS(spectrum: Float32Array): number {
		let sum = 0;
		for (let i = 0; i < spectrum.length; i++) {
			// Convert dB to power
			sum += Math.pow(10, spectrum[i] / 10);
		}
		return 10 * Math.log10(sum / spectrum.length + 1e-10);
	}

	/**
	 * Calculate MFCC features from frequency data
	 */
	private calculateMFCC(frequencyData: Float32Array): number[] {
		// 1. Convert to power spectrum
		const powerSpectrum = new Float32Array(frequencyData.length);
		for (let i = 0; i < frequencyData.length; i++) {
			// Convert dB to power
			powerSpectrum[i] = Math.pow(10, frequencyData[i] / 10);
		}

		// 2. Apply Mel filterbank
		const melFilterbank = this.createMelFilterbank();
		const melSpectrum = this.applyMelFilterbank(powerSpectrum, melFilterbank);

		// 3. Take log of Mel spectrum
		const logMelSpectrum = new Float32Array(melSpectrum.length);
		for (let i = 0; i < melSpectrum.length; i++) {
			logMelSpectrum[i] = Math.log(Math.max(melSpectrum[i], 1e-10));
		}

		// 4. Apply DCT to get MFCC
		const mfcc = this.discreteCosineTransform(logMelSpectrum);

		// 5. Return first N coefficients
		return Array.from(mfcc.slice(0, this.mfccCoefficients));
	}

	/**
	 * Create Mel filterbank
	 */
	private createMelFilterbank(): Float32Array[] {
		const lowFreq = 0;
		const highFreq = this.sampleRate / 2;
		const lowMel = this.freqToMel(lowFreq);
		const highMel = this.freqToMel(highFreq);
		const frequencyBins = this.analyser?.frequencyBinCount || this.fftSize / 2;

		// Create equally spaced points in Mel scale
		const melPoints = [];
		const melRange = highMel - lowMel;

		for (let i = 0; i <= this.melFilterBanks + 1; i++) {
			const mel = lowMel + (melRange * i) / (this.melFilterBanks + 1);
			melPoints.push(this.melToFreq(mel));
		}

		// Convert to FFT bin indices
		const fftBins = melPoints.map((freq) =>
			Math.floor((frequencyBins * freq) / (this.sampleRate / 2))
		);

		// Create filterbank matrix
		const filterbank: Float32Array[] = [];
		for (let i = 0; i < this.melFilterBanks; i++) {
			const filter = new Float32Array(frequencyBins).fill(0);

			for (let j = fftBins[i]; j < fftBins[i + 1]; j++) {
				if (j < frequencyBins) {
					filter[j] = (j - fftBins[i]) / (fftBins[i + 1] - fftBins[i]);
				}
			}

			for (let j = fftBins[i + 1]; j < fftBins[i + 2]; j++) {
				if (j < frequencyBins) {
					filter[j] = (fftBins[i + 2] - j) / (fftBins[i + 2] - fftBins[i + 1]);
				}
			}

			filterbank.push(filter);
		}

		return filterbank;
	}

	/**
	 * Apply Mel filterbank to power spectrum
	 */
	private applyMelFilterbank(
		powerSpectrum: Float32Array,
		filterbank: Float32Array[]
	): Float32Array {
		const result = new Float32Array(filterbank.length);

		for (let i = 0; i < filterbank.length; i++) {
			const filter = filterbank[i];
			let sum = 0;
			for (let j = 0; j < Math.min(filter.length, powerSpectrum.length); j++) {
				sum += filter[j] * powerSpectrum[j];
			}
			result[i] = sum;
		}

		return result;
	}

	/**
	 * Discrete Cosine Transform implementation
	 */
	private discreteCosineTransform(input: Float32Array): Float32Array {
		const N = input.length;
		const result = new Float32Array(N);

		for (let k = 0; k < N; k++) {
			let sum = 0;
			for (let n = 0; n < N; n++) {
				sum += input[n] * Math.cos((Math.PI / N) * (n + 0.5) * k);
			}
			result[k] = sum * (k === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N));
		}

		return result;
	}

	/**
	 * Convert frequency to Mel scale
	 */
	private freqToMel(freq: number): number {
		return 2595 * Math.log10(1 + freq / 700);
	}

	/**
	 * Convert Mel to frequency
	 */
	private melToFreq(mel: number): number {
		return 700 * (Math.pow(10, mel / 2595) - 1);
	}

	/**
	 * Identify speaker based on MFCC features
	 */
	private identifySpeaker(mfccFeatures: number[]): SpeakerDetectionResult {
		if (this.speakerProfiles.size === 0) {
			this.debug('No speaker profiles available, creating new speaker');
			const speakerId = speakerStore.createAutoDetectedSpeaker(mfccFeatures);
			return {
				// Calculate a random speaker ID
				speakerId: speakerId,
				confidence: 0,
				isNewSpeaker: true,
				voiceProfile: { features: mfccFeatures }
			};
		}

		let bestMatchId: string | number | null = null;
		let highestSimilarity = 0;

		// Compare with all existing profiles
		for (const [speakerId, profile] of speakerStore.getSpeakers().entries()) {
			if (!profile.voiceProfile?.features) {
				continue;
			}
			const similarity = this.calculateSimilarity(mfccFeatures, profile.voiceProfile.features);
			this.debug('Speaker', speakerId, 'similarity:', similarity.toFixed(4));

			if (similarity > highestSimilarity) {
				highestSimilarity = similarity;
				bestMatchId = speakerId;
			}
		}

		// If found a matching speaker above threshold
		if (bestMatchId && highestSimilarity <= this.similarityThreshold) {
			this.debug(
				'Identified speaker:',
				bestMatchId,
				'with confidence:',
				highestSimilarity.toFixed(4)
			);

			// Return detection result (for external processing)
			return {
				speakerId: String(bestMatchId),
				confidence: highestSimilarity,
				isNewSpeaker: false
			};
		} else {
			// New speaker detected
			this.debug(
				'No matching speaker found, confidence too low:',
				highestSimilarity.toFixed(4),
				'< threshold:',
				this.similarityThreshold
			);

			// Return detection result for a new speaker
			return {
				speakerId: null,
				confidence: 1 - highestSimilarity, // Confidence that it's a new speaker
				isNewSpeaker: true,
				voiceProfile: { features: mfccFeatures }
			};
		}
	}

	/**
	 * Calculate cosine similarity between two feature vectors
	 * Implementation for SpeakerDetectionAlgorithm interface
	 */
	calculateSimilarity(features1: number[], features2: number[]): number {
		if (!features1 || !features2 || features1.length !== features2.length) {
			this.debug('Invalid features for similarity calculation');
			return 0;
		}

		// Implement cosine similarity
		let dotProduct = 0;
		let magnitude1 = 0;
		let magnitude2 = 0;

		for (let i = 0; i < features1.length; i++) {
			dotProduct += features1[i] * features2[i];
			magnitude1 += features1[i] * features1[i];
			magnitude2 += features2[i] * features2[i];
		}

		magnitude1 = Math.sqrt(magnitude1);
		magnitude2 = Math.sqrt(magnitude2);

		if (magnitude1 === 0 || magnitude2 === 0) {
			this.debug('Zero magnitude detected in features');
			return 0;
		}

		const similarity = dotProduct / (magnitude1 * magnitude2);

		// Normalize to 0-1 range (cosine similarity is between -1 and 1)
		return (similarity + 1) / 2;
	}

	/**
	 * Calculate average profile from multiple samples
	 */
	private calculateAverageProfile(profiles: number[][]): number[] {
		if (profiles.length === 0) {
			this.debug('No profiles provided for averaging');
			return [];
		}

		const dimensions = profiles[0].length;
		const average = new Array(dimensions).fill(0);

		// Sum all profiles
		for (const profile of profiles) {
			for (let i = 0; i < dimensions; i++) {
				average[i] += profile[i] / profiles.length;
			}
		}

		this.debug('Calculated average profile from', profiles.length, 'samples');
		return average;
	}

	/**
	 * Train the detector with audio data for a specific speaker
	 * Implementation for SpeakerDetectionAlgorithm interface
	 */
	async train(speakerId: string, audioDataSamples: Uint8Array[]): Promise<number[]> {
		this.debug('Training speaker:', speakerId, 'with', audioDataSamples.length, 'samples');

		// Process audio data to extract MFCC features
		const featuresSamples: number[][] = [];

		for (const audioData of audioDataSamples) {
			// Convert Uint8Array to Float32Array
			const float32Data = new Float32Array(audioData.length);
			for (let i = 0; i < audioData.length; i++) {
				float32Data[i] = audioData[i] / 128 - 1;
			}

			// Extract MFCC features
			const mfccFeatures = this.calculateMFCC(float32Data);
			featuresSamples.push(mfccFeatures);
		}

		// Calculate and store average profile
		const averageProfile = this.calculateAverageProfile(featuresSamples);
		this.speakerProfiles.set(speakerId, averageProfile);

		// Update the speaker's voice profile in the store
		speakerStore.updateSpeakerVoiceProfile(speakerId, {
			features: averageProfile
		});

		this.debug('Speaker profile updated, total speakers:', this.speakerProfiles.size);
		return averageProfile;
	}

	/**
	 * Collect voice samples for training
	 */
	async collectVoiceSamples(duration: number = 5000): Promise<number[][]> {
		this.debug('Collecting voice samples for', duration, 'ms');

		if (!this.audioContext || !this.analyser) {
			await this.initialize();
		}

		if (!this.analyser) {
			throw new Error('Failed to initialize audio analyzer');
		}

		const samples: number[][] = [];
		let collectingInterval: number;

		return new Promise((resolve) => {
			const startTime = Date.now();

			collectingInterval = window.setInterval(() => {
				// Check if collection duration has elapsed
				if (Date.now() - startTime >= duration) {
					clearInterval(collectingInterval);
					this.debug('Voice sample collection complete, collected', samples.length, 'samples');
					resolve(samples);
					return;
				}

				// Get frequency data
				this.analyser!.getFloatFrequencyData(this.dataArray);

				// Check if audio is above silence threshold
				const rms = this.calculateRMS(this.dataArray);
				if (rms <= this.silenceThreshold) {
					// Extract MFCC features for this frame
					const mfccFeatures = this.calculateMFCC(this.dataArray);
					samples.push(mfccFeatures);
					this.debug('Collected sample', samples.length, 'energy:', rms.toFixed(2));
				}
			}, 200); // Collect samples every 200ms
		});
	}

	/**
	 * Implementation of detect method for SpeakerDetectionAlgorithm interface
	 */
	async detect(audioData?: Uint8Array): Promise<SpeakerDetectionResult> {
		this.debug('Detecting speaker...');

		// If audioData is provided, use it directly
		if (audioData) {
			const float32Data = new Float32Array(audioData.length);
			for (let i = 0; i < audioData.length; i++) {
				// Convert Uint8Array to Float32Array normalized to -1 to 1
				float32Data[i] = audioData[i] / 128 - 1;
			}

			// Extract MFCC features
			const mfccFeatures = this.calculateMFCC(float32Data);

			// Identify speaker and return result
			return this.identifySpeaker(mfccFeatures);
		}

		// Otherwise, use real-time audio data from analyzer
		if (!this.analyser) {
			await this.initialize();
		}

		if (!this.analyser) {
			return {
				speakerId: null,
				confidence: 0,
				isNewSpeaker: false
			};
		}

		// Get frequency data
		this.analyser.getFloatFrequencyData(this.dataArray);

		// Check if audio is above silence threshold
		const rms = this.calculateRMS(this.dataArray);
		if (rms < this.silenceThreshold) {
			return {
				speakerId: null,
				confidence: 0,
				isNewSpeaker: false
			};
		}

		// Extract MFCC features
		const mfccFeatures = this.calculateMFCC(this.dataArray);

		// Identify speaker and return result
		return this.identifySpeaker(mfccFeatures);
	}

	/**
	 * Handle speaker detection result
	 */
	private handleDetectionResult(result: SpeakerDetectionResult): void {
		if (result.speakerId) {
			// Existing speaker detected
			this.speakingCounter++;
			this.lastDetectedSpeakerId = result.speakerId;

			if (this.speakingCounter >= this.SPEAKING_FRAMES_THRESHOLD) {
				// Update currently speaking speaker in the store
				speakerStore.setCurrentlySpeaking(result.speakerId);

				// Consider setting as active speaker if we have high confidence
				if (result.confidence > 0.85 && get(activeSpeakerId) !== result.speakerId) {
					speakerStore.setActiveSpeaker(result.speakerId);
				}

				// Call the callback if provided
				if (this.onSpeakerDetectedCallback) {
					this.onSpeakerDetectedCallback(result.speakerId);
				}
			}
		} else if (
			result.isNewSpeaker &&
			result.voiceProfile &&
			Array.isArray(result.voiceProfile.features)
		) {
			// New speaker detected
			this.debug('New speaker detected with confidence:', result.confidence * 100);

			// Create a new speaker in the store
			if (result.confidence * 100 > 0.3) {
				// Only create new speakers if we're reasonably confident
				this.handleNewSpeaker(result.voiceProfile.features);
			}
		}
	}

	/**
	 * Handle new speaker detection
	 */
	private handleNewSpeaker(features: number[]): void {
		// Call the callback if provided, or create a new speaker automatically
		if (this.onNewSpeakerDetectedCallback) {
			this.onNewSpeakerDetectedCallback(features);
		} else {
			// Auto-create a new speaker
			const speakerId = speakerStore.createAutoDetectedSpeaker(features);
			this.debug('Auto-created new speaker:', speakerId);

			// Set as active/currently speaking
			speakerStore.setActiveSpeaker(speakerId);
			speakerStore.setCurrentlySpeaking(speakerId);
			this.lastDetectedSpeakerId = speakerId;
		}
	}

	/**
	 * Update speaker profiles when speakers change
	 */
	updateSpeakers(speakers: Speaker[]): void {
		this.debug('Updating speakers:', speakers.length);
		this.updateSpeakerProfiles(speakers);
	}
}
