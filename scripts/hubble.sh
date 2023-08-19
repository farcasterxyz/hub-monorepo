#!/bin/bash

# Define the version of this script
CURRENT_VERSION="1.0"

# URL where the latest version of the script is hosted
SCRIPT_URL="https://example.com/myscript.sh"

# Function to check and upgrade the script
self_upgrade() {
    echo "Checking for newer version..."

    # Fetch the latest version of the script
    TMP_FILE=$(mktemp)
    if curl -s -o "$TMP_FILE" "$SCRIPT_URL"; then
        # Extract the version from the fetched script
        LATEST_VERSION=$(grep -oP '^CURRENT_VERSION="\K[^"]+' "$TMP_FILE")

        # Compare the versions
        if [[ "$LATEST_VERSION" > "$CURRENT_VERSION" ]]; then
            echo "Newer version found ($LATEST_VERSION). Upgrading..."
            mv "$TMP_FILE" "$0" # Overwrite the current script
            chmod +x "$0"       # Ensure the script remains executable
            echo "Upgrade complete. Restarting with new version..."
            exec "$0" "$@"
        else
            echo "You have the latest version ($CURRENT_VERSION)."
        fi
    else
        echo "Failed to check for newer version. Please try again later."
    fi

    rm -f "$TMP_FILE"  # Clean up temporary file
}

# Check the command-line argument for 'self-upgrade'
if [ "$1" == "self-upgrade" ]; then
    self_upgrade
    exit 0
fi

# The rest of your script logic goes here
echo "Running script version $CURRENT_VERSION"

# Fetch the @latest docker-compose file
REPO="farcasterxyz/hub-monorepo"
FILE_PATH="apps/hubble/docker-compose.yml"
API_BASE="https://api.github.com/repos/$REPO"
LATEST_TAG="@latest"

fetch_latest_docker_compose() {
    # Fetch the commit SHA associated with the @latest tag
    LATEST_COMMIT_SHA=$(curl -s "$API_BASE/git/refs/tags/$LATEST_TAG" | grep sha | head -n 1 | cut -d '"' -f 4)

    # If there's no such tag, exit
    if [ -z "$LATEST_COMMIT_SHA" ]; then
        echo "No @latest tag found."
        exit 1
    fi

    # Fetch the docker-compose.yml file associated with the latest tag
    LATEST_FILE_CONTENT=$(curl -s "$API_BASE/contents/$FILE_PATH?ref=$LATEST_COMMIT_SHA")
    DOWNLOAD_URL=$(echo "$LATEST_FILE_CONTENT" | grep download_url | cut -d '"' -f 4)

    if [ -z "$DOWNLOAD_URL" ]; then
        echo "Failed to fetch the file."
        exit 1
    fi

    # Download the file
    curl -o docker-compose-latest.yml "$DOWNLOAD_URL"
    echo "Latest docker-compose.yml downloaded as docker-compose-latest.yml"
}

validate_and_store() {
    local rpc_name=$1
    local expected_chain_id=$2

    while true; do
        read -p "Enter your $rpc_name Ethereum RPC URL: " RPC_URL
        RESPONSE=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' $RPC_URL)

        # Convert both the response and expected chain ID to lowercase for comparison
        local lower_response=${RESPONSE,,}
        local lower_expected_chain_id=${expected_chain_id,,}

        if [[ $lower_response == *'"result":"'$lower_expected_chain_id'"'* ]]; then
            echo "$rpc_name RPC URL is valid and the chainID is $expected_chain_id."
            echo "$3=$RPC_URL" >> .env
            break
        else
            echo "Invalid $rpc_name Ethereum RPC URL or chainID is not $expected_chain_id. Please retry."
            echo "You can signup for a free account at Alchemy or Infura if you need an RPC provider"
        fi
    done
}

# Clear or create the .env file
> .script.env

echo "NETWORK=1" >> .env

# Validate and store Ethereum Mainnet (example chainID: 0x1)
validate_and_store "Ethereum Mainnet" "0x1" "ETH_MAINNET_RPC_URL"

# Validate and store Optimism (as per your instruction, example chainID: 0x5)
validate_and_store "Optimism Mainnet" "0xa" "ETH_RPC_URL"

## Configure Grafana
setup_grafana() {
    local grafana_url="http://127.0.0.1:3000"
    local credentials="admin:admin"
    local response

    add_datasource() {
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "POST" "$grafana_url/api/datasources" \
            -u "$credentials" \
            -H "Content-Type: application/json" \
            --data-binary '{
               "name":"Graphite",
               "type":"graphite",
               "url":"http://statsd:80",
               "access":"proxy"
            }')
    }

    # Step 1: Start statsd and grafana
    docker compose up -d statsd grafana

    # Step 2: Wait for Grafana to be ready
    echo "Waiting for Grafana to be ready..."
    while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' $grafana_url/api/health)" != "200" ]]; do 
        sleep 5; 
    done
    echo "Grafana is ready."

    # Step 3: Add Graphite as a data source using Grafana's API
    add_datasource

    # Check if the default credentials failed
    if [[ "$response" == "401" ]]; then
        echo "Please enter your Grafana credentials."
        read -p "Username: " username
        read -sp "Password: " password
        echo
        credentials="$username:$password"

        # Retry adding the data source with the new credentials
        add_datasource
        
        if [[ "$response" != "200" ]]; then
            echo "Failed to add data source with provided credentials. Exiting."
            return 1
        fi
    fi

    # Step 4: Import the dashboard. Assuming the dashboard JSON is in a file named "dashboard.json"
    curl -X "POST" "$grafana_url/api/dashboards/db" \
         -u "$credentials" \
         -H "Content-Type: application/json" \
         --data-binary @grafana-dashboard.json
}

setup_grafana
