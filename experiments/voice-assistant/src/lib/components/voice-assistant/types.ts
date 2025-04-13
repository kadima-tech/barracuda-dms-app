// Speech recognition types from SpeechRecognition API
export interface SpeechRecognition {
	continuous: boolean;
	interimResults: boolean;
	onstart: () => void;
	onresult: (event: SpeechRecognitionEvent) => void;
	onend: () => void;
	onerror: (event: SpeechRecognitionErrorEvent) => void;
	start: () => void;
	stop: () => void;
}

export interface SpeechRecognitionEvent {
	resultIndex: number;
	results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent {
	error: string;
	message?: string;
}

// Speaker detection algorithm interfaces
export interface SpeakerDetectionAlgorithm {
	initialize: () => Promise<boolean>;
	detect: (audioData: Uint8Array) => Promise<SpeakerDetectionResult>;
	train: (speakerId: string, audioData: Uint8Array[]) => Promise<number[]>;
	calculateSimilarity: (profile1: number[], profile2: number[]) => number;
}

export interface SpeakerDetectionResult {
	speakerId: string | null;
	confidence: number;
	isNewSpeaker: boolean;
	voiceProfile?: VoiceProfile;
}

export interface SpeakerDetectionOptions {
	silenceThreshold?: number;
	sampleCount?: number;
	similarityThreshold?: number;
	featureExtractor?: FeatureExtractor;
}

export interface FeatureExtractor {
	extract: (audioData: Uint8Array) => number[];
}

// Voice profile for speaker identification
export interface VoiceProfile {
	features?: number[]; // Voice characteristics for traditional speaker identification
	googleSpeakerId?: number; // Speaker tag from Google's diarization API
}

// Speaker model type
export interface Speaker {
	id: string;
	name: string;
	color: string;
	isActive: boolean;
	voiceProfile?: VoiceProfile;
}

// Google Speech API diarization interfaces
export interface GoogleDiarizationConfig {
	enableSpeakerDiarization: boolean;
	minSpeakerCount?: number;
	maxSpeakerCount?: number;
}

export interface GoogleSpeechRecognitionConfig {
	encoding: string;
	sampleRateHertz: number;
	languageCode: string;
	diarizationConfig?: GoogleDiarizationConfig;
	model?: string;
}

export interface GoogleSpeechRecognitionAudio {
	content?: string; // base64-encoded audio
	uri?: string; // Google Cloud Storage URI
}

export interface GoogleSpeechWord {
	word: string;
	speakerTag: number;
	startTime?: string;
	endTime?: string;
}

// Message types
export interface Message {
	text: string;
	speakerId?: string;
	timestamp: string;
}

// Event handlers
export interface SpeakerEventHandlers {
	onAddSpeaker: (name: string) => void;
	onUpdateSpeaker: (id: string, updates: Partial<Speaker>) => void;
	onRemoveSpeaker: (id: string) => void;
	onSetActiveSpeaker: (id: string | null) => void;
}

export interface MessageEventHandlers {
	onAddMessage: (text: string, speakerId?: string) => void;
	onClearMessages: () => void;
}

export interface VoiceControlEventHandlers {
	onToggleListening: () => void;
	onToggleSpeakerDetection: () => void;
}

// Web Speech API types
export interface SpeechRecognitionResultList {
	[index: number]: SpeechRecognitionResult;
	length: number;
}

export interface SpeechRecognitionResult {
	[index: number]: SpeechRecognitionAlternative;
	isFinal: boolean;
	length: number;
}

export interface SpeechRecognitionAlternative {
	transcript: string;
	confidence: number;
}

export interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start: () => void;
	stop: () => void;
	abort: () => void;
	onresult: (event: SpeechRecognitionEvent) => void;
	onerror: (event: SpeechRecognitionErrorEvent) => void;
	onend: () => void;
	onstart: () => void;
}
