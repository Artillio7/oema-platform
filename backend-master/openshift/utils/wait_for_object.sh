#!/bin/bash

set -e

OBJECT_TIMEOUT_SEC=300
POLLING_INTERVAL_SEC=1;

wait_for_object() {
    OBJECT_TYPE=$1
    OBJECT_NAME=$2

    end=$((SECONDS+OBJECT_TIMEOUT_SEC))
    while ! oc get $OBJECT_TYPE/$OBJECT_NAME > /dev/null 2>&1 && [ ${SECONDS} -lt ${end} ] ; do
        timeout_in=$((end-SECONDS))
        printInfo "Waiting for $OBJECT_TYPE : $OBJECT_NAME , timout $timeout_in"
        sleep ${POLLING_INTERVAL_SEC}
    done

    if ! oc get $OBJECT_TYPE/$OBJECT_NAME > /dev/null 2>&1 ; then
        printInfo "Can't find $OBJECT_TYPE : $OBJECT_NAME"
        exit 1
    fi
}
