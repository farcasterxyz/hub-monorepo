#!/bin/bash

# This is the bootstrap script for hubble. It is used to install the latest version of hubble.
# Simply run the following command to install the latest version of hubble:
# curl <file location> | bash

REPO="farcasterxyz/hub-monorepo"
API_BASE="https://api.github.com/repos/$REPO"
LATEST_TAG="@latest"
SCRIPT_FILE_PATH="scripts/hubble.sh"

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

do_bootstrap() {
    # Make the ~/hubble directory if it doesn't exist
    mkdir -p ~/hubble

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

    mv "$tmp_file" ~/hubble/hubble.sh
    chmod +x ~/hubble/hubble.sh

    set -x
    exec ~/hubble/hubble.sh "upgrade" < /dev/tty
}

# Install jq
install_jq

# Bootstrap
do_bootstrap
