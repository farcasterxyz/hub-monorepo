#!/bin/bash

# The Hubble installation script. This script is used to install the latest version of Hubble.
# It can also be used to upgrade an existing installation of Hubble, also upgrading
# itself in the process.

# Define the version of this script
CURRENT_VERSION="1"

REPO="adityapk00/hub"
API_BASE="https://api.github.com/repos/$REPO"
LATEST_TAG="@latest"

DOCKER_COMPOSE_FILE_PATH="apps/hubble/docker-compose.yml"
SCRIPT_FILE_PATH="scripts/hubble.sh"
GRAFANA_DASHBOARD_JSON_PATH="scripts/grafana-dashboard.json"

install_jq() {
    if command -v jq >/dev/null 2>&1; then
        echo "✅ Dependencies are installed."
        return 0
    fi

    echo "Installing jq..."

    # macOS
    if [[ "$(uname)" == "Darwin" ]]; then
        if command -v brew >/dev/null 2>&1; then
            brew install jq
        else
            echo "Homebrew is not installed. Please install Homebrew first."
            return 1
        fi

    # Ubuntu/Debian
    elif [[ -f /etc/lsb-release ]] || [[ -f /etc/debian_version ]]; then
        sudo apt-get update
        sudo apt-get install -y jq

    # RHEL/CentOS
    elif [[ -f /etc/redhat-release ]]; then
        sudo yum install -y jq

    # Fedora
    elif [[ -f /etc/fedora-release ]]; then
        sudo dnf install -y jq

    # openSUSE
    elif [[ -f /etc/os-release ]] && grep -q "ID=openSUSE" /etc/os-release; then
        sudo zypper install -y jq

    # Arch Linux
    elif [[ -f /etc/arch-release ]]; then
        sudo pacman -S jq

    else
        echo "Unsupported operating system. Please install jq manually."
        return 1
    fi

    echo "✅ jq installed successfully."
}

# Fetch the commit SHA associated with the @latest tag
fetch_latest_commit_sha() {
    local sha response

    response=$(curl -sS "$API_BASE/git/refs/tags/$LATEST_TAG")

    # Check for rate limit
    if echo "$response" | jq -e 'if (.message? // empty) | contains("API rate limit exceeded") then true else false end' >/dev/null; then
        echo "$response"
        echo "❌ Github Rate Limit Exceeded. Please wait an hour and try again."
        exit 1
    fi

    # Extract sha from the response
    sha=$(echo "$response" | jq -r '.object.sha')

    if [ -z "$sha" ]; then
        echo "No @latest tag found. $sha"
        exit 1
    fi

    echo "$sha"
}

# Fetch file from repo at a given commit SHA
fetch_file_from_repo_at_sha() {
    local file_path="$1"
    local local_filename="$2"
    local commit_sha="$3"

    local latest_file_content download_url

    latest_file_content=$(curl -sS "$API_BASE/contents/$file_path?ref=$commit_sha")
    download_url=$(echo "$latest_file_content" | jq -r '.download_url')

    if [ -z "$download_url" ]; then
        echo "Failed to fetch $local_filename."
        exit 1
    fi

    # Download the file
    curl -sS -o "$local_filename" "$download_url"
}

# Upgrade the script
self_upgrade() {
    local latest_commit_sha
    latest_commit_sha=$(fetch_latest_commit_sha)
    if [ $? -ne 0 ]; then
        echo "Error in self_upgrade: Unable to fetch the latest commit SHA."
        echo "$latest_commit_sha"
        exit 1
    fi

    local tmp_file
    tmp_file=$(mktemp)
    fetch_file_from_repo_at_sha "$SCRIPT_FILE_PATH" "$tmp_file" "$latest_commit_sha"

    local latest_version
    latest_version=$(awk -F'="' '/^CURRENT_VERSION=/ { print $2 }' "$tmp_file" | tr -d '"')

    # Compare the versions
    if [[ "$latest_version" > "$CURRENT_VERSION" ]]; then
        echo "Newer version found ($latest_version). Upgrading..."
        mv "$tmp_file" "$0" # Overwrite the current script
        chmod +x "$0"       # Ensure the script remains executable
        echo "✅ Upgrade complete. Restarting with new version..."
        echo ""
        exec "$0" "$1" || echo "Exec failed with status: $?"

        # Exit the script because we already "exec"ed the script above
        exit 0
    else
        echo "✅ Latest Script Version: $CURRENT_VERSION."
        rm -f "$tmp_file"  # Clean up temporary file if no upgrade was needed
    fi
}

