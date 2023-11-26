#!/bin/bash

# The Replicator installation script. This script is used to install the latest version of the Replicator.
# It can also be used to upgrade an existing installation of the Replicator, also upgrading
# itself in the process.

# Define the version of this script
CURRENT_VERSION="1"

REPO="farcasterxyz/hub-monorepo"
RAWFILE_BASE="https://raw.githubusercontent.com/$REPO"
LATEST_TAG="@latest-replicator"

DOCKER_COMPOSE_FILE_PATH="apps/replicator/docker-compose.yml"
SCRIPT_FILE_PATH="scripts/replicator.sh"
GRAFANA_DASHBOARD_JSON_PATH="apps/replicator/grafana/grafana-dashboard.json"
GRAFANA_INI_PATH="apps/replicator/grafana/grafana.ini"

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

# Fetch file from repo at "@replicator-latest"
fetch_file_from_repo() {
    local file_path="$1"
    local local_filename="$2"

    local download_url
    download_url="$RAWFILE_BASE/$LATEST_TAG/$file_path?t=$(date +%s)"

    # Download the file using curl, and save it to the local filename. If the download fails,
    # exit with an error.
    curl -sS -o "$local_filename" "$download_url" || { echo "Failed to fetch $download_url."; exit 1; }
}

# Upgrade the script
self_upgrade() {
    local tmp_file
    tmp_file=$(mktemp)
    fetch_file_from_repo "$SCRIPT_FILE_PATH" "$tmp_file"

    local current_hash
    local new_hash

    # Get the hash of the current script and the new file
    current_hash=$($HASH_CMD "$0" | awk '{ print $1 }')
    new_hash=$($HASH_CMD "$tmp_file" | awk '{ print $1 }')

    # Compare the hashes
    if [[ "$new_hash" != "$current_hash" ]]; then
        echo "New version found. Upgrading..."
        mv "$tmp_file" "$0" # Overwrite the current script
        chmod +rx "$0"      # Ensure the script remains executable
        echo "✅ Upgrade complete. Restarting with new version..."
        echo ""
        exec "$0" "$@" || echo "Exec failed with status: $?"

        # Exit the script because we already "exec"ed the script above
        exit 0
    else
        echo "✅ Latest Script Version."
        rm -f "$tmp_file"  # Clean up temporary file if no upgrade was needed
    fi
}

# Fetch the docker-compose.yml and grafana-dashboard.json files
fetch_latest_docker_compose_and_dashboard() {
    fetch_file_from_repo "$DOCKER_COMPOSE_FILE_PATH" "docker-compose.yml"
    fetch_file_from_repo "$GRAFANA_DASHBOARD_JSON_PATH" "grafana-dashboard.json"
    mkdir -p grafana
    chmod 777 grafana
    fetch_file_from_repo "$GRAFANA_INI_PATH" "grafana/grafana.ini"
}

key_exists() {
    local key=$1
    grep -q "^$key=" .env
    return $?
}

portable_nproc() {
    OS="$(uname -s)"
    if [ "$OS" = "Linux" ]; then
        NPROCS="$(nproc --all)"
    elif [ "$OS" = "Darwin" ] || \
         [ "$(echo "$OS" | grep -q BSD)" = "BSD" ]; then
        NPROCS="$(sysctl -n hw.ncpu)"
    else
        NPROCS="$(getconf _NPROCESSORS_ONLN)"  # glibc/coreutils fallback
    fi
    echo "$NPROCS"
}

get_hub_host() {
    read -p "> Enter your HUB_HOST (e.g. my-hub.domain.com:2283): " HUB_HOST
    echo "HUB_HOST=$HUB_HOST" >> .env
}

get_hub_ssl() {
    while true; do
        read -p "> Does your hub use SSL? " HUB_SSL

        local lower_response=$(echo "$HUB_SSL" | tr '[:upper:]' '[:lower:]')
        if [[ $lower_response == "true" || $lower_response == "t" || $lower_response == "y" || $lower_response == "yes" ]]; then
            echo "HUB_SSL=true" >> .env
            break
        elif [[ $lower_response == "false" || $lower_response = "f" || $lower_response == "n" || $lower_response == "no" ]]; then
            echo "HUB_SSL=false" >> .env
            break
        else
            echo "!!! Invalid !!!"
            echo "You must specify a boolean value (true/false)"
        fi
    done
}

