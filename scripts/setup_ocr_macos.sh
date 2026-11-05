#!/usr/bin/env bash
set -eu

verify_tesseract() {
  local path="$1"
  printf 'Tesseract found at: %s\n' "$path"
  "$path" --version || return 1
  languages="$("$path" --list-langs 2>&1)" || return 1
  printf '%s\n' "$languages"
  if printf '%s\n' "$languages" | grep -Eq '^[[:space:]]*eng[[:space:]]*$'; then
    return 0
  fi
  echo "English language data is missing. Homebrew provides the tesseract-lang formula."
  return 2
}

find_tesseract() {
  if [ -n "${TESSERACT_CMD:-}" ]; then
    if [ -x "$TESSERACT_CMD" ]; then
      printf '%s\n' "$TESSERACT_CMD"
      return 0
    fi
    command -v "$TESSERACT_CMD" 2>/dev/null && return 0
  fi
  command -v tesseract 2>/dev/null || {
    for candidate in /opt/homebrew/bin/tesseract /usr/local/bin/tesseract /opt/local/bin/tesseract; do
      if [ -x "$candidate" ]; then
        printf '%s\n' "$candidate"
        return 0
      fi
    done
    return 1
  }
}

if tesseract_path="$(find_tesseract)"; then
  if verify_tesseract "$tesseract_path"; then exit 0; else verify_status=$?; fi
  if [ "$verify_status" -eq 2 ] && command -v brew >/dev/null 2>&1; then
    printf 'Install the Tesseract language formula with Homebrew now? This downloads and installs language data (y/N): '
    read -r answer
    case "$answer" in
      y|Y|yes|YES) brew install tesseract-lang ;;
      *) echo "No changes made. Run 'brew install tesseract-lang', then run this script again."; exit 1 ;;
    esac
    verify_tesseract "$tesseract_path"
    exit $?
  fi
  exit 1
fi

echo "Tesseract was not found. This script will not install anything without your confirmation."
if ! command -v brew >/dev/null 2>&1; then
  echo "Install Homebrew from https://brew.sh, then run: brew install tesseract"
  echo "If English language data is missing, install the Tesseract language data formula."
  exit 1
fi

printf 'Install Tesseract with Homebrew now? Homebrew will download and install software (y/N): '
read -r answer
case "$answer" in
  y|Y|yes|YES) brew install tesseract ;;
  *) echo "No changes made. Run 'brew install tesseract' when ready."; exit 0 ;;
esac

tesseract_path="$(find_tesseract || true)"
if [ -z "$tesseract_path" ]; then
  echo "Tesseract was installed but is not discoverable. Start a new shell and run this script again."
  exit 1
fi
if verify_tesseract "$tesseract_path"; then exit 0; else verify_status=$?; fi
if [ "$verify_status" -eq 2 ]; then
  printf 'Install missing language data with Homebrew now? (y/N): '
  read -r answer
  case "$answer" in
    y|Y|yes|YES) brew install tesseract-lang; verify_tesseract "$tesseract_path" ;;
    *) echo "No changes made. Run 'brew install tesseract-lang', then run this script again."; exit 1 ;;
  esac
fi
