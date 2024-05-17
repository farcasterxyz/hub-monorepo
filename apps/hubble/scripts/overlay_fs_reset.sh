DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
ROOT_DIR=$(realpath "${DIR}/..")

echo "mount requires sudo permissions"
sudo echo "auth success";

if [ ! -d "${ROOT_DIR}/.rocks" ]; then
    echo ".rocks directory not found";
    exit 1;
fi

mkdir -p "${ROOT_DIR}/.overlayfs"

if [ $(stat -c "%d" "${ROOT_DIR}/.rocks") != $(stat -c "%d" "${ROOT_DIR}/.overlayfs") ]; then
    echo ".rocks and .overlayfs need to be on the same filesystem";
    exit 1;
fi

mkdir -p "${ROOT_DIR}/.rocks/.overlayfs/rocks-data"
mkdir -p "${ROOT_DIR}/.rocks/.overlayfs/rocks-workdir"
mkdir -p "${ROOT_DIR}/.rocks/.overlayfs/rocks-upperdir"

for i in $(ls "${ROOT_DIR}/.rocks/.overlayfs/rocks-data/"); do
    if [ -d "${ROOT_DIR}/.rocks/$i" ]; then
        if [ $(stat -c "%d" "${ROOT_DIR}/.rocks") = $(stat -c "%d" "${ROOT_DIR}/.rocks/$i") ]; then
            echo "$i is on same filesystem, skipping";
            continue;
        fi
    fi

    sudo umount "${ROOT_DIR}/.rocks/${i}";
    if [ $? -eq 0 ]; then
        echo "unmounted $i";
    else
        continue;
    fi

    if [ -z "$(ls -A ${ROOT_DIR}/.rocks/${i})" ]; then
        rm -rf "${ROOT_DIR}/.rocks/$i";
    else
        echo "unmounted folder .rocks/$i has data, please delete / resolve";
        continue;
    fi

    echo "folder moved back"
    LOWERDIR="${ROOT_DIR}/.rocks/.overlayfs/rocks-data/${i}"
    mv "${LOWERDIR}" "${ROOT_DIR}/.rocks/${i}";
done;
