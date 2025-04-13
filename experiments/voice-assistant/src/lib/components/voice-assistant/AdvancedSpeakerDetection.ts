import type { Speaker } from './types';

/**
 * Advanced Speaker Detection based on voice embeddings and diarization techniques
 * Implements strategies from research on speaker diarization and recognition
 */

// Constants for advanced speaker detection
const SILENCE_THRESHOLD = 20; // Volume threshold to detect speech
const FEATURE_DIMENSION = 40; // Dimension of extracted voice features
const EMBEDDING_SIZE = 128; // Dimension of speaker embeddings
const SIMILARITY_THRESHOLD = 0.85; // Threshold for speaker similarity matching
const DEBUG_MODE = true; // Enable debug logs

// Helper debug function for the module
function debug(...args: unknown[]): void {
	if (DEBUG_MODE) {
		console.log('[AdvancedDetector]', ...args);
	}
}

/**
 * Interface for audio processing modules
 */
export interface AudioProcessor {
	processAudioChunk(audioData: Float32Array): void;
	reset(): void;
}

/**
 * Speaker embedding representation
 */
export interface SpeakerEmbedding {
	features: number[][];
	embedding: number[];
}

/**
 * Result of speaker identification
 */
export interface SpeakerIdentificationResult {
	speakerId: string | null;
	confidence: number;
	isNewSpeaker: boolean;
}

/**
 * Audio feature extractor for speaker identification
 * Extracts spectral features from audio frames
 */
export class AudioFeatureExtractor implements AudioProcessor {
	private frameSize: number;
	private sampleRate: number;
	private features: number[][] = [];

	constructor(frameSize: number = 1024, sampleRate: number = 44100) {
		this.frameSize = frameSize;
		this.sampleRate = sampleRate;
		debug(
			'AudioFeatureExtractor initialized with frameSize:',
			frameSize,
			'sampleRate:',
			sampleRate
		);
	}

	processAudioChunk(audioData: Float32Array): void {
		// Skip processing if audio is too quiet (silence)
		const energy = this.calculateEnergy(audioData);
		if (energy < SILENCE_THRESHOLD) {
			debug('Audio energy below threshold:', energy.toFixed(2), '<', SILENCE_THRESHOLD);
			return;
		}
		debug('Processing audio chunk with energy:', energy.toFixed(2));

		// Extract spectral features for voice characterization
		const features = this.extractSpectralFeatures(audioData);
		if (features) {
			this.features.push(features);
			debug('Features extracted, total frames:', this.features.length);
		}
	}

	reset(): void {
		debug('Resetting feature extractor, clearing', this.features.length, 'frames');
		this.features = [];
	}

	getFeatures(): number[][] {
		return this.features;
	}

	/**
	 * Calculates energy level of audio frame
	 */
	private calculateEnergy(buffer: Float32Array): number {
		let sum = 0;
		for (let i = 0; i < buffer.length; i++) {
			sum += buffer[i] * buffer[i];
		}
		return Math.sqrt(sum / buffer.length) * 100;
	}

	/**
	 * Extracts spectral features from audio frame
	 * Simplified version that extracts basic spectral information
	 */
	private extractSpectralFeatures(buffer: Float32Array): number[] | null {
		if (buffer.length < this.frameSize) {
			debug('Buffer too small for feature extraction:', buffer.length, '<', this.frameSize);
			return null;
		}

		// Extract spectrum using FFT (in a real implementation, we would use a proper FFT library)
		// This is a simplified approach
		const spectrum = this.calculateSpectrum(buffer);

		// Extract mel-scale spectral features (simplified approach)
		const features = this.calculateMelFeatures(spectrum);
		debug('Extracted features with length:', features.length);

		return features;
	}

