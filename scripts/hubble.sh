#!/bin/bash

# The Hubble installation script. This script is used to install the latest version of Hubble.
# It can also be used to upgrade an existing installation of Hubble, also upgrading
# itself in the process.

# Define the version of this script
CURRENT_VERSION="5"

REPO="farcasterxyz/hub-monorepo"
RAWFILE_BASE="https://raw.githubusercontent.com/$REPO"
LATEST_TAG="@latest"

DOCKER_COMPOSE_FILE_PATH="apps/hubble/docker-compose.yml"
SCRIPT_FILE_PATH="scripts/hubble.sh"
GRAFANA_DASHBOARD_JSON_PATH="apps/hubble/grafana/grafana-dashboard.json"
GRAFANA_INI_PATH="apps/hubble/grafana/grafana.ini"

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

# Fetch file from repo at "@latest"
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
    # To allow easier testing
    if key_exists "SKIP_SELF_UPGRADE"; then
      echo "Skipping self upgrade"
      return 1
    fi

    local tmp_file
    trap 'rm -f "$tmp_file"' EXIT
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

# Prompt for hub operator agreement
prompt_for_hub_operator_agreement() {
    env_file=".env"

    update_env_file() {
        key="AGREE_NO_REWARDS_FOR_ME"
        value="true"
        temp_file="${env_file}.tmp"

        if [ -f "$env_file" ]; then
            # File exists, update or append
            updated=0
            while IFS= read -r line || [ -n "$line" ]; do
                if [ "${line%%=*}" = "$key" ]; then
                    echo "$key=$value" >>"$temp_file"
                    updated=1
                else
                    echo "$line" >>"$temp_file"
                fi
            done <"$env_file"

            if [ $updated -eq 0 ]; then
                echo "$key=$value" >>"$temp_file"
            fi

            mv "$temp_file" "$env_file"
        else
            # File doesn't exist, create it
            echo "$key=$value" >"$env_file"
        fi
    }

    prompt_agreement() {
        tried=0
        while true; do
            printf "⚠️  IMPORTANT: You will NOT get any rewards for running this hub\n"
            printf "> Please type \"Yes\" to continue: "
            read -r response
            case $(printf "%s" "$response" | tr '[:upper:]' '[:lower:]') in
            yes | y)
                printf "✅ You have agreed to the terms of service. Proceeding...\n"
                update_env_file
                return 0
                ;;
            *)
                tried=$((tried + 1))
                if [ $tried -gt 10 ]; then
                    printf "❌ You have not agreed to the terms of service. Please run script again manually to agree and continue.\n"
                    return 1
                fi
                printf "[i] Incorrect input. Please try again.\n"
                ;;
            esac
        done
    }

    if grep -q "AGREE_NO_REWARDS_FOR_ME=true" "$env_file"; then
        printf "✅ You have agreed to the terms of service. Proceeding...\n"
        return 0
    else
        # Check if stdin is a terminal
        if [ -t 0 ]; then
            prompt_agreement
            return $?
        fi

        # If we've reached this point, shut down existing services since agreement is required

        # Setup the docker-compose command
        set_compose_command

        # Run docker compose down
        $COMPOSE_CMD down
        printf "❌ You have not agreed to the terms of service. Please run script again manually to agree and continue.\n"

        return 1
    fi
}

