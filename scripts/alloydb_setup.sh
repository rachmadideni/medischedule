#!/bin/bash

# AlloyDB Setup Script for MediSchedule AI
# Usage: ./scripts/alloydb_setup.sh <PROJECT_ID> <REGION> <PASSWORD> <CLUSTER_ID> <INSTANCE_ID>
# Example: ./scripts/alloydb_setup.sh my-gcp-project us-central1 MyStr0ngP@ss medischedule-cluster medischedule-instance

PROJECT_ID=$1
REGION=$2
PASSWORD=$3
CLUSTER_ID=$4
INSTANCE_ID=$5
VPC_NAME="medischedule-vpc"
SUBNET_NAME="medischedule-subnet"
PSA_RANGE_NAME="medischedule-psa-range"

if [ -z "$PROJECT_ID" ] || [ -z "$REGION" ] || [ -z "$PASSWORD" ] || [ -z "$CLUSTER_ID" ] || [ -z "$INSTANCE_ID" ]; then
    echo "Usage: ./scripts/alloydb_setup.sh <PROJECT_ID> <REGION> <PASSWORD> <CLUSTER_ID> <INSTANCE_ID>"
    echo "Example: ./scripts/alloydb_setup.sh my-gcp-project us-central1 MyStr0ngP@ss medischedule-cluster medischedule-instance"
    exit 1
fi

echo "Starting MediSchedule AI infrastructure deployment..."
echo "  Project:  $PROJECT_ID"
echo "  Region:   $REGION"
echo "  Cluster:  $CLUSTER_ID"
echo "  Instance: $INSTANCE_ID"
echo ""

# ==========================================
# 1. AUTHENTICATION & PROJECT CHECK
# ==========================================
echo "Checking environment and authentication..."

if [ -n "$CLOUD_SHELL" ]; then
    echo "Running in Cloud Shell."
else
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    if [ -z "$ACTIVE_ACCOUNT" ]; then
        echo "No active account found. Initiating login..."
        gcloud auth login
    fi
fi

echo "Setting project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID" --quiet

echo "Verifying permissions on project $PROJECT_ID..."
if ! gcloud projects describe $PROJECT_ID > /dev/null 2>&1; then
    echo ""
    echo "################################################################"
    echo "ERROR: AUTHENTICATION FAILURE"
    echo "Your gcloud session is not active or lacks access to $PROJECT_ID."
    echo ""
    echo "PLEASE RUN: gcloud auth login"
    echo "################################################################"
    exit 1
fi

echo "Authentication verified."

# ==========================================
# 2. ENABLE APIs
# ==========================================
echo "Enabling required APIs..."
gcloud services enable \
    alloydb.googleapis.com \
    servicenetworking.googleapis.com \
    compute.googleapis.com \
    cloudresourcemanager.googleapis.com \
    aiplatform.googleapis.com \
    run.googleapis.com

sleep 15

# ==========================================
# 3. NETWORK SETUP
# ==========================================
echo "Setting up VPC network..."

if ! gcloud compute networks describe $VPC_NAME --global > /dev/null 2>&1; then
    echo "Creating VPC $VPC_NAME..."
    gcloud compute networks create $VPC_NAME --subnet-mode=custom --bgp-routing-mode=global
else
    echo "VPC $VPC_NAME already exists. Skipping."
fi

if ! gcloud compute networks subnets describe $SUBNET_NAME --region=$REGION > /dev/null 2>&1; then
    echo "Creating Subnet $SUBNET_NAME..."
    gcloud compute networks subnets create $SUBNET_NAME \
        --region=$REGION \
        --network=$VPC_NAME \
        --range="10.0.0.0/24" \
        --enable-private-ip-google-access
else
    echo "Subnet $SUBNET_NAME already exists. Skipping."
fi

# ==========================================
# 4. PRIVATE SERVICES ACCESS
# ==========================================
echo "Configuring Private Services Access..."

if ! gcloud compute addresses describe $PSA_RANGE_NAME --global > /dev/null 2>&1; then
    echo "Creating Private Services Access Range..."
    gcloud compute addresses create $PSA_RANGE_NAME \
        --global \
        --purpose=VPC_PEERING \
        --prefix-length=16 \
        --network=$VPC_NAME
fi

echo "Ensuring VPC Peering is connected..."
if ! gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --ranges=$PSA_RANGE_NAME \
    --network=$VPC_NAME --quiet 2>/dev/null; then

    echo "Connection already exists or failed, attempting update..."
    gcloud services vpc-peerings update \
        --service=servicenetworking.googleapis.com \
        --ranges=$PSA_RANGE_NAME \
        --network=$VPC_NAME --quiet
fi

echo "Waiting for Peering to stabilize..."
sleep 10

# ==========================================
# 5. CREATE ALLOYDB CLUSTER
# ==========================================
if ! gcloud alloydb clusters describe $CLUSTER_ID --region=$REGION > /dev/null 2>&1; then
    echo "Creating AlloyDB Cluster $CLUSTER_ID..."
    if ! gcloud alloydb clusters create $CLUSTER_ID \
        --region=$REGION \
        --network=$VPC_NAME \
        --password=$PASSWORD; then
        echo "ERROR: Failed to create AlloyDB Cluster."
        exit 1
    fi
else
    echo "AlloyDB Cluster $CLUSTER_ID already exists. Skipping."
fi

sleep 10

# ==========================================
# 6. CREATE ALLOYDB INSTANCE
# ==========================================
if ! gcloud alloydb instances describe $INSTANCE_ID --cluster=$CLUSTER_ID --region=$REGION > /dev/null 2>&1; then
    echo "Creating AlloyDB Instance $INSTANCE_ID..."
    if ! gcloud alloydb instances create $INSTANCE_ID \
        --cluster=$CLUSTER_ID \
        --region=$REGION \
        --cpu-count=2 \
        --instance-type=PRIMARY; then
        echo "ERROR: Failed to create AlloyDB Instance."
        exit 1
    fi
else
    echo "AlloyDB Instance $INSTANCE_ID already exists. Skipping."
fi

# ==========================================
# 7. OUTPUT CONNECTION INFO
# ==========================================
echo ""
echo "============================================"
echo "Deployment Complete!"
echo "============================================"
echo ""
echo "Get your AlloyDB IP with:"
echo "  gcloud alloydb instances describe $INSTANCE_ID \\"
echo "    --cluster=$CLUSTER_ID --region=$REGION \\"
echo "    --format='value(ipAddress)'"
echo ""
echo "Update your .env file with:"
echo "  ALLOYDB_HOST=<ip from above>"
echo "  ALLOYDB_PORT=5432"
echo "  ALLOYDB_USER=postgres"
echo "  ALLOYDB_PASSWORD=$PASSWORD"
echo "  ALLOYDB_DATABASE=medischedule"
echo ""
echo "Then run the schema:"
echo "  psql -h <ip> -U postgres -d medischedule -f sql/schema.sql"
echo "  psql -h <ip> -U postgres -d medischedule -f sql/seed.sql"
echo "============================================"