	/**
	 * Calculates spectrum using a simplified approach
	 * In a real implementation, this would use a proper FFT
	 */
	private calculateSpectrum(buffer: Float32Array): number[] {
		const numBands = FEATURE_DIMENSION;
		const spectrum = new Array(numBands).fill(0);

		// Simplified spectrum analysis by dividing the buffer into bands
		const samplesPerBand = Math.floor(buffer.length / numBands);

		for (let band = 0; band < numBands; band++) {
			let sum = 0;
			const startIdx = band * samplesPerBand;
			const endIdx = startIdx + samplesPerBand;

			for (let i = startIdx; i < endIdx && i < buffer.length; i++) {
				sum += Math.abs(buffer[i]);
			}

			spectrum[band] = sum / samplesPerBand;
		}

		return spectrum;
	}

	/**
	 * Calculates mel-scale features (simplified)
	 * In a real implementation, this would apply mel filter banks
	 */
	private calculateMelFeatures(spectrum: number[]): number[] {
		// Apply log to compress dynamic range
		const logSpectrum = spectrum.map((value) => Math.log(value + 1e-6));

		// Normalize features
		return this.normalizeFeatures(logSpectrum);
	}

	/**
	 * Normalizes feature vector to have zero mean and unit variance
	 */
	private normalizeFeatures(features: number[]): number[] {
		const mean = features.reduce((sum, val) => sum + val, 0) / features.length;

		// Calculate standard deviation
		let sumSquaredDiff = 0;
		for (const val of features) {
			sumSquaredDiff += Math.pow(val - mean, 2);
		}
		const stdDev = Math.sqrt(sumSquaredDiff / features.length) || 1; // Prevent division by zero

		// Normalize
		return features.map((val) => (val - mean) / stdDev);
	}
}

/**
 * Speaker embedding model
 * Converts audio features into speaker embeddings
 */
export class SpeakerEmbeddingModel {
	private embeddingSize: number;

	constructor(embeddingSize: number = EMBEDDING_SIZE) {
		this.embeddingSize = embeddingSize;
		debug('SpeakerEmbeddingModel initialized with embeddingSize:', embeddingSize);
	}

	/**
	 * Generates speaker embedding from extracted features
	 */
	generateEmbedding(features: number[][]): number[] {
		if (features.length === 0) {
			debug('No features provided to generate embedding');
			return new Array(this.embeddingSize).fill(0);
		}

		debug('Generating embedding from', features.length, 'feature frames');

		// Aggregate features over time (simplified approach)
		// In a real implementation, this would use a neural network
		const embedding = new Array(this.embeddingSize).fill(0);
		const featureDim = features[0].length;

		// Project features to embedding space (simplified linear projection)
		for (let i = 0; i < this.embeddingSize; i++) {
			let sum = 0;
			for (const feature of features) {
				sum += feature[i % featureDim];
			}
			embedding[i] = sum / features.length;
		}

		// Normalize embedding to unit length
		const normalizedEmbedding = this.normalizeVector(embedding);
		debug('Embedding generated with dimension:', normalizedEmbedding.length);

		return normalizedEmbedding;
	}

	/**
	 * Normalizes vector to unit length
	 */
	private normalizeVector(vector: number[]): number[] {
		const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
		return vector.map((val) => val / magnitude);
	}
}

/**
 * Speaker identification system
 * Identifies speakers based on their voice embeddings
 */
export class SpeakerIdentifier {
	private speakers: Speaker[];
	private featureExtractor: AudioFeatureExtractor;
	private embeddingModel: SpeakerEmbeddingModel;
	private onSpeakerDetected: (speakerId: string) => void;
	private onNewSpeakerDetected: (voiceProfile: number[]) => void;
	private currentEmbedding: number[] | null = null;

