#!/bin/sh
# Aiutante CT - one-time setup on Linux / macOS (needs python3 >= 3.9, which almost every distro and macOS have).
cd "$(dirname "$0")/../.." || exit 1
exec python3 scripts/setup.py "$@"
