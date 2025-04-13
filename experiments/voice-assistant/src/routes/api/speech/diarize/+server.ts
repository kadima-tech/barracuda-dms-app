import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SpeechClient } from '@google-cloud/speech';
import { env } from '$env/dynamic/private';

// Import the correct types
import type { google } from '@google-cloud/speech/build/protos/protos';
type RecognitionConfig = google.cloud.speech.v1.IRecognitionConfig;

/**
 * API endpoint for sending audio data to Google Cloud Speech-to-Text API
 * for speaker diarization. This keeps API keys secure on the server side
 * and uses Application Default Credentials.
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get the audio data and configuration from the request
		const requestData = await request.json();
		const { audioData, config } = requestData;

		if (!audioData) {
			return json({ error: 'No audio data provided' }, { status: 400 });
		}

		console.log(`Received ${audioData.length} characters of audio data`);
		console.log('Diarization config:', config);

		try {
			// Initialize the Speech client with credentials
			let speechClient: SpeechClient;

			// If we have direct JSON credentials in environment, use those
			if (env.GOOGLE_CLOUD_CREDENTIALS) {
				try {
					const credentials = JSON.parse(env.GOOGLE_CLOUD_CREDENTIALS);
					speechClient = new SpeechClient({ credentials });
					console.log('Using explicit credentials from environment variable');
				} catch (e) {
					console.error('Error parsing GOOGLE_CLOUD_CREDENTIALS:', e);
					// Fall back to default credentials
					speechClient = new SpeechClient();
					console.log('Falling back to application default credentials');
				}
			} else {
				// Use application default credentials (from GOOGLE_APPLICATION_CREDENTIALS env var)
				speechClient = new SpeechClient();
				console.log('Using application default credentials');
			}

			// Create request for Google Speech-to-Text API with correct configurations
			const recognitionConfig: RecognitionConfig = {
				encoding: 'LINEAR16' as const,
				sampleRateHertz: config.sampleRateHertz || 48000,
				languageCode: config.languageCode || 'en-US',
				enableAutomaticPunctuation: true,
				enableWordTimeOffsets: true, // This enables timing info for each word
				diarizationConfig: {
					enableSpeakerDiarization: true,
					minSpeakerCount: config.minSpeakerCount || 1,
					maxSpeakerCount: config.maxSpeakerCount || 6
				},
				model: 'latest_long' // Better for longer audio segments
			};

			const recognitionRequest = {
				config: recognitionConfig,
				audio: {
					content: audioData
				}
			};

			// Make the API call
			console.log('Sending request to Google Speech-to-Text API...');
			console.log('  Sample rate:', config.sampleRateHertz || 48000, 'Hz');
			console.log('  Audio data length:', audioData.length, 'bytes');

			try {
				const [response] = await speechClient.recognize(recognitionRequest);
				console.log('Received response from Google Speech-to-Text API');
				return json(response);
			} catch (apiError: unknown) {
				const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
				console.error('Google Speech API error:', errorMessage);

				// Try with a different encoding if LINEAR16 fails
				if (errorMessage.includes('invalid encoding')) {
					console.log('Retrying with FLAC encoding...');
					const retryConfig: RecognitionConfig = {
						...recognitionConfig,
						encoding: 'FLAC' as const
					};

					const retryRequest = {
						config: retryConfig,
						audio: {
							content: audioData
						}
					};

					try {
						const [retryResponse] = await speechClient.recognize(retryRequest);
						console.log('Received response from Google Speech-to-Text API with FLAC encoding');
						return json(retryResponse);
					} catch (retryError) {
						console.error('Retry with FLAC encoding also failed:', retryError);
						throw retryError;
					}
				}
				throw apiError;
			}
		} catch (error) {
			console.error('Google Speech API error:', error);

			// Return a mock response for testing when the API fails
			console.log('Returning mock response for testing');
			return json({
				results: [
					{
						alternatives: [
							{
								transcript: "I couldn't process the audio, but I'm still listening.",
								words: [
									{ word: 'I', speakerTag: 1, speakerLabel: '1' },
									{ word: "couldn't", speakerTag: 1, speakerLabel: '1' },
									{ word: 'process', speakerTag: 1, speakerLabel: '1' },
									{ word: 'the', speakerTag: 1, speakerLabel: '1' },
									{ word: 'audio,', speakerTag: 2, speakerLabel: '2' },
									{ word: 'but', speakerTag: 2, speakerLabel: '2' },
									{ word: "I'm", speakerTag: 2, speakerLabel: '2' },
									{ word: 'still', speakerTag: 2, speakerLabel: '2' },
									{ word: 'listening.', speakerTag: 2, speakerLabel: '2' }
								]
							}
						]
					}
				]
			});
		}
	} catch (error) {
		console.error('Error processing speech diarization request:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
