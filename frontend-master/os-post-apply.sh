#!/bin/bash
set -e
source openshift/utils/log.sh

echo "Force rollout deployment to pull new changes"

oc rollout restart deployment/$appname