	constructor(
		speakers: Speaker[],
		onSpeakerDetected: (speakerId: string) => void,
		onNewSpeakerDetected: (voiceProfile: number[]) => void,
		sampleRate: number = 44100
	) {
		this.speakers = speakers;
		this.onSpeakerDetected = onSpeakerDetected;
		this.onNewSpeakerDetected = onNewSpeakerDetected;
		this.featureExtractor = new AudioFeatureExtractor(1024, sampleRate);
		this.embeddingModel = new SpeakerEmbeddingModel();
		debug('SpeakerIdentifier initialized with', speakers.length, 'speakers');
	}

	/**
	 * Process an audio buffer for speaker identification
	 */
	processAudioBuffer(audioBuffer: Float32Array): void {
		this.featureExtractor.processAudioChunk(audioBuffer);

		// Check if we have enough features to generate an embedding
		const features = this.featureExtractor.getFeatures();
		if (features.length >= 10) {
			// Require minimum number of frames
			debug('Collected enough features, generating embedding');
			this.currentEmbedding = this.embeddingModel.generateEmbedding(features);
			this.identifySpeaker();
			this.featureExtractor.reset();
		}
	}

	/**
	 * Identify the speaker based on the current embedding
	 */
	private identifySpeaker(): void {
		if (!this.currentEmbedding) {
			debug('No current embedding available');
			return;
		}

		// Find the most similar speaker
		let bestMatchId: string | null = null;
		let highestSimilarity = 0;

		debug('Comparing embedding with', this.speakers.length, 'speakers');
		for (const speaker of this.speakers) {
			if (speaker.voiceProfile && speaker.voiceProfile.features) {
				const similarity = this.calculateSimilarity(
					this.currentEmbedding,
					speaker.voiceProfile.features
				);
				debug('Speaker', speaker.name, 'similarity:', similarity.toFixed(4));

				if (similarity > highestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
					highestSimilarity = similarity;
					bestMatchId = speaker.id;
				}
			}
		}

		// If found a matching speaker
		if (bestMatchId) {
			const matchedSpeaker = this.speakers.find((s) => s.id === bestMatchId);
			debug(
				'Matched speaker:',
				matchedSpeaker?.name,
				'with confidence:',
				highestSimilarity.toFixed(4)
			);
			this.onSpeakerDetected(bestMatchId);
		} else {
			// No matching speaker found, create a new one
			debug('No matching speaker found, suggesting new speaker creation');
			this.onNewSpeakerDetected(this.currentEmbedding);
		}
	}

	/**
	 * Calculate cosine similarity between two embeddings
	 */
	calculateSimilarity(embedding1: number[], embedding2: number[]): number {
		if (embedding1.length !== embedding2.length) {
			debug('Embedding dimensions do not match:', embedding1.length, '!=', embedding2.length);
			return 0;
		}

		let dotProduct = 0;
		let magnitude1 = 0;
		let magnitude2 = 0;

		for (let i = 0; i < embedding1.length; i++) {
			dotProduct += embedding1[i] * embedding2[i];
			magnitude1 += embedding1[i] * embedding1[i];
			magnitude2 += embedding2[i] * embedding2[i];
		}

		magnitude1 = Math.sqrt(magnitude1);
		magnitude2 = Math.sqrt(magnitude2);

		if (magnitude1 === 0 || magnitude2 === 0) {
			debug('Zero magnitude detected in embeddings');
			return 0;
		}

		return dotProduct / (magnitude1 * magnitude2);
	}

	/**
	 * Update the speakers list
	 */
	updateSpeakers(speakers: Speaker[]): void {
		debug('Updating speakers:', speakers.length);
		this.speakers = speakers;
	}
}

/**
 * Advanced Speaker Detector class
 * Provides an interface compatible with the existing SpeakerDetector
 */
export class AdvancedSpeakerDetector {
	audioContext: AudioContext | null = null;
	analyser: AnalyserNode | null = null;
	microphone: MediaStreamAudioSourceNode | null = null;
	stream: MediaStream | null = null;
	dataArray: Float32Array = new Float32Array();
	speakerIdentifier: SpeakerIdentifier;
	speakers: Speaker[] = [];
	activeSpeakerId: string | null = null;
	onSpeakerDetected: (speakerId: string) => void;
	onNewSpeakerDetected: (voiceProfile: number[]) => void;
	isProcessing: boolean = false;
	processingInterval: number | null = null;