validate_and_store() {
    local rpc_name=$1
    local expected_chain_id=$2

    while true; do
        read -p "> Enter your $rpc_name RPC URL: " RPC_URL
        RESPONSE=$(curl -s -H "Content-Type: application/json" -X POST --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' "$RPC_URL")

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

store_operator_fid_env() {
    local input
    local response

    read -p "> Your FID or farcaster username: " input
    if [[ -z $input ]]; then
        response=""
    elif [[ $input =~ ^-?[0-9]+$ ]]; then
        response=$(curl -s "https://fnames.farcaster.xyz/transfers?fid=$input" | jq '.transfers[-1].to')
    else
        response=$(curl -s "https://fnames.farcaster.xyz/transfers?name=$input" | jq '.transfers[-1].to')
    fi

    if [ "$response" != "null" ] && [ "$response" != "" ]; then
        echo "HUB_OPERATOR_FID=$response" >> .env
    else
        echo "Not a valid FID or username. Not updating HUB_OPERATOR_FID."
        echo "HUB_OPERATOR_FID=0" >> .env
    fi
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

    if ! key_exists "OPTIMISM_L2_RPC_URL"; then
        validate_and_store "Optimism L2 Mainnet" "0xa" "OPTIMISM_L2_RPC_URL"
    fi

    if ! key_exists "HUB_OPERATOR_FID"; then
        store_operator_fid_env
    fi

    echo "✅ .env file updated."
}

ensure_grafana() {
      # Create a grafana data directory if it doesn't exist
      mkdir -p grafana/data
      chmod 777 grafana/data

      if $COMPOSE_CMD ps 2>&1 >/dev/null; then
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
    local grafana_url="http://127.0.0.1:3000"
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

    # Step 4: Import the dashboard. The API takes a slightly different format than the JSON import
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
        echo "Failed to install the dashboard. Exiting."
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
    if [[ $? -ne 0 ]]; then
        echo "❌ Failed to install Docker via official script. Falling back to docker-compose."
        curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    rm get-docker.sh

    # Add current user to the docker group
    sudo usermod -aG docker $(whoami)

    echo "✅ Docker is installed"
    return 0
}

setup_identity() {
    # First, make sure to pull all the latest images in docker compose
    $COMPOSE_CMD pull

    # Make directory for hubble data called ".hub" and ".rocks". Make sure to set
    # the permissions so that the current user owns the directory and it is writable
    # by everyone
    mkdir -p .hub .rocks
    chmod 777 .hub .rocks

   if [[ ! -f "./.hub/default_id.protobuf" ]]; then
        $COMPOSE_CMD run hubble yarn identity create
        echo "✅ Created Peer Identity"
    else
        echo "✅ Peer Identity exists"
    fi
}

setup_crontab() {
    # Check if crontab is installed
    if ! command -v crontab &> /dev/null; then
        echo "❌ crontab is not installed. Please install crontab first."
        exit 1
    fi

    # skip installing crontab if SKIP_CRONTAB is set to anything in the .env
    if key_exists "SKIP_CRONTAB"; then
        echo "✅ SKIP_CRONTAB exists in .env. Skipping crontab setup."
        return 0
    fi

    # If the crontab was installed for the current user (instead of root) then
    # remove it
    if [[ "$(uname)" == "Linux" ]]; then
        # Extract the username from the current directory, since we're running as root
        local user=$(pwd | cut -d/ -f3)
        USER_CRONTAB_CMD="crontab -u ${user}"

        if $USER_CRONTAB_CMD -l 2>/dev/null | grep -q "hubble.sh"; then
            $USER_CRONTAB_CMD -l > /tmp/temp_cron.txt
            sed -i '/hubble\.sh/d' /tmp/temp_cron.txt
            $USER_CRONTAB_CMD /tmp/temp_cron.txt
            rm /tmp/temp_cron.txt
        fi
    fi

    # Check if the crontab file is already installed
    if $CRONTAB_CMD -l 2>/dev/null | grep -q "hubble.sh"; then
      # Fix buggy crontab entry which would run every minute
      if $CRONTAB_CMD -l 2>/dev/null | grep "hubble.sh" | grep -q "^\*"; then
        echo "Removing crontab for upgrade"

        # Export the existing crontab entries to a temporary file in /tmp/
        crontab -l > /tmp/temp_cron.txt

        # Remove the line containing "hubble.sh" from the temporary file
        sed -i '/hubble\.sh/d' /tmp/temp_cron.txt
        crontab /tmp/temp_cron.txt
        rm /tmp/temp_cron.txt
      else
        echo "✅ crontab entry is already installed."
        return 0
      fi
    fi

    local content_to_hash
    local hub_operator_fid
    hub_operator_fid=$(grep "^HUB_OPERATOR_FID=" .env | cut -d= -f2)
    # If the HUB_OPERATOR_FID is set and it is not 0, then use it to determine the day of week
    if [[ -n "$hub_operator_fid" ]] && [[ "$hub_operator_fid" != "0" ]]; then
        content_to_hash=$(echo -n "$hub_operator_fid")
        echo "auto-upgrade: Using HUB FID to determine upgrade day $content_to_hash"
    elif [ -f "./.hub/default_id.protobuf" ]; then
        content_to_hash=$(cat ./.hub/default_id.protobuf)
        echo "auto-upgrade: Using Peer Identity to determine upgrade day"
    else
        echo "auto-upgrade: Unable to determine upgrade day"
        exit 1
    fi

    # Pick a random weekday based on the sha of the operator FID or peer identity
    local sha=$(echo -n "${content_to_hash}" | $HASH_CMD | awk '{ print $1 }')
    local day_of_week=$(( ( 0x${sha:0:8} % 5 ) + 1 ))
    # Pick a random hour between midnight and 6am
    local hour=$((RANDOM % 7))
    local crontab_entry="0 $hour * * $day_of_week $(pwd)/hubble.sh autoupgrade >> $(pwd)/hubble-autoupgrade.log 2>&1"
    if ($CRONTAB_CMD -l 2>/dev/null; echo "${crontab_entry}") | $CRONTAB_CMD -; then
        echo "✅ added auto-upgrade to crontab (0 $hour * * $day_of_week)"
    else
        echo "❌ failed to add auto-upgrade to crontab"
    fi
}

start_hubble() {

    # Stop the "hubble" service if it is already running
    $COMPOSE_CMD stop hubble

    # Start the "hubble" service
    $COMPOSE_CMD up -d hubble
}

cleanup() {
  # Prune unused docker cruft. Make sure to call this only when hub is already running
  echo "Pruning unused docker images and volumes"
  docker system prune --volumes -f
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

    CRONTAB_CMD="crontab"
}

reexec_as_root_if_needed() {
    # Check if on Linux
    if [[ "$(uname)" == "Linux" ]]; then
        # Check if not running as root, then re-exec as root
        if [[ "$(id -u)" -ne 0 ]]; then
            # Ensure the script runs in the ~/hubble directory
            cd ~/hubble || { echo "Failed to switch to ~/hubble directory."; exit 1; }
            exec sudo "$0" "$@"
        else
            # If the current directory is not named "hubble", change to "~/hubble"
            if [[ "$(basename "$PWD")" != "hubble" ]]; then
                cd "$(dirname "$0")" || { echo "Failed to switch to ~/hubble directory."; exit 1; }
            fi
            echo "✅ Running on Linux ($(pwd))."
        fi
    # Check if on macOS
    elif [[ "$(uname)" == "Darwin" ]]; then
        cd ~/hubble || { echo "Failed to switch to ~/hubble directory."; exit 1; }
        echo "✅ Running on macOS $(pwd)."
    fi
}


# Call the function at the beginning of your script
reexec_as_root_if_needed "$@"

# Prompt for hub operator agreement
prompt_for_hub_operator_agreement || exit $?

# Check for the "up" command-line argument
if [ "$1" == "up" ]; then
   # Setup the docker-compose command
    set_compose_command

    # Run docker compose up -d hubble
    $COMPOSE_CMD up -d hubble statsd grafana

    echo "✅ Hubble is running."

    # Finally, start showing the logs
    $COMPOSE_CMD logs --tail 100 -f hubble

    exit 0
fi

# "down" command-line argument
if [ "$1" == "down" ]; then
    # Setup the docker-compose command
    set_compose_command

    # Run docker compose down
    $COMPOSE_CMD down

    echo "✅ Hubble is stopped."

    exit 0
fi

# Check the command-line argument for 'upgrade'
if [ "$1" == "upgrade" ]; then
    # Ensure the ~/hubble directory exists
    if [ ! -d ~/hubble ]; then
        mkdir -p ~/hubble || { echo "Failed to create ~/hubble directory."; exit 1; }
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

    # Setup the Grafana dashboard
    setup_grafana

    setup_identity

    setup_crontab

    # Start the hubble service
    start_hubble

    echo "✅ Upgrade complete."
    echo ""
    echo "Monitor your node at http://localhost:3000/"

    # Sleep for 5 seconds
    sleep 5

    # Finally, start showing the logs
    $COMPOSE_CMD logs --tail 100 -f hubble

    exit 0
fi

# Show logs of the hubble service
if [ "$1" == "logs" ]; then
    set_compose_command
    $COMPOSE_CMD logs --tail 100 -f hubble
    exit 0
fi

if [ "$1" == "autoupgrade" ]; then
    # Autoupgrade cronjob needs the correct $PATH entries
    if [[ ! -f "~/.bashrc" ]]; then
      source ~/.bashrc
    fi

    echo "$(date) Attempting hubble autoupgrade..."

    # Since cronjob is running under root, make sure the dependencies are installed
    install_jq
    install_docker "$@"

    set_platform_commands
    set_compose_command

    # Upgrade this script itself, fetch the latest docker-compose.yml, and restart the containers
    self_upgrade "$@"
    fetch_latest_docker_compose_and_dashboard
    ensure_grafana
    start_hubble
    sleep 5
    cleanup

    echo "$(date) Completed hubble autoupgrade"

    exit 0
fi

# If run without args OR with "help", show a help
if [ $# -eq 0 ] || [ "$1" == "help" ]; then
    echo "hubble.sh - Install or upgrade Hubble"
    echo "Usage:     hubble.sh [command]"
    echo "  upgrade  Upgrade an existing installation of Hubble"
    echo "  logs     Show the logs of the Hubble service"
    echo "  up       Start Hubble and Grafana dashboard"
    echo "  down     Stop Hubble and Grafana dashboard"
    echo "  help     Show this help"
    echo ""
    echo "add SKIP_CRONTAB=true to your .env to skip installing the autoupgrade crontab"
    exit 0
fi
