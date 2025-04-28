#!/bin/bash

set -e

TIMEOUT_SEC=300
POLLING_INTERVAL_SEC=3

wait_for_object_replicas() {
  OBJECT_TYPE=$1
  OBJECT_NAME=$2
  EXPECTED_FIELD_NAME=$3
  CURRENT_FIELD_NAME=$4
  # For the expected replicas count even when passing `EXPECTED_FIELD_NAME`
  FORCE_EXPECTED_VALUE=$5

  wait_for_object $OBJECT_TYPE $OBJECT_NAME

  if [[ -z "$FORCE_EXPECTED_VALUE" ]]; then
    DESIRED_REPLICA_COUNT=$(oc get $OBJECT_TYPE/$OBJECT_NAME -o=jsonpath='{'"$EXPECTED_FIELD_NAME"'}')
  else
    DESIRED_REPLICA_COUNT=$FORCE_EXPECTED_VALUE
  fi

  CURRENT_REPLICA_COUNT=$(oc get $OBJECT_TYPE/$OBJECT_NAME -o=jsonpath='{'"$CURRENT_FIELD_NAME"'}')

  end=$((SECONDS+TIMEOUT_SEC))

  printInfo "Waiting for ${DESIRED_REPLICA_COUNT} replicas in $OBJECT_NAME $OBJECT_TYPE"

  while [ "${CURRENT_REPLICA_COUNT}" -ne "${DESIRED_REPLICA_COUNT}" ] && [ ${SECONDS} -lt ${end} ]; do
    CURRENT_REPLICA_COUNT=$(oc get $OBJECT_TYPE/$OBJECT_NAME -o=jsonpath='{'"$CURRENT_FIELD_NAME"'}')
    timeout_in=$((end-SECONDS))
    printInfo "Deployment is in progress...(Current replica count=${CURRENT_REPLICA_COUNT}, ${timeout_in} seconds remain)"
    sleep ${POLLING_INTERVAL_SEC}
  done

  if [ "${CURRENT_REPLICA_COUNT}" -ne "${DESIRED_REPLICA_COUNT}"  ]; then
    printError "$OBJECT_TYPE $OBJECT_NAME not fully ready. Aborting."
    exit 1
  elif [ ${SECONDS} -ge ${end} ]; then
    printError "$OBJECT_TYPE timeout. Aborting."
    exit 1
  fi
  printInfo "$OBJECT_TYPE $OBJECT_NAME is ready"
}
