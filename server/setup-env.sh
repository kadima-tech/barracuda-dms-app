#!/bin/bash

# Set the project ID
PROJECT_ID="barracuda-dms-development"

# Create or overwrite .env file
echo "EXCHANGE_TENANT_ID=$(gcloud secrets versions access latest --secret=EXCHANGE_TENANT_ID --project=$PROJECT_ID)" > .env
echo "EXCHANGE_CLIENT_ID=$(gcloud secrets versions access latest --secret=EXCHANGE_CLIENT_ID --project=$PROJECT_ID)" >> .env
echo "EXCHANGE_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=EXCHANGE_CLIENT_SECRET --project=$PROJECT_ID)" >> .env
echo "SPOTIFY_CLIENT_ID=$(gcloud secrets versions access latest --secret=SPOTIFY_CLIENT_ID --project=$PROJECT_ID)" >> .env
echo "SPOTIFY_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=SPOTIFY_CLIENT_SECRET --project=$PROJECT_ID)" >> .env
echo "SPOTIFY_REDIRECT_URI=http://localhost:8085/spotify/callback" >> .env

echo "Environment variables have been set up in .env file" 