#!/usr/bin/env bash
set -euo pipefail

# Cloud Mod Manager (cmm) - Installation Script
# https://github.com/aegeada/cloudModManager

REPO="1unarea/cloudModManager"
INSTALL_DIR="${HOME}/.local/bin"

echo "[INFO] Installing Cloud Mod Manager (cmm)..."

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "${ARCH}" in
  x86_64|amd64)
    GOARCH="amd64"
    ;;
  aarch64|arm64)
    GOARCH="arm64"
    ;;
  *)
    echo "[ERROR] Unsupported architecture: ${ARCH}" >&2
    exit 1
    ;;
esac

case "${OS}" in
  linux)
    GOOS="linux"
    EXT=""
    ;;
  darwin)
    GOOS="darwin"
    EXT=""
    ;;
  msys*|cygwin*|mingw*)
    GOOS="windows"
    EXT=".exe"
    ;;
  *)
    echo "[ERROR] Unsupported operating system: ${OS}" >&2
    exit 1
    ;;
esac

TAG=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
if [ -z "${TAG}" ]; then
  TAG="v0.2.0"
fi

BINARY_NAME="cmm-${TAG}-${GOOS}-${GOARCH}${EXT}"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${TAG}/${BINARY_NAME}"

mkdir -p "${INSTALL_DIR}"
TARGET="${INSTALL_DIR}/cmm${EXT}"
TMP_TARGET="${TARGET}.tmp.$$"

echo "[INFO] Downloading ${BINARY_NAME} from release ${TAG}..."
if ! curl -fsSL "${DOWNLOAD_URL}" -o "${TMP_TARGET}"; then
  FALLBACK_NAME="cmm-${GOOS}-${GOARCH}${EXT}"
  DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${TAG}/${FALLBACK_NAME}"
  echo "[INFO] Retrying with ${FALLBACK_NAME}..."
  curl -fsSL "${DOWNLOAD_URL}" -o "${TMP_TARGET}"
fi

chmod +x "${TMP_TARGET}"
mv -f "${TMP_TARGET}" "${TARGET}"

echo "[OK] Successfully installed cmm to ${TARGET}"

if ! echo ":${PATH}:" | grep -q ":${INSTALL_DIR}:"; then
  echo "[WARN] ${INSTALL_DIR} is not in your PATH."
  echo "[INFO] Add the following to your ~/.bashrc or ~/.zshrc:"
  echo "       export PATH=\"\${HOME}/.local/bin:\${PATH}\""
fi

"${TARGET}" version --check || true
