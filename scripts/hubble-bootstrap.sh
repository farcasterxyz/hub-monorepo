#!/bin/bash

# This is the bootstrap script for hubble. It is used to install the latest version of hubble.
# Simply run the following command to install the latest version of hubble:
# curl <file location> | bash

REPO="farcasterxyz/hub-monorepo"
RAWFILE_BASE="https://raw.githubusercontent.com/$REPO"
LATEST_TAG="@latest"
SCRIPT_FILE_PATH="scripts/hubble.sh"

install_jq() {
    if command -v jq >/dev/null 2>&1; then
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

setup_hubble_command() {
    if command -v hubbly >/dev/null 2>&1; then
        echo "✅ Hubbly command is installed."
        return 0
    fi
    
cat > /usr/local/bin/hubble <<EOF
#!/bin/bash
cd ~/hubble
exec ./hubble.sh \$1 < /dev/tty
EOF
    chmod +x /usr/local/bin/hubble
}

do_bootstrap() {
    # Make the ~/hubble directory if it doesn't exist
    mkdir -p ~/hubble
    
    local tmp_file
    tmp_file=$(mktemp)
    fetch_file_from_repo "$SCRIPT_FILE_PATH" "$tmp_file"

    mv "$tmp_file" ~/hubble/hubble.sh
    chmod +x ~/hubble/hubble.sh

    #Setting hubble system commands
    setup_hubble_command

    # Run the hubble.sh script
    cd ~/hubble
    exec ./hubble.sh "upgrade" < /dev/tty
}

# Install jq
install_jq

# Bootstrap
do_bootstrap