# Fetch the docker-compose.yml and grafana-dashboard.json files
fetch_latest_docker_compose_and_dashboard() {
    local latest_commit_sha
    latest_commit_sha=$(fetch_latest_commit_sha)
    if [ $? -ne 0 ]; then
        echo "Error in fetch_latest_docker_compose_and_dashboard: Unable to fetch the latest commit SHA."
        echo "$latest_commit_sha"
        exit 1
    fi

    fetch_file_from_repo_at_sha "$DOCKER_COMPOSE_FILE_PATH" "docker-compose.yml" "$latest_commit_sha"
    fetch_file_from_repo_at_sha "$GRAFANA_DASHBOARD_JSON_PATH" "grafana-dashboard.json" "$latest_commit_sha"
}

validate_and_store() {
    local rpc_name=$1
    local expected_chain_id=$2

    while true; do
        read -p "> Enter your $rpc_name Ethereum RPC URL: " RPC_URL
        RESPONSE=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' "$RPC_URL")

        # Convert both the response and expected chain ID to lowercase for comparison
        local lower_response=$(echo "$RESPONSE" | tr '[:upper:]' '[:lower:]')
        local lower_expected_chain_id=$(echo "$expected_chain_id" | tr '[:upper:]' '[:lower:]')


        if [[ $lower_response == *'"result":"'$lower_expected_chain_id'"'* ]]; then
            echo "$3=$RPC_URL" >> .env
            break
        else
            echo "!!! Invalid !!!"
            echo "$rpc_name Ethereum RPC URL or chainID is not $expected_chain_id. Please retry."
            echo "You can signup for a free account at Alchemy or Infura if you need an RPC provider"
            echo "Server returned \"$RESPONSE\""
        fi
    done
}

key_exists() {
    local key=$1
    grep -q "^$key=" .env
    return $?
}

write_env_file() {
    if [[ ! -f .env ]]; then
        touch .env
    fi

    if ! key_exists "FC_NETWORK_ID"; then
        echo "FC_NETWORK_ID=1" >> .env
    fi

    if ! key_exists "STATSD_METRICS_SERVER"; then
        echo "STATSD_METRICS_SERVER=statsd:8125" >> .env
    fi

    if ! key_exists "ETH_MAINNET_RPC_URL"; then
        validate_and_store "Ethereum Mainnet" "0x1" "ETH_MAINNET_RPC_URL"
    fi

    # After the mainnet migration, this should change to Optimism's mainnet RPC
    if ! key_exists "ETH_RPC_URL"; then
        validate_and_store "Ethereum Goerli Testnet" "0x5" "ETH_RPC_URL"
    fi

    echo "✅ .env file updated."
}

