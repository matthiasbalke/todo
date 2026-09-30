#!/usr/bin/env zsh
set -u
setopt pipefail

SCRIPT_DIR="${${(%):-%x}:A:h}"

INSTALL_ROOT="${HOME}/.local/share/watch-and-run"
INSTALL_LINK="${HOME}/.local/bin/watch-and-run"
INSTALLED_BIN="${INSTALL_ROOT}/watcher.zsh"

mkdir -p "${INSTALL_ROOT}" "${INSTALL_LINK:h}"
cp "${SCRIPT_DIR}/watcher.zsh" "${INSTALL_ROOT}/watcher.zsh"
cp "${SCRIPT_DIR}/README.md" "${INSTALL_ROOT}/README.md"
cp -R "${SCRIPT_DIR}/tests" "${INSTALL_ROOT}/"

if [[ ! -e "${INSTALL_ROOT}/actions.zsh" ]]; then
	cp "${SCRIPT_DIR}/actions.zsh" "${INSTALL_ROOT}/actions.zsh"
else
	printf '%s already exists and will not be overridden.\n' "${INSTALL_ROOT}/actions.zsh"
fi

chmod -R go-rwx "${INSTALL_ROOT}"
chmod u+x "${INSTALL_ROOT}/watcher.zsh"
[[ ! -e "${INSTALL_LINK}" || -L "${INSTALL_LINK}" ]] || {
	printf 'Error: command path exists and is not a symbolic link: %s\n' "${INSTALL_LINK}" >&2
	exit 1
}
ln -sfn "${INSTALLED_BIN}" "${INSTALL_LINK}"
