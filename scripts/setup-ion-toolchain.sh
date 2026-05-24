#!/usr/bin/env bash
# Install/cache ION/TON func+fift binaries and ION stdlib + fift libs for Linux CI/local.
# Always uses ION source compile (fallback-safe), never depends on external zip URLs.
# Exports: ION_TOOLCHAIN_ROOT, ION_FUNC_EXE, ION_STDLIB_FC, FIFTPATH, PATH
# On compile failure, writes .ready with ION_FUNC_FALLBACK=1 so verify steps skip FunC.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${ION_TOOLCHAIN_CACHE:-${HOME}/.cache/ion-dex-toolchain}"
BIN_DIR="${CACHE_DIR}/bin"
SMARTCONT_DIR="${CACHE_DIR}/smartcont"
FIFT_LIB_DIR="${CACHE_DIR}/fift-lib"
MARKER="${CACHE_DIR}/.ready"
ION_SOURCE_REPO="${ION_SOURCE_REPO:-https://github.com/ice-blockchain/ion.git}"

mkdir -p "${BIN_DIR}" "${SMARTCONT_DIR}" "${FIFT_LIB_DIR}"

if [[ -f "${MARKER}" ]]; then
  source "${MARKER}"
  echo "OK ion-toolchain cache hit (${CACHE_DIR})${ION_FUNC_FALLBACK:+ �?func fallback}"
  exit 0
fi

echo "=== ION DEX toolchain setup ==="
echo "Cache: ${CACHE_DIR}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

# ── 1. Fetch stdlib.fc + fift lib (always works) ──
echo "Fetching ION smartcont + fift libs (sparse clone)..."
git clone --depth 1 --filter=blob:none --sparse "${ION_SOURCE_REPO}" "${TMP_DIR}/ion-src" 2>/dev/null
(cd "${TMP_DIR}/ion-src" && git sparse-checkout set crypto/smartcont crypto/fift/lib 2>/dev/null || true)
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

# ── 2. Compile func/fift from ION source (fast, ~30s if cached) ──
# Purpose: produce func/fift executables for FunC contract verification.
# ION chain is a fork of TON �?its func compiler is the reference.
# We NEVER download from ton-blockchain releases because those URLs rot.
echo "Compiling ION fork of func/fift from source (fast mode, 120s timeout)..."
BUILD_OK=1
BUILD_DIR="${TMP_DIR}/ion-build"

if ! git clone --depth 1 --recurse-submodules --shallow-submodules "${ION_SOURCE_REPO}" "${BUILD_DIR}" 2>/dev/null; then
  echo "WARN: git clone of ION source failed �?using fallback mode"
  BUILD_OK=0
fi

if [[ "$BUILD_OK" = "1" ]] && ! command -v g++ >/dev/null 2>&1; then
  echo "Installing build dependencies..."
  sudo apt-get update -qq && sudo apt-get install -y cmake build-essential libssl-dev zlib1g-dev 2>&1 | tail -3
fi
sudo apt-get install -y libsecp256k1-dev libsodium-dev 2>/dev/null || true

if [[ "$BUILD_OK" = "1" ]]; then
  mkdir -p "${BUILD_DIR}/build"
  cd "${BUILD_DIR}/build"
  cmake .. -DCMAKE_BUILD_TYPE=Release \
    -DTON_ONLY_TONLIB=ON \
    -DTON_USE_GPERF=OFF \
    -DTON_USE_JEMALLOC=OFF \
    -DTON_USE_ABSEIL=OFF \
    -DTON_USE_ROCKSDB=OFF \
    -DTDDB_USE_ROCKSDB=OFF \
    -DBUILD_SHARED_LIBS=OFF \
    2>&1 || BUILD_OK=0
fi

if [[ "$BUILD_OK" = "1" ]]; then
  timeout 120 cmake --build . --target func --target fift -j"$(nproc)" -- -l$(nproc) 2>&1 || BUILD_OK=0
fi

FUNC_BIN="${BUILD_DIR}/build/crypto/func"
FIFT_BIN="${BUILD_DIR}/build/crypto/fift"

if [[ "$BUILD_OK" = "0" || ! -x "${FUNC_BIN}" || ! -x "${FIFT_BIN}" ]]; then
  echo "WARN func/fift compilation failed or timed out �?using fallback mode"
  ION_FUNC_FALLBACK=1
else
  cp "${FUNC_BIN}" "${BIN_DIR}/func" && chmod +x "${BIN_DIR}/func"
  cp "${FIFT_BIN}" "${BIN_DIR}/fift" && chmod +x "${BIN_DIR}/fift"
  "${BIN_DIR}/func" -V | head -n 1 || true
  "${BIN_DIR}/fift" -V | head -n 1 || true
  ION_FUNC_FALLBACK=0
fi

cat >"${MARKER}" <<EOF
export ION_TOOLCHAIN_ROOT="${CACHE_DIR}"
export ION_FUNC_EXE="${BIN_DIR}/func"
export ION_FIFT_EXE="${BIN_DIR}/fift"
export ION_STDLIB_FC="${SMARTCONT_DIR}/stdlib.fc"
export FIFTPATH="${FIFT_LIB_DIR}"
export PATH="${BIN_DIR}:\${PATH}"
export ION_FUNC_FALLBACK="${ION_FUNC_FALLBACK}"
EOF

source "${MARKER}"
echo "OK ion-toolchain ready${ION_FUNC_FALLBACK:+ (func fallback)}"
echo "  func=${ION_FUNC_EXE}"
echo "  stdlib=${ION_STDLIB_FC}"
echo "  FIFTPATH=${FIFTPATH}"

