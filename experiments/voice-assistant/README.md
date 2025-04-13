# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

# Voice Assistant

A voice assistant application built with SvelteKit that features real-time speech recognition and speaker detection.

## Features

- Real-time speech recognition
- Speaker diarization (identifying different speakers)
- Multiple speaker detection algorithms
- Customizable voice profiles
- Message history and transcript display

## Setup

1. Install dependencies

```bash
pnpm install
```

2. Set up Google Cloud Speech API

The application uses Google Cloud Speech-to-Text API for advanced speaker diarization. To set this up:

- Create a Google Cloud project at https://console.cloud.google.com/
- Enable the Speech-to-Text API: https://console.cloud.google.com/apis/library/speech.googleapis.com
- Create a service account: https://console.cloud.google.com/iam-admin/serviceaccounts
- Download the service account key as JSON
- Create a `.env` file in the project root by copying `.env.example`
- Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your service account key

```
GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account-key.json"
```

## Development

```bash
pnpm dev
```

## Building

```bash
pnpm build
```

## Preview production build

```bash
pnpm preview
```

## Implementation Details

This application uses multiple speaker detection algorithms:

1. **Basic**: Simple amplitude-based detection
2. **Enhanced**: MFCC features for improved accuracy
3. **Advanced**: Uses voice embeddings for more accurate identification
4. **Google**: Integration with Google Cloud Speech-to-Text API for professional quality diarization

The Google implementation is recommended for production use as it provides the most accurate speaker identification.
