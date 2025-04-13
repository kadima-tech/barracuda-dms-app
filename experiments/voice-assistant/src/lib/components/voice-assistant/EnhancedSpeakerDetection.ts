import type {
	SpeakerDetectionAlgorithm,
	SpeakerDetectionResult,
	SpeakerDetectionOptions,
	FeatureExtractor
} from './types';
import { MFCCFeatureExtractor } from './MFCCFeatureExtractor';

/**
 * Enhanced speaker detection algorithm using MFCC features
 * This implementation uses Mel-Frequency Cepstral Coefficients for improved
 * speaker identification accuracy compared to the basic implementation
 */
export class EnhancedSpeakerDetector implements SpeakerDetectionAlgorithm {
	private initialized = false;
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private microphone: MediaStreamAudioSourceNode | null = null;
	private dataArray: Uint8Array = new Uint8Array();
	private speakerProfiles: Map<string, number[][]> = new Map();
	private speakerAverageProfiles: Map<string, number[]> = new Map();
	private debugMode: boolean = true;

	// Configuration parameters
	private silenceThreshold: number;
	private sampleCount: number;
	private similarityThreshold: number;
	private featureExtractor: FeatureExtractor;

	constructor(options: SpeakerDetectionOptions = {}) {
		this.silenceThreshold = options.silenceThreshold || 15;
		this.sampleCount = options.sampleCount || 5;
		this.similarityThreshold = options.similarityThreshold || 0.75;
		this.featureExtractor = options.featureExtractor || new MFCCFeatureExtractor();
		this.debug('Initialized with options:', {
			silenceThreshold: this.silenceThreshold,
			sampleCount: this.sampleCount,
			similarityThreshold: this.similarityThreshold,
			featureExtractor: this.featureExtractor.constructor.name
		});
	}

	private debug(...args: unknown[]): void {
		if (this.debugMode) {
			console.log('[EnhancedDetector]', ...args);
		}
	}

	/**
	 * Initialize audio context and analyzer for processing audio input
	 */
	async initialize(): Promise<boolean> {
		this.debug('Initializing audio...');
		try {
			// Request microphone access
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			this.debug('Microphone access granted');

			// Create audio context and analyzer
			this.audioContext = new AudioContext();
			this.analyser = this.audioContext.createAnalyser();
			this.microphone = this.audioContext.createMediaStreamSource(stream);

			// Connect microphone to analyzer
			this.microphone.connect(this.analyser);

			// Configure analyzer
			this.analyser.fftSize = 2048;
			const bufferLength = this.analyser.frequencyBinCount;
			this.dataArray = new Uint8Array(bufferLength);
			this.debug('Audio initialized with buffer length:', bufferLength);

			this.initialized = true;
			return true;
		} catch (error) {
			console.error('Error initializing audio:', error);
			return false;
		}
	}

	/**
	 * Detect speaker from audio data
	 * @param audioData Raw frequency data in Uint8Array format
	 * @returns Detection result with speaker ID, confidence, and whether it's a new speaker
	 */
	async detect(audioData: Uint8Array): Promise<SpeakerDetectionResult> {
		if (!this.initialized) {
			this.debug('Not initialized, initializing now');
			await this.initialize();
		}

		// Check if audio has sufficient volume (not silence)
		const avgVolume = this.getAverageVolume(audioData);
		this.debug('Current volume level:', avgVolume.toFixed(2), 'threshold:', this.silenceThreshold);

		if (avgVolume < this.silenceThreshold) {
			this.debug('Volume below threshold, considering silence');
			return {
				speakerId: null,
				confidence: 0,
				isNewSpeaker: false
			};
		}

		// Extract features from audio data
		const features = this.featureExtractor.extract(audioData);
		this.debug('Extracted features length:', features.length);

		// If no speaker profiles exist, indicate this is a new speaker
		if (this.speakerAverageProfiles.size === 0) {
			this.debug('No speaker profiles exist, suggesting new speaker');
			return {
				speakerId: null,
				confidence: 0,
				isNewSpeaker: true,
				voiceProfile: { features }
			};
		}

		// Find best matching speaker
		let bestMatch: string | null = null;
		let highestSimilarity = 0;

		this.debug('Comparing with', this.speakerAverageProfiles.size, 'existing speakers');
		for (const [speakerId, profile] of this.speakerAverageProfiles.entries()) {
			const similarity = this.calculateSimilarity(features, profile);
			this.debug('Speaker', speakerId, 'similarity:', similarity.toFixed(4));

			if (similarity > highestSimilarity) {
				highestSimilarity = similarity;
				bestMatch = speakerId;
			}
		}

		// Determine if this is a new speaker or identified existing speaker
		if (highestSimilarity >= this.similarityThreshold) {
			this.debug(
				'Identified existing speaker',
				bestMatch,
				'with confidence',
				highestSimilarity.toFixed(4)
			);
			return {
				speakerId: bestMatch,
				confidence: highestSimilarity,
				isNewSpeaker: false
			};
		} else {
			this.debug(
				'New speaker detected, highest similarity was',
				highestSimilarity.toFixed(4),
				'below threshold',
				this.similarityThreshold
			);
			return {
				speakerId: null,
				confidence: 1 - highestSimilarity, // Confidence that it's a new speaker
				isNewSpeaker: true,
				voiceProfile: { features }
			};
		}
	}

