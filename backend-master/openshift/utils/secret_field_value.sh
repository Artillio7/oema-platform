#!/bin/bash

set -e

secret_field_value() {
    echo $(oc get secret/$1 -o jsonpath="{.data.$2}" | base64 --decode)
}