write_env_file() {
    if [[ ! -f .env ]]; then
        touch .env
    fi

    if ! key_exists "LOG_LEVEL"; then
        echo "LOG_LEVEL=info" >> .env
    fi

    if ! key_exists "COLORIZE"; then
        echo "COLORIZE=true" >> .env
    fi

    if ! key_exists "CONCURRENCY"; then
        echo "# Set this higher the further the hub is from the replicator"
        echo "CONCURRENCY=$(expr 4 \* $(portable_nproc))" >> .env
    fi

    if ! key_exists "WORKER_TYPE"; then
        echo "WORKER_TYPE=thread" >> .env
    fi

    if ! key_exists "WEB_UI_PORT"; then
        echo "WEB_UI_PORT=9000" >> .env
    fi

    if ! key_exists "REDIS_URL"; then
        echo "REDIS_URL=redis:6379" >> .env
    fi

    if ! key_exists "POSTGRES_URL"; then
        echo "POSTGRES_URL=postgres://replicator:password@postgres:5432/replicator" >> .env
    fi

    if ! key_exists "STATSD_HOST"; then
        echo "STATSD_HOST=statsd:8125" >> .env
    fi

    if ! key_exists "HUB_HOST"; then
        get_hub_host
    fi

    if ! key_exists "HUB_SSL"; then
        get_hub_ssl
    fi

    echo "✅ .env file updated."
}

ensure_postgres() {
      if $COMPOSE_CMD ps postgres 2>&1 >/dev/null; then
          if $COMPOSE_CMD ps postgres | grep -q "Up"; then
              $COMPOSE_CMD restart postgres
          else
              $COMPOSE_CMD up -d postgres
          fi
      else
          echo "❌ Docker is not running or there's another issue with Docker. Please start Docker manually."
          exit 1
      fi
}

ensure_redis() {
      if $COMPOSE_CMD ps redis 2>&1 >/dev/null; then
          if $COMPOSE_CMD ps redis | grep -q "Up"; then
              $COMPOSE_CMD restart redis
          else
              $COMPOSE_CMD up -d redis
          fi
      else
          echo "❌ Docker is not running or there's another issue with Docker. Please start Docker manually."
          exit 1
      fi
}

ensure_grafana() {
      # Create a grafana data directory if it doesn't exist
      mkdir -p grafana/data
      chmod 777 grafana/data

      if $COMPOSE_CMD ps statsd 2>&1 >/dev/null; then
          if $COMPOSE_CMD ps statsd | grep -q "Up"; then
              $COMPOSE_CMD restart statsd grafana
          else
              $COMPOSE_CMD up -d statsd grafana
          fi
      else
          echo "❌ Docker is not running or there's another issue with Docker. Please start Docker manually."
          exit 1
      fi
}