	constructor(
		speakers: Speaker[],
		onSpeakerDetected: (speakerId: string) => void,
		onNewSpeakerDetected: (voiceProfile: number[]) => void
	) {
		this.speakers = speakers;
		this.onSpeakerDetected = onSpeakerDetected;
		this.onNewSpeakerDetected = onNewSpeakerDetected;
		this.speakerIdentifier = new SpeakerIdentifier(
			speakers,
			onSpeakerDetected,
			onNewSpeakerDetected
		);
		debug('AdvancedSpeakerDetector initialized with', speakers.length, 'speakers');
	}

	async initializeAudio(): Promise<boolean> {
		debug('Initializing audio context...');
		try {
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

			if (!AudioContextClass) {
				debug('AudioContext not supported in this browser');
				throw new Error('AudioContext not supported in this browser');
			}

			this.audioContext = new AudioContextClass();
			this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			debug('Microphone access granted');

			this.microphone = this.audioContext.createMediaStreamSource(this.stream);
			this.analyser = this.audioContext.createAnalyser();
			this.analyser.fftSize = 2048;
			this.microphone.connect(this.analyser);
			this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
			debug('Audio initialized with buffer length:', this.dataArray.length);

			return true;
		} catch (error) {
			console.error('Error initializing audio:', error);
			return false;
		}
	}

	async startDetection(): Promise<boolean> {
		debug('Starting detection...');
		if (!this.audioContext) {
			debug('Audio context not initialized, initializing now');
			const success = await this.initializeAudio();
			if (!success) {
				debug('Failed to initialize audio');
				return false;
			}
		}

		this.isProcessing = true;
		this.processAudio();
		debug('Advanced detection started');
		return true;
	}

	stopDetection(): void {
		debug('Stopping detection...');
		this.isProcessing = false;

		if (this.processingInterval) {
			clearInterval(this.processingInterval);
			this.processingInterval = null;
			debug('Processing interval cleared');
		}

		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			debug('Audio stream tracks stopped');
		}

		this.stream = null;
		this.microphone = null;
		this.analyser = null;

		if (this.audioContext) {
			if (this.audioContext.state !== 'closed') {
				this.audioContext.close();
				debug('Audio context closed');
			}
			this.audioContext = null;
		}
		debug('Detection fully stopped');
	}

	processAudio(): void {
		if (!this.analyser || !this.isProcessing) return;

		debug('Starting audio processing loop');
		// Create a process interval to analyze audio frames
		this.processingInterval = window.setInterval(() => {
			if (!this.analyser || !this.isProcessing) {
				if (this.processingInterval) {
					clearInterval(this.processingInterval);
					this.processingInterval = null;
					debug('Processing stopped due to missing analyser or processing flag');
				}
				return;
			}

			// Get time-domain data for feature extraction
			const timeData = new Float32Array(this.analyser.frequencyBinCount);
			this.analyser.getFloatTimeDomainData(timeData);

			// Calculate RMS level for debug
			const rms = Math.sqrt(timeData.reduce((sum, val) => sum + val * val, 0) / timeData.length);
			if (rms > 0.01) {
				// Only log when there's significant audio
				debug('Processing audio frame, RMS level:', (rms * 100).toFixed(2));
			}

			// Process the audio buffer to identify the speaker
			this.speakerIdentifier.processAudioBuffer(timeData);
		}, 100); // Process every 100ms
		debug('Audio processing interval set to 100ms');
	}

	updateSpeakers(speakers: Speaker[]): void {
		debug('Updating speakers:', speakers.length);
		this.speakers = speakers;
		this.speakerIdentifier.updateSpeakers(speakers);
	}
}
