#!/bin/bash

set -e

printInfo() {
  echo -e "\033[32m[INFO]: ${1}\033[0m"
}

printError() {
  echo -e "\033[31m[ERROR]: ${1}\033[0m"
}

to_ssc() {
  echo "$1" | tr '[:lower:]' '[:upper:]' | tr '[:punct:]' '_'
}