## Configure Grafana
setup_grafana() {
    local grafana_url="http://127.0.0.1:9001"
    local credentials
    local response dashboard_uid prefs

    if key_exists "GRAFANA_CREDS"; then
        credentials=$(grep "^GRAFANA_CREDS=" .env | awk -F '=' '{printf $2}')
        echo "Using grafana creds from .env file"
    else
        credentials="admin:admin"
    fi

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

    # Step 1: Restart statsd and grafana if they are running, otherwise start them
    ensure_grafana

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

    # Step 4: Import the dashboard. The API takes a slighly different format than the JSON import
    # in the UI, so we need to convert the JSON file first.
    jq '{dashboard: (del(.id) | . + {id: null}), folderId: 0, overwrite: true}' "grafana-dashboard.json" > "grafana-dashboard.api.json"

    response=$(curl -s -X "POST" "$grafana_url/api/dashboards/db" \
        -u "$credentials" \
        -H "Content-Type: application/json" \
        --data-binary @grafana-dashboard.api.json)

    rm "grafana-dashboard.api.json"

    if echo "$response" | jq -e '.status == "success"' >/dev/null; then
        # Extract dashboard UID from the response
        dashboard_uid=$(echo "$response" | jq -r '.uid')

        # Set the default home dashboard for the organization
        prefs=$(curl -s -X "PUT" "$grafana_url/api/org/preferences" \
            -u "$credentials" \
            -H "Content-Type: application/json" \
            --data "{\"homeDashboardUID\":\"$dashboard_uid\"}")

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

start_replicator() {

    # Stop the "replicator" service if it is already running
    $COMPOSE_CMD stop replicator

    # Start the "replicator" service
    $COMPOSE_CMD up -d replicator
}

set_compose_command() {
    # Detect whether "docker-compose" or "docker compose" is available
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        echo "✅ Using docker-compose"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
        echo "✅ Using docker compose"
    else
        echo "❌ Neither 'docker-compose' nor 'docker compose' is available on this system."
        exit 1
    fi
}

set_platform_commands() {
    # Determine the appropriate hash command to use
    if command -v sha256sum > /dev/null; then
        HASH_CMD="sha256sum"
    elif command -v shasum > /dev/null; then
        HASH_CMD="shasum -a 256"
    else
        echo "Error: No suitable hash command found."
        exit 1
    fi
}

reexec_as_root_if_needed() {
    # Check if on Linux
    if [[ "$(uname)" == "Linux" ]]; then
        # Check if not running as root, then re-exec as root
        if [[ "$(id -u)" -ne 0 ]]; then
            # Ensure the script runs in the ~/replicator directory
            cd ~/replicator || { echo "Failed to switch to ~/replicator directory."; exit 1; }
            exec sudo "$0" "$@"
        else
            # If the current directory is not named "replicator", change to "~/replicator"
            if [[ "$(basename "$PWD")" != "replicator" ]]; then
                cd "$(dirname "$0")" || { echo "Failed to switch to ~/replicator directory."; exit 1; }
            fi
            echo "✅ Running on Linux ($(pwd))."
        fi
    # Check if on macOS
    elif [[ "$(uname)" == "Darwin" ]]; then
        cd ~/replicator || { echo "Failed to switch to ~/replicator directory."; exit 1; }
        echo "✅ Running on macOS $(pwd)."
    fi
}


# Call the function at the beginning of your script
reexec_as_root_if_needed "$@"

# Check for the "up" command-line argument
if [ "$1" == "up" ]; then
   # Setup the docker-compose command
    set_compose_command

    $COMPOSE_CMD up -d replicator statsd grafana

    echo "✅ Replicator is running."

    # Finally, start showing the logs
    $COMPOSE_CMD logs --tail 100 -f replicator

    exit 0
fi

# "down" command-line argument
if [ "$1" == "down" ]; then
    # Setup the docker-compose command
    set_compose_command

    # Run docker compose down
    $COMPOSE_CMD down

    echo "✅ Replicator is stopped."

    exit 0
fi

# Check the command-line argument for 'upgrade'
if [ "$1" == "upgrade" ]; then
    # Ensure the ~/replicator directory exists
    if [ ! -d ~/replicator ]; then
        mkdir -p ~/replicator || { echo "Failed to create ~/replicator directory."; exit 1; }
    fi

    # Install dependencies
    install_jq

    set_platform_commands

    # Upgrade this script itself
    self_upgrade "$@"

    # Call the function to install docker
    install_docker "$@"

    # Call the function to set the COMPOSE_CMD variable
    set_compose_command

    # Update the env file if needed
    write_env_file

    # Fetch the latest docker-compose.yml
    fetch_latest_docker_compose_and_dashboard

    # Setup persistent stores
    ensure_postgres
    ensure_redis

    # Setup the Grafana dashboard
    setup_grafana

    start_replicator

    echo "✅ Upgrade complete."
    echo ""
    echo "Monitor your replicator at http://localhost:9000/ and http://localhost:9001/"

    # Sleep for 5 seconds
    sleep 5

    # Finally, start showing the logs
    $COMPOSE_CMD logs --tail 100 -f replicator

    exit 0
fi

# Show logs of the replicator service
if [ "$1" == "logs" ]; then
    set_compose_command
    $COMPOSE_CMD logs --tail 100 -f replicator
    exit 0
fi

# If run without args OR with "help", show a help
if [ $# -eq 0 ] || [ "$1" == "help" ]; then
    echo "replicator.sh - Install or upgrade the Replicator"
    echo "Usage:     replicator.sh [command]"
    echo "  upgrade  Upgrade an existing installation of the Replicator"
    echo "  logs     Show the logs of the Replicator service"
    echo "  up       Start Replicator and Grafana dashboard"
    echo "  down     Stop Replicator and Grafana dashboard"
    echo "  help     Show this help"
    exit 0
fi
