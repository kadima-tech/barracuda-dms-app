import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SpeechClient } from '@google-cloud/speech';

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

    // Initialize the Speech client
    const speechClient = new SpeechClient();

    // Create request for Google Speech-to-Text API
    const recognitionRequest = {
      config: {
        encoding: config.encoding || 'LINEAR16',
        sampleRateHertz: config.sampleRateHertz || 16000,
        languageCode: config.languageCode || 'en-US',
        diarizationConfig: {
          enableSpeakerDiarization: true,
          minSpeakerCount: config.minSpeakerCount || 2,
          maxSpeakerCount: config.maxSpeakerCount || 2,
        },
      },
      audio: {
        content: audioData,
      },
    };

    // Make the API call
    console.log('Sending request to Google Speech-to-Text API...');
    const [response] = await speechClient.recognize(recognitionRequest);
    console.log('Received response from Google Speech-to-Text API');

    // Return the diarization results
    return json(response);
  } catch (error) {
    console.error('Error processing speech diarization request:', error);
    return json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
};
