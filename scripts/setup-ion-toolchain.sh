#!/usr/bin/env bash
# Install/cache ION/TON func+fift binaries and ION stdlib + fift libs for Linux CI/local.
# Exports: ION_TOOLCHAIN_ROOT, ION_FUNC_EXE, ION_STDLIB_FC, FIFTPATH, PATH
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${ION_TOOLCHAIN_CACHE:-${HOME}/.cache/ion-dex-toolchain}"
BIN_DIR="${CACHE_DIR}/bin"
SMARTCONT_DIR="${CACHE_DIR}/smartcont"
FIFT_LIB_DIR="${CACHE_DIR}/fift-lib"
MARKER="${CACHE_DIR}/.ready"

ION_SOURCE_REPO="${ION_SOURCE_REPO:-https://github.com/ice-blockchain/ion.git}"
ION_SOURCE_REF="${ION_SOURCE_REF:-master}"

# TON portable binaries (func/fift); compatible with ION FunC for compile smoke tests.
TON_RELEASE_TAG="${TON_RELEASE_TAG:-v2024.06}"
TON_ZIP_URL="${TON_ZIP_URL:-https://github.com/ton-blockchain/ton/releases/download/${TON_RELEASE_TAG}/ton-linux-x86_64.zip}"

mkdir -p "${BIN_DIR}" "${SMARTCONT_DIR}" "${FIFT_LIB_DIR}"

if [[ -f "${MARKER}" ]]; then
  # shellcheck disable=SC1090
  source "${MARKER}"
  echo "OK ion-toolchain cache hit (${CACHE_DIR})"
  exit 0
fi

echo "=== ION DEX toolchain setup ==="
echo "Cache: ${CACHE_DIR}"

if ! command -v curl >/dev/null 2>&1; then
  echo "Installing curl..."
  sudo apt-get update -qq
  sudo apt-get install -y curl unzip git ca-certificates libssl-dev
fi

if ! command -v unzip >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y unzip
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

echo "Fetching ION smartcont + fift libs (sparse clone)..."
git clone --depth 1 --filter=blob:none --sparse "${ION_SOURCE_REPO}" "${TMP_DIR}/ion-src" 2>/dev/null
(
  cd "${TMP_DIR}/ion-src"
  git sparse-checkout set crypto/smartcont crypto/fift/lib 2>/dev/null || true
  git checkout "${ION_SOURCE_REF}" 2>/dev/null || true
)

if [[ -f "${TMP_DIR}/ion-src/crypto/smartcont/stdlib.fc" ]]; then
  cp "${TMP_DIR}/ion-src/crypto/smartcont/stdlib.fc" "${SMARTCONT_DIR}/stdlib.fc"
  echo "OK stdlib.fc from ${ION_SOURCE_REPO}"
else
  echo "WARN could not fetch ION stdlib.fc; func compile may fail"
fi

if [[ -d "${TMP_DIR}/ion-src/crypto/fift/lib" ]]; then
  cp -R "${TMP_DIR}/ion-src/crypto/fift/lib/." "${FIFT_LIB_DIR}/"
  echo "OK fift lib from ${ION_SOURCE_REPO}"
else
  echo "WARN could not fetch ION fift lib"
fi

echo "Downloading TON portable func+fift (${TON_RELEASE_TAG})..."
ZIP_PATH="${TMP_DIR}/ton.zip"
curl -fsSL "${TON_ZIP_URL}" -o "${ZIP_PATH}"
unzip -q "${ZIP_PATH}" -d "${TMP_DIR}/ton-unzip"

FUNC_BIN="$(find "${TMP_DIR}/ton-unzip" -type f -name func -perm -111 2>/dev/null | head -n 1 || true)"
FIFT_BIN="$(find "${TMP_DIR}/ton-unzip" -type f -name fift -perm -111 2>/dev/null | head -n 1 || true)"

if [[ -z "${FUNC_BIN}" || -z "${FIFT_BIN}" ]]; then
  echo "ERROR: func/fift not found inside ${TON_ZIP_URL}"
  exit 1
fi

cp "${FUNC_BIN}" "${BIN_DIR}/func"
cp "${FIFT_BIN}" "${BIN_DIR}/fift"
chmod +x "${BIN_DIR}/func" "${BIN_DIR}/fift"

"${BIN_DIR}/func" -V | head -n 1 || true
"${BIN_DIR}/fift" -V | head -n 1 || true

cat >"${MARKER}" <<EOF
export ION_TOOLCHAIN_ROOT="${CACHE_DIR}"
export ION_FUNC_EXE="${BIN_DIR}/func"
export ION_FIFT_EXE="${BIN_DIR}/fift"
export ION_STDLIB_FC="${SMARTCONT_DIR}/stdlib.fc"
export FIFTPATH="${FIFT_LIB_DIR}"
export PATH="${BIN_DIR}:\${PATH}"
EOF

# shellcheck disable=SC1090
source "${MARKER}"

echo "OK ion-toolchain ready"
echo "  func=${ION_FUNC_EXE}"
echo "  stdlib=${ION_STDLIB_FC}"
echo "  FIFTPATH=${FIFTPATH}"
