import type { Speaker } from './types';

// Constants for speaker detection
const SILENCE_THRESHOLD = 15;
const VOICE_SAMPLES = 10;
const SIMILARITY_THRESHOLD = 0.9;

export class SpeakerDetector {
	audioContext: AudioContext | null = null;
	analyser: AnalyserNode | null = null;
	microphone: MediaStreamAudioSourceNode | null = null;
	stream: MediaStream | null = null;
	dataArray: Uint8Array = new Uint8Array();
	voiceCharacteristics: number[][] = [];
	isCollecting: boolean = false;
	speakers: Speaker[] = [];
	activeSpeakerId: string | null = null;
	onSpeakerDetected: (speakerId: string) => void;
	onNewSpeakerDetected: (voiceProfile: number[]) => void;
	private debugMode: boolean = true;

	constructor(
		speakers: Speaker[],
		onSpeakerDetected: (speakerId: string) => void,
		onNewSpeakerDetected: (voiceProfile: number[]) => void
	) {
		this.speakers = speakers;
		this.onSpeakerDetected = onSpeakerDetected;
		this.onNewSpeakerDetected = onNewSpeakerDetected;
		this.debug('BasicDetector: Initialized with', speakers.length, 'speakers');
	}

	private debug(...args: unknown[]): void {
		if (this.debugMode) {
			console.log('[BasicDetector]', ...args);
		}
	}

	async initializeAudio(): Promise<boolean> {
		this.debug('Initializing audio...');
		try {
			this.audioContext = new (window.AudioContext ||
				(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
			this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			this.microphone = this.audioContext.createMediaStreamSource(this.stream);
			this.analyser = this.audioContext.createAnalyser();
			this.analyser.fftSize = 1024;
			this.microphone.connect(this.analyser);
			this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
			this.debug('Audio initialized successfully');
			return true;
		} catch (error) {
			console.error('Error initializing audio:', error);
			return false;
		}
	}

	async startDetection(): Promise<boolean> {
		this.debug('Starting detection...');
		if (!this.audioContext) {
			this.debug('AudioContext not initialized, initializing now');
			const success = await this.initializeAudio();
			if (!success) {
				this.debug('Failed to initialize audio');
				return false;
			}
		}

		this.processAudio();
		this.debug('Detection started');
		return true;
	}

	stopDetection(): void {
		this.debug('Stopping detection...');
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
		}
		this.stream = null;
		this.microphone = null;
		this.analyser = null;
		if (this.audioContext) {
			if (this.audioContext.state !== 'closed') {
				this.audioContext.close();
			}
			this.audioContext = null;
		}
		this.debug('Detection stopped');
	}

	processAudio(): void {
		if (!this.analyser) return;

		this.analyser.getByteFrequencyData(this.dataArray);
		const average = this.getAverageVolume(this.dataArray);

		// Only collect voice characteristics when volume is above threshold (speaking)
		if (average > SILENCE_THRESHOLD) {
			this.debug('Voice detected, average volume:', average.toFixed(2));
			this.collectVoiceCharacteristics();

			if (this.voiceCharacteristics.length >= VOICE_SAMPLES) {
				this.debug('Collected enough samples, processing identification');
				this.processSpeakerIdentification();
				this.voiceCharacteristics = []; // Reset after processing
			}
		}

		if (this.audioContext) {
			requestAnimationFrame(() => this.processAudio());
		}
	}

	getAverageVolume(array: Uint8Array): number {
		let values = 0;
		const length = array.length;
		for (let i = 0; i < length; i++) {
			values += array[i];
		}
		return values / length;
	}

	collectVoiceCharacteristics(): void {
		if (!this.analyser) return;

		const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
		this.analyser.getByteFrequencyData(frequencyData);

		// Create a simplified profile from the frequency data (sampling key points)
		const profile: number[] = [];
		const step = Math.floor(frequencyData.length / 20); // Sample 20 points from the frequency range

		for (let i = 0; i < frequencyData.length; i += step) {
			profile.push(frequencyData[i]);
		}

		this.voiceCharacteristics.push(profile);
		this.debug('Collected voice sample', this.voiceCharacteristics.length, 'of', VOICE_SAMPLES);
	}

	processSpeakerIdentification(): void {
		// Calculate the average voice profile from collected samples
		this.debug(
			'Processing speaker identification with',
			this.voiceCharacteristics.length,
			'samples'
		);
		const currentVoiceProfile = this.calculateAverageProfile(this.voiceCharacteristics);

		// Find the closest matching speaker
		let bestMatchId: string | null = null;
		let highestSimilarity = 0;

		for (const speaker of this.speakers) {
			if (speaker.voiceProfile && speaker.voiceProfile.features) {
				const similarity = this.calculateSimilarity(
					currentVoiceProfile,
					speaker.voiceProfile.features
				);
				this.debug('Speaker', speaker.name, 'similarity:', similarity.toFixed(4));
				if (similarity > highestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
					highestSimilarity = similarity;
					bestMatchId = speaker.id;
				}
			}
		}

		// If found a matching speaker
		if (bestMatchId) {
			const matchedSpeaker = this.speakers.find((s) => s.id === bestMatchId);
			this.debug(
				'Matched speaker:',
				matchedSpeaker?.name,
				'with confidence:',
				highestSimilarity.toFixed(4)
			);

			if (this.activeSpeakerId !== bestMatchId) {
				this.activeSpeakerId = bestMatchId;
				this.onSpeakerDetected(bestMatchId);
			}
		} else {
			// No matching speaker found, create a new one
			this.debug('No matching speaker found, suggesting new speaker creation');
			this.onNewSpeakerDetected(currentVoiceProfile);
		}
	}

	calculateAverageProfile(profiles: number[][]): number[] {
		if (profiles.length === 0) return [];

		const length = profiles[0].length;
		const result = new Array(length).fill(0);

		// Sum all profiles
		for (const profile of profiles) {
			for (let i = 0; i < length; i++) {
				result[i] += profile[i];
			}
		}

		// Calculate average
		for (let i = 0; i < length; i++) {
			result[i] = result[i] / profiles.length;
		}

		return result;
	}

	calculateSimilarity(profile1: number[], profile2: number[]): number {
		if (profile1.length !== profile2.length) return 0;

		// Using cosine similarity
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

		if (magnitude1 === 0 || magnitude2 === 0) return 0;

		return dotProduct / (magnitude1 * magnitude2);
	}
}
