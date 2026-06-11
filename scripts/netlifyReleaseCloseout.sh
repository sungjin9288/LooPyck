#!/usr/bin/env bash
set -euo pipefail

npm run ntl:uat
npm run ntl:quick-pass:runtime-ready
npm run ntl:release-report
