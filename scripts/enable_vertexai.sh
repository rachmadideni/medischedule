#!/bin/bash

# Enable Vertex AI for MediSchedule AI
# Run this in Google Cloud Shell: ./scripts/enable_vertexai.sh [REGION]
#
# This switches the app from using a Google AI Studio API key (GOOGLE_GENAI_API_KEY)
# to Vertex AI (GOOGLE_GENAI_USE_VERTEXAI=1), which uses IAM-based auth instead.
# Cloud Run's default service account already has sufficient permissions.

# Get Google Cloud Project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "Error: Could not determine Google Cloud Project ID."
    echo "Please run 'gcloud config set project <PROJECT_ID>' first."
    exit 1
fi

REGION="${1:-us-central1}"

echo "Found Project ID: $PROJECT_ID"
echo "Region: $REGION"

# Enable Vertex AI API
echo "Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com --project="$PROJECT_ID"

echo ""
echo "============================================"
echo "Vertex AI is enabled!"
echo "============================================"
echo ""
echo "Update your .env file — replace the API key line:"
echo ""
echo "  # Remove this:"
echo "  # GOOGLE_GENAI_API_KEY=your-gemini-api-key"
echo ""
echo "  # Add these:"
echo "  GOOGLE_GENAI_USE_VERTEXAI=1"
echo "  GOOGLE_CLOUD_PROJECT=$PROJECT_ID"
echo "  GOOGLE_CLOUD_LOCATION=$REGION"
echo ""
echo "============================================"
