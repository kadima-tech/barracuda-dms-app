import { writable, derived, get } from 'svelte/store';
import type { Speaker, VoiceProfile } from '../types';

// Initial state
const initialState: {
	speakers: Speaker[];
	activeSpeakerId: string | null;
	currentlySpeakingSpeakerId: string | null;
	showAddSpeaker: boolean;
	newSpeakerName: string;
} = {
	speakers: [],
	activeSpeakerId: null,
	currentlySpeakingSpeakerId: null,
	showAddSpeaker: false,
	newSpeakerName: ''
};

// Avatar colors
const avatarColors = [
	'bg-blue-100 text-blue-600',
	'bg-green-100 text-green-600',
	'bg-purple-100 text-purple-600',
	'bg-amber-100 text-amber-600',
	'bg-pink-100 text-pink-600',
	'bg-cyan-100 text-cyan-600'
];

// Create the store
const createSpeakerStore = () => {
	const { subscribe, set, update } = writable(initialState);

	// Load speakers from localStorage
	const loadSpeakers = () => {
		if (typeof window !== 'undefined') {
			const savedSpeakers = localStorage.getItem('voice-assistant-speakers');
			if (savedSpeakers) {
				try {
					update((state) => ({
						...state,
						speakers: JSON.parse(savedSpeakers)
					}));
				} catch (e) {
					console.error('Failed to parse saved speakers', e);
				}
			}
		}
	};

	// Save speakers to localStorage
	const saveSpeakers = () => {
		if (typeof window !== 'undefined') {
			const state = get({ subscribe });
			localStorage.setItem('voice-assistant-speakers', JSON.stringify(state.speakers));
		}
	};

	// Add a new speaker
	const addSpeaker = (name: string) => {
		if (!name.trim()) return;

		update((state) => {
			const colorIndex = state.speakers.length % avatarColors.length;
			const newSpeaker = {
				id: crypto.randomUUID(),
				name: name.trim(),
				color: avatarColors[colorIndex],
				isActive: false
			};

			const updatedState = {
				...state,
				speakers: [...state.speakers, newSpeaker],
				newSpeakerName: '',
				showAddSpeaker: false
			};

			// Save to localStorage
			setTimeout(saveSpeakers, 0);

			return updatedState;
		});
	};

	// Update speaker name
	const updateSpeakerName = (id: string, name: string) => {
		if (!name.trim()) return;

		update((state) => {
			const updatedState = {
				...state,
				speakers: state.speakers.map((speaker) =>
					speaker.id === id ? { ...speaker, name: name.trim() } : speaker
				)
			};

			// Save to localStorage
			setTimeout(saveSpeakers, 0);

			return updatedState;
		});
	};

	// Update speaker's voice profile
	const updateSpeakerVoiceProfile = (id: string, voiceProfile: Partial<VoiceProfile>) => {
		update((state) => {
			const updatedState = {
				...state,
				speakers: state.speakers.map((s) =>
					s.id === id
						? {
								...s,
								voiceProfile: {
									...(s.voiceProfile || {}),
									...voiceProfile
								}
							}
						: s
				)
			};

			// Save to localStorage
			setTimeout(saveSpeakers, 0);

			return updatedState;
		});
	};

	// Remove a speaker
	const removeSpeaker = (id: string) => {
		update((state) => {
			let activeSpeakerId = state.activeSpeakerId;
			if (activeSpeakerId === id) {
				activeSpeakerId = null;
			}

			const updatedState = {
				...state,
				speakers: state.speakers.filter((speaker) => speaker.id !== id),
				activeSpeakerId
			};

			// Save to localStorage
			setTimeout(saveSpeakers, 0);

			return updatedState;
		});
	};

	// Set active speaker
	const setActiveSpeaker = (id: string | null) => {
		update((state) => {
			// Only update isActive if the speaker is currently speaking
			// or if we're resetting the active speaker (id is null)
			let updatedSpeakers = state.speakers;
			if (id === null || id === state.currentlySpeakingSpeakerId) {
				updatedSpeakers = state.speakers.map((speaker) => ({
					...speaker,
					isActive: speaker.id === id
				}));
			}

			return {
				...state,
				activeSpeakerId: id,
				speakers: updatedSpeakers
			};
		});
	};

	// Set currently speaking speaker
	const setCurrentlySpeaking = (id: string | null) => {
		update((state) => ({
			...state,
			currentlySpeakingSpeakerId: id,
			speakers: state.speakers.map((speaker) => ({
				...speaker,
				isActive: speaker.id === id
			}))
		}));
	};

	// Toggle add speaker form
	const toggleAddSpeaker = () => {
		update((state) => ({
			...state,
			showAddSpeaker: !state.showAddSpeaker
		}));
	};

	// Set new speaker name (for the input field)
	const setNewSpeakerName = (name: string) => {
		update((state) => ({
			...state,
			newSpeakerName: name
		}));
	};

	// Get speaker by ID
	const getSpeaker = (id: string): Speaker | undefined => {
		const state = get({ subscribe });
		return state.speakers.find((speaker) => speaker.id === id);
	};

	// Utility for creating an auto-detected speaker
	const createAutoDetectedSpeaker = (voiceProfile: number[]) => {
		let speakerId: string;

		update((state) => {
			const autoSpeakerNumber =
				state.speakers.filter((s) => s.name.startsWith('Speaker ')).length + 1;
			const colorIndex = state.speakers.length % avatarColors.length;
			const newSpeaker = {
				id: crypto.randomUUID(),
				name: `Speaker ${autoSpeakerNumber}`,
				color: avatarColors[colorIndex],
				isActive: true,
				voiceProfile: {
					features: voiceProfile
				}
			};

			speakerId = newSpeaker.id;

			const updatedState = {
				...state,
				speakers: [...state.speakers, newSpeaker]
			};

			// Save to localStorage
			setTimeout(saveSpeakers, 0);

			return updatedState;
		});

		return speakerId!;
	};

	const hasSpeaker = (voiceProfile: number[]) => {
		const state = get({ subscribe });
		return state.speakers.some((speaker) =>
			speaker.voiceProfile?.features?.every(
				(feature, index) => Math.abs(feature - voiceProfile[index]) < 0.01
			)
		);
	};

	const getSpeakers = () => {
		const state = get({ subscribe });
		return state.speakers;
	};

	return {
		subscribe,
		loadSpeakers,
		saveSpeakers,
		addSpeaker,
		updateSpeakerName,
		updateSpeakerVoiceProfile,
		removeSpeaker,
		setActiveSpeaker,
		getSpeakers,
		hasSpeaker,
		setCurrentlySpeaking,
		toggleAddSpeaker,
		setNewSpeakerName,
		getSpeaker,
		createAutoDetectedSpeaker,
		reset: () => set(initialState)
	};
};

// Create and export the store
export const speakerStore = createSpeakerStore();

// Derived stores for individual values
export const speakers = derived(speakerStore, ($store) => $store.speakers);
export const activeSpeakerId = derived(speakerStore, ($store) => $store.activeSpeakerId);
export const currentlySpeakingSpeakerId = derived(
	speakerStore,
	($store) => $store.currentlySpeakingSpeakerId
);
export const showAddSpeaker = derived(speakerStore, ($store) => $store.showAddSpeaker);
export const newSpeakerName = derived(speakerStore, ($store) => $store.newSpeakerName);