	/**
	 * Train the detector with voice samples for a specific speaker
	 * @param speakerId Speaker identifier
	 * @param audioDataSamples Array of audio samples
	 * @returns Averaged voice profile for the speaker
	 */
	async train(speakerId: string, audioDataSamples: Uint8Array[]): Promise<number[]> {
		this.debug('Training speaker:', speakerId, 'with', audioDataSamples.length, 'samples');

		if (!this.initialized) {
			this.debug('Not initialized, initializing now');
			await this.initialize();
		}

		const profiles: number[][] = [];

		// Process each audio sample to extract features
		for (const audioData of audioDataSamples) {
			const volume = this.getAverageVolume(audioData);
			this.debug('Sample volume:', volume.toFixed(2));

			if (volume >= this.silenceThreshold) {
				const features = this.featureExtractor.extract(audioData);
				profiles.push(features);
				this.debug('Extracted features, length:', features.length);
			} else {
				this.debug('Sample below volume threshold, skipping');
			}
		}

		this.debug('Collected', profiles.length, 'valid profiles for training');

		// Store all profiles for this speaker
		this.speakerProfiles.set(speakerId, profiles);

		// Calculate and store average profile
		const averageProfile = this.calculateAverageProfile(profiles);
		this.speakerAverageProfiles.set(speakerId, averageProfile);
		this.debug('Speaker profile updated, total speakers:', this.speakerAverageProfiles.size);

		return averageProfile;
	}

	/**
	 * Calculate similarity between two voice profiles using cosine similarity
	 * @param profile1 First voice profile
	 * @param profile2 Second voice profile
	 * @returns Similarity score between 0 and 1
	 */
	calculateSimilarity(profile1: number[], profile2: number[]): number {
		if (!profile1 || !profile2 || profile1.length !== profile2.length) {
			this.debug('Invalid profiles for similarity calculation');
			return 0;
		}

		// Implement cosine similarity
		let dotProduct = 0;
		let magnitude1 = 0;
		let magnitude2 = 0;

		for (let i = 0; i < profile1.length; i++) {
			dotProduct += profile1[i] * profile2[i];
			magnitude1 += profile1[i] * profile1[i];
			magnitude2 += profile2[i] * profile2[i];
		}

		magnitude1 = Math.sqrt(magnitude1);
		magnitude2 = Math.sqrt(magnitude2);

		if (magnitude1 === 0 || magnitude2 === 0) {
			this.debug('Zero magnitude detected in profiles');
			return 0;
		}

		const similarity = dotProduct / (magnitude1 * magnitude2);

		// Normalize to 0-1 range (cosine similarity is between -1 and 1)
		return (similarity + 1) / 2;
	}

	/**
	 * Calculate average volume of audio data
	 * @param audioData Audio frequency data
	 * @returns Average volume
	 */
	private getAverageVolume(audioData: Uint8Array): number {
		const sum = audioData.reduce((acc, value) => acc + value, 0);
		return sum / audioData.length;
	}

	/**
	 * Calculate average profile from multiple samples
	 * @param profiles Array of voice profiles
	 * @returns Averaged voice profile
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
}