## Configure Grafana
setup_grafana() {
    local grafana_url="http://127.0.0.1:3000"
    local credentials="admin:admin"
    local response dashboard_uid

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

        # Handle if the datasource already exists
        if [[ "$response" == "409" ]]; then
             echo "✅ Datasource 'Graphite' exists."
            response="200"
        fi
    }

    delete_dashboard() {
        local dashboard_uid

        dashboard_uid=$(curl -s "$grafana_url/api/search?query=Hub Dashboard" -u "$credentials" | \
            jq -r '.[] | select(.title == "Hub Dashboard") | .uid')

        if [[ "$dashboard_uid" ]]; then
            curl -s -X "DELETE" "$grafana_url/api/dashboards/uid/$dashboard_uid" -u "$credentials"
        fi
    }

    # Step 1: Restart statsd and grafana if they are running, otherwise start them
    if docker compose ps statsd 2>&1 >/dev/null; then
        if docker compose ps statsd | grep -q "Up"; then
            docker compose restart statsd grafana
        else
            docker compose up -d statsd grafana
        fi
    else
        echo "❌ Docker is not running or there's another issue with Docker. Please start Docker manually."
        exit 1
    fi

    # Step 2: Wait for Grafana to be ready
    echo "Waiting for Grafana to be ready..."
    while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' $grafana_url/api/health)" != "200" ]]; do
        sleep 2;
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

    # Step 4: Delete the dashboard if it exists
    delete_dashboard

    # Step 5: Import the dashboard. The API takes a slighly different format than the JSON import
    # in the UI, so we need to convert the JSON file first.
    jq 'if .dashboard then . else {dashboard: ., folderId: 0, overwrite: true} end' "grafana-dashboard.json" > "grafana-dashboard.api.json"
    
    response=$(curl -s -X "POST" "$grafana_url/api/dashboards/db" \
        -u "$credentials" \
        -H "Content-Type: application/json" \
        --data-binary @grafana-dashboard.api.json)

    rm "grafana-dashboard.api.json"

    if echo "$response" | jq -e '.status == "success"' >/dev/null; then
        echo "✅ Dashboard is installed."
    else
        echo "Failed to install dashboard. Exiting."
        echo "$response"
        return 1
    fi
}

install_docker() {
    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        echo "✅ Docker is installed."
        return 0
    fi

    # Install using Docker's convenience script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh

    # Add current user to the docker group
    sudo usermod -aG docker $(whoami)

    echo "✅ Docker is installed"   
    return 0 
}

start_hubble() {
    # First, make sure to pull all the latest images in docker compose
    docker compose pull

    # Make directory for hubble data called ".hub" and ".rocks". Make sure to set
    # the permissions so that the current user owns the directory and it is writable
    # by everyone
    mkdir -p .hub .rocks
    chmod 777 .hub .rocks
    
   if [[ ! -f "./.hub/default_id.protobuf" ]]; then
        docker compose run hubble yarn identity create
        echo "✅ Created Peer Identity"
    else
        echo "✅ Peer Identity exists"
    fi

    # Stop the "hubble" service if it is already running
    docker compose stop hubble

    # Start the "hubble" service
    docker compose up -d hubble
}

reexec_as_root_if_needed() {
    # If on Linux and not running as root
    if [[ "$(uname)" == "Linux" ]] && [[ "$(id -u)" -ne 0 ]]; then
        exec sudo "$0" "$@"
    elif [[ "$(uname)" == "Darwin" ]]; then
        echo "✅ Running on macOS."
    fi
}

# Call the function at the beginning of your script
reexec_as_root_if_needed "$@"

# Check the command-line argument for 'upgrade'
if [ "$1" == "upgrade" ]; then    
    # Ensure the ~/hubble directory exists
    if [ ! -d ~/hubble ]; then
        mkdir -p ~/hubble || { echo "Failed to create ~/hubble directory."; exit 1; }
    fi

    # Ensure the script runs in the ~/hubble directory
    cd ~/hubble || { echo "Failed to switch to ~/hubble directory."; exit 1; }

    # Install dependencies
    install_jq

    # Upgrade this script itself
    self_upgrade "$@"

    # Call the function to install docker
    install_docker "$@"

    # Update the env file if needed
    write_env_file

    # Fetch the latest docker-compose.yml
    fetch_latest_docker_compose_and_dashboard

    # Setup the Grafana dashboard
    setup_grafana

    # Start the hubble service
    start_hubble

    echo "✅ Upgrade complete."    
    echo ""
    echo "Monitor your node at http://localhost:3000/"

    exit 0
fi

# Show logs of the hubble service
if [ "$1" == "logs" ]; then
    # Ensure the script runs in the ~/hubble directory
    cd ~/hubble || { echo "Failed to switch to ~/hubble directory."; exit 1; }

    docker compose logs -f hubble
    exit 0
fi

# If run without args, show a help
if [ $# -eq 0 ]; then
    echo "hubble.sh - Install or upgrade Hubble"
    echo "Usage: hubble.sh [command]"
    echo "  upgrade: Upgrade an existing installation of Hubble"
    echo "  logs: Show the logs of the Hubble service"
    echo "  help: Show this help"
    exit 0
fi
