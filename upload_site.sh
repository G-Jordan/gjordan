#!/data/data/com.termux/files/usr/bin/bash
set -e

MSG="${*:-Site update $(date +'%Y-%m-%d %H:%M:%S')}"

# Require being inside an existing repo (clear message if not)
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  cat <<'EOM'
[error] This folder is not a git repo yet.
Run these ONCE, then re-run this script:

  cd ~/storage/shared/"Gjordan music website"
  git init -b main || git init
  git branch -M main
  git remote add origin git@github.com:G-Jordan/gjordan.git
  git add -A
  git commit -m "Initial commit"
  git push -u origin main

EOM
  exit 1
fi

# Force remote to SSH (non-fatal if already set)
git remote set-url origin git@github.com:G-Jordan/gjordan.git 2>/dev/null || true

# Add/commit/push
git add -A
if ! git diff --cached --quiet; then
  git commit -m "$MSG"
  git push -u origin main
  echo "[ok] Pushed: $MSG"
else
  echo "[ok] No changes to commit."
fi
