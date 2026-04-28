#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

INPUT="${SCRIPT_DIR}/boxmaker.jscad"

for i in 1 2 3 4 5 6 7; do
  OUTPUT="${SCRIPT_DIR}/figure${i}.stl"
  echo "Exporting figure${i}.stl"
  npx jscad "${INPUT}" --objectIndex "${i}" -o "${OUTPUT}"
done

echo "Done. Exported 7 STL files to ${SCRIPT_DIR}"
