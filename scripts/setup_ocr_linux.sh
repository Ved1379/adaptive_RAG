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
  echo "English language data is missing. Install the eng traineddata package (Debian/Ubuntu: tesseract-ocr-eng)."
  return 2
}

if [ -n "${TESSERACT_CMD:-}" ] && { [ -x "$TESSERACT_CMD" ] || command -v "$TESSERACT_CMD" >/dev/null 2>&1; }; then
  if [ -x "$TESSERACT_CMD" ]; then
    tesseract_path="$TESSERACT_CMD"
  else
    tesseract_path="$(command -v "$TESSERACT_CMD")"
  fi
elif command -v tesseract >/dev/null 2>&1; then
  tesseract_path="$(command -v tesseract)"
else
  tesseract_path=""
fi

if [ -n "$tesseract_path" ]; then
  if verify_tesseract "$tesseract_path"; then exit 0; else verify_status=$?; fi
  if [ "$verify_status" -eq 2 ] && command -v apt-get >/dev/null 2>&1; then
    printf 'Install English language data with apt? This runs sudo and changes system packages (y/N): '
    read -r answer
    case "$answer" in
      y|Y|yes|YES) sudo apt-get install -y tesseract-ocr-eng ;;
      *) echo "No changes made. Install tesseract-ocr-eng, then run this script again."; exit 1 ;;
    esac
    verify_tesseract "$tesseract_path"
    exit $?
  fi
  exit 1
fi

echo "Tesseract was not found. This script will not install anything without your confirmation."
if ! command -v apt-get >/dev/null 2>&1; then
  cat <<'EOF'
No apt-get was found. Install Tesseract and English traineddata with your distribution's package manager.
Examples:
  Fedora: sudo dnf install tesseract tesseract-langpack-eng
  Arch:   sudo pacman -S tesseract tesseract-data-eng
  Alpine: sudo apk add tesseract-ocr tesseract-ocr-data-eng
EOF
  exit 1
fi

printf 'Install Tesseract and English data using apt? This runs sudo and changes system packages (y/N): '
read -r answer
case "$answer" in
  y|Y|yes|YES)
    sudo apt-get update
    sudo apt-get install -y tesseract-ocr tesseract-ocr-eng
    ;;
  *) echo "No changes made. Run 'sudo apt-get install tesseract-ocr tesseract-ocr-eng' when ready."; exit 0 ;;
esac

tesseract_path="$(command -v tesseract || true)"
if [ -z "$tesseract_path" ]; then
  echo "Tesseract was installed but is not on PATH. Start a new shell and run this script again."
  exit 1
fi
verify_tesseract "$tesseract_path"
