##
## Script replaces the .rocks sub directories to be backed by overlayfs. This
## allows the application to update the state in a non destructive manner which
## can be rolled back at a future time. Used for creating and replaying production
## data for benchmarking purposes.
##

DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
ROOT_DIR=$(realpath "${DIR}/..")

echo "mount requires sudo permissions"
sudo echo "auth success";

if [ ! -d "${ROOT_DIR}/.rocks" ]; then
    echo ".rocks directory not found";
    exit 1;
fi

mkdir -p "${ROOT_DIR}/.rocks/.overlayfs"

if [ $(stat -c "%d" "${ROOT_DIR}/.rocks") != $(stat -c "%d" "${ROOT_DIR}/.rocks/.overlayfs") ]; then
    echo ".rocks and .overlayfs need to be on the same filesystem";
    exit 1;
fi

mkdir -p "${ROOT_DIR}/.rocks/.overlayfs/rocks-data"
mkdir -p "${ROOT_DIR}/.rocks/.overlayfs/rocks-workdir"
mkdir -p "${ROOT_DIR}/.rocks/.overlayfs/rocks-upperdir"

# note: move contents of folder so directory mount stays if applicable
for i in $(ls "${ROOT_DIR}/.rocks"); do
    if [ "$i" = ".overlayfs" ]; then
        continue;
    fi

    if [ $(stat -c "%d" "${ROOT_DIR}/.rocks") != $(stat -c "%d" "${ROOT_DIR}/.rocks/$i") ]; then
        echo "$i is already mounted with overlayfs, skipping";
        continue;
    fi

    if [ -z "$(ls -A ${ROOT_DIR}/.rocks/${i})" ]; then
        echo "removing empty directory $i";
        rm -rf "${ROOT_DIR}/.rocks/$i";
        continue;
    fi

    echo "moving ${i} to overlayfs/rocks-data";
    mv "${ROOT_DIR}/.rocks/${i}" "${ROOT_DIR}/.rocks/.overlayfs/rocks-data/";
done;

for i in $(ls "${ROOT_DIR}/.rocks/.overlayfs/rocks-data/"); do
    if [ -d "${ROOT_DIR}/.rocks/$i" ]; then
        if [ $(stat -c "%d" "${ROOT_DIR}/.rocks") != $(stat -c "%d" "${ROOT_DIR}/.rocks/$i") ]; then
            continue;
        fi
    fi

    echo "preparing $i for overlayfs";

    # prepare empty workdir for mount
    WORKDIR="${ROOT_DIR}/.rocks/.overlayfs/rocks-workdir/${i}"
    sudo rm -rf "${WORKDIR}" || true;
    mkdir "${WORKDIR}";

    # prepare empty upperdir for mount (deletes changes)
    UPPERDIR="${ROOT_DIR}/.rocks/.overlayfs/rocks-upperdir/${i}"
    sudo rm -rf "${UPPERDIR}" || true;
    mkdir "${UPPERDIR}";

    LOWERDIR="${ROOT_DIR}/.rocks/.overlayfs/rocks-data/${i}"

    OUTDIR="${ROOT_DIR}/.rocks/$i"
    mkdir $OUTDIR

    sudo mount -t overlay -o "lowerdir=${LOWERDIR},upperdir=${UPPERDIR},workdir=${WORKDIR}" overlay ${OUTDIR}
    echo "${i} mounted with overlayfs"
done;
