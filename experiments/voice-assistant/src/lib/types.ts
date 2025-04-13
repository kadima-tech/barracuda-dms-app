// Define types for Speech Recognition
export interface SpeechRecognitionEvent extends Event {
	resultIndex: number;
	results: {
		[key: number]: {
			[key: number]: {
				transcript: string;
			};
		};
	};
}

export interface SpeechRecognitionErrorEvent extends Event {
	error: string;
}

export interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	start(): void;
	stop(): void;
	onstart: () => void;
	onend: () => void;
	onresult: (event: SpeechRecognitionEvent) => void;
	onerror: (event: SpeechRecognitionErrorEvent) => void;
}

// Declare global interfaces
declare global {
	interface Window {
		SpeechRecognition?: new () => SpeechRecognition;
		webkitSpeechRecognition?: new () => SpeechRecognition;
	}
}
