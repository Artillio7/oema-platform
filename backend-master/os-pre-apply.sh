#!/bin/bash
set -e

source openshift/utils/log.sh
source openshift/utils/secret_field_value.sh
source openshift/utils/wait_for_object.sh
source openshift/utils/wait_for_object_replicas.sh

export stage=$CI_JOB_STAGE

#JSON Path expression
EXPECTED_REPLICAS_FIELD=".spec.replicas"
STS_CURRENT_FIELD=".status.currentReplicas"
DC_CURRENT_FIELD=".status.availableReplicas"

# Orange MongoDB template creates StatefulSet with this prefix
ORANGE_MONGODB_PREFIX="mon"
# Orange Redis Standalone template creates StatefulSet with this prefix
ORANGE_REDIS_PREFIX="red"

# The suffix to use with resources names ( in case of one namespace for different environnements)
#DEFAULT_SERVICES_ENV=stg
DEFAULT_SERVICES_ENV=${env}
export SERVICES_ENV=${SERVICES_ENV:-${DEFAULT_SERVICES_ENV}}

# The name of MongoDB
DEFAULT_MONGODB=oemadb
export MONGODB=${MARIADB:-${DEFAULT_MONGODB}}

# The name of Redis Standalone service
DEFAULT_REDIS_STANDALONE=oemadb
export REDIS_STANDALONE=${REDIS_STANDALONE:-${DEFAULT_REDIS_STANDALONE}}

# PVC size for MongoDB database data
DEFAULT_MONGODB_PVC_SIZE=10Gi
export MONGODB_PVC_SIZE=${MONGODB_PVC_SIZE:-${DEFAULT_MONGODB_PVC_SIZE}}

# Convert environment name to screaming SCREAMING_SNAKE_CASE
SERVICES_ENV_SSC=$(to_ssc "$SERVICES_ENV")
export SERVICES_ENV_SSC

# Create a MongoDB replicaset
deploy_mongodb_replicaset(){
    printInfo "Create MongoDB replicaset: $MONGODB"

    oc process \
    -p REPLICA_COUNT=1 \
    -p REPLICASET_NAME=$MONGODB \
    -p ENV_NAME=$SERVICES_ENV \
    -p MEMORY_LIMIT=2048Mi \
    -p PV_SIZE=$MONGODB_PVC_SIZE \
    -p MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD} \
    -p MONGO_BACKUP_PASSWORD=${MONGO_BACKUP_PASSWORD} \
    -p MONGO_RESTORE_PASSWORD=${MONGO_RESTORE_PASSWORD} \
    -p MONGO_MONITOR_PASSWORD=${MONGO_MONITOR_PASSWORD} \
    -p MONGO_APP_PASSWORD=${MONGO_PASSWD} \
    -p MONGO_KEYFILE_VALUE=${MONGO_KEYFILE_VALUE} \
    -f openshift/templates/orange-mongodb-openshift-rs.yml | oc apply -f -

    # Wait for MongoDB StatefulSet
    MONGODB_STS_BASE_NAME=${MONGODB}-${SERVICES_ENV}
    wait_for_object_replicas StatefulSet "$ORANGE_MONGODB_PREFIX-${MONGODB_STS_BASE_NAME}" $EXPECTED_REPLICAS_FIELD $STS_CURRENT_FIELD

    printInfo "Orange MongoDB replicaset successfully deployed"

}

# Create a Redis Standalone for Caching info ( provided by Orange )
deploy_redis_standalone(){
  printInfo "Create Redis Standalone (Persistent): $ORANGE_REDIS_PREFIX-${REDIS_STANDALONE}-${SERVICES_ENV}"

  oc process \
  -p SET_NAME=${REDIS_STANDALONE} \
  -p ENV_NAME=${SERVICES_ENV} \
  -p MEMORY_LIMIT=256Mi \
  -p CPU_LIMIT=500m \
  -p OREDISMAXCLIENTS=1024 \
  -p OREDISAOFENABLED=no \
  -p OREDISRDBENABLED=no \
  -p OREDISPASSWORD=${REDIS_PASSWORD} \
  -f openshift/templates/orange-redis-openshift-4.10-standalone-persistent.yml | oc apply -f -

  wait_for_object_replicas sts "$ORANGE_REDIS_PREFIX-${REDIS_STANDALONE}-${SERVICES_ENV}" $EXPECTED_REPLICAS_FIELD $STS_CURRENT_FIELD

  printInfo "Redis Standalone (Persistent) successfully deployed"
}

# Create MongoDB for Backup
deploy_mongodb_backup(){
    printInfo "Create Mongodb for Backup"

    S3_ACCESS_KEY_ID_REF="S3_ACCESS_KEY_ID_$SERVICES_ENV_SSC"
    S3_BUCKET_REF="S3_BUCKET_$SERVICES_ENV_SSC"
    S3_SECRET_ACCESS_KEY_REF="S3_SECRET_ACCESS_KEY_$SERVICES_ENV_SSC"

    oc process \
    -p REPLICASET_NAME=$MONGODB \
    -p ENV_NAME=$SERVICES_ENV \
    -p PV_SIZE=20Gi \
    -p MGOB_NOCONF=false \
    -p MGOB_SCHEDULER_CRON="0 2 * * *" \
    -p MGOB_SCHEDULER_RETENTION=2 \
    -p MGOB_SCHEDULER_TIMEOUT=600 \
    -p MGOB_TARGET_HOSTNAME="$ORANGE_MONGODB_PREFIX-${MONGODB_STS_BASE_NAME}" \
    -p MGOB_TARGET_BACKUP_PASSWORD=${MONGO_BACKUP_PASSWORD} \
    -p MGOB_TARGET_PARAMS="--authenticationDatabase admin --oplog" \
    -p MGOB_SMTP_HOST=${SMTP_HOST} \
    -p MGOB_SMTP_USERNAME=${SMTP_AUTH_USER} \
    -p MGOB_SMTP_PASSWORD=${SMTP_AUTH_PASSWORD} \
    -p MGOB_SMTP_FROM="noreply.oemabackup@orange.com" \
    -p MGOB_SMTP_TO="sandrine.lovisa@orange.com,girija.saint-ange@orange.com,patrick.truong@orange.com" \
    -p MGOB_HTTP_PROXY='http://cs.pr-proxy.service.sd.diod.tech:3128/' \
    -p MGOB_HTTPS_PROXY='http://cs.pr-proxy.service.sd.diod.tech:3128/' \
    -p MGOB_S3_URL=${S3_URL} \
    -p MGOB_S3_BUCKET=${!S3_BUCKET_REF} \
    -p MGOB_S3_ACCESSKEY=${!S3_ACCESS_KEY_ID_REF} \
    -p MGOB_S3_SECRETKEY=${!S3_SECRET_ACCESS_KEY_REF} \
    -p MGOB_S3_API="S3v4" \
    -f openshift/templates/orange-mongodb-backup-openshift.yml | oc apply -f -

}

create_configmap_url(){
    printInfo "Create Url configMap : "
    if ! oc get configmaps/${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-url > /dev/null 2>&1 ; then
        printInfo "ConfigMap : ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-url don't exist > will create it"
    else
        printInfo "ConfigMap : ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-url already exist > delete it and recreate it"
        oc delete configmaps ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-url
        printInfo "ConfigMap : ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-url deleted"
    fi

    if [ "$env" == "production" ]; then
      URL=${FRONTEND_PUBLIC_NAME}
    fi
    if [ "$env" == "staging" ]; then
      URL=${FRONTEND_STAGING_URL}
    fi
    if [ "$env" == "review" ]; then
      URL=${FRONTEND_REVIEW_URL}
    fi

    oc create configmap ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-url \
    --from-literal=FRONTEND_BASEURL=${URL}

    printInfo "URL ConfigMap successfully created"
}

create_configmap_s3(){
    printInfo "Create S3 configMap : "
    if ! oc get configmaps/${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-s3 > /dev/null 2>&1 ; then
        printInfo "ConfigMap : ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-s3 don't exist > will create it"
    else
        printInfo "ConfigMap : ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-s3 already exist > delete it and recreate it"
        oc delete configmaps ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-s3
        printInfo "ConfigMap : ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-s3 deleted"
    fi

    S3_ACCESS_KEY_ID_REF="S3_ACCESS_KEY_ID_$SERVICES_ENV_SSC"
    S3_BUCKET_REF="S3_BUCKET_$SERVICES_ENV_SSC"
    S3_SECRET_ACCESS_KEY_REF="S3_SECRET_ACCESS_KEY_$SERVICES_ENV_SSC"

    oc create configmap ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-s3 \
    --from-literal=S3_ACCESS_KEY_ID=${!S3_ACCESS_KEY_ID_REF} \
    --from-literal=S3_SECRET_ACCESS_KEY=${!S3_SECRET_ACCESS_KEY_REF} \
    --from-literal=S3_BUCKET=${!S3_BUCKET_REF} \
    --from-literal=S3_URL=${S3_URL}

    printInfo "S3 ConfigMap successfully created"
}

create_configmap_env(){
    printInfo "Create S3 configMap : "
    if ! oc get configmaps/${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-env > /dev/null 2>&1 ; then
        printInfo "ConfigMap : ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-env don't exist > will create it"
    else
        printInfo "ConfigMap : ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-env already exist > delete it and recreate it"
        oc delete configmaps ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-env
        printInfo "ConfigMap : ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-env deleted"
    fi

    oc create configmap ${OS_BASE_APP_NAME}-${SERVICES_ENV}-config-env \
    --from-literal=SOFTWARE=SoftwareApp \
    --from-literal=FUTURE_NETWORKS=NofApp \
    --from-literal=SECURITY=SecurityApp \
    --from-literal=SOLUTIONS_CONTENT_SERVICES=SolutionsContSrvApp \
    --from-literal=NETWORK_OPERATIONS=NetworkOpsApp \
    --from-literal=COMMUNICATION_SERVICES=CommSrvApp \
    --from-literal=ENERGY_ENVIRONMENT=EngEnvApp \
    --from-literal=BIG_DATA_AI=BigDataAIApp \
    --from-literal=EXPERTS_DTSI=SeniorDevDsiApp \
    --from-literal=DATA_UP=DataUpApp

    printInfo "S3 ConfigMap successfully created"
}

create_secret_orange_connect(){
  printInfo "Create Orange connect Secrets for ${SERVICES_ENV}: "
  if oc get secret/${OS_BASE_APP_NAME}-${SERVICES_ENV}-secret-orange-connect 2> /dev/null
  then
      printInfo "secrets : ${OS_BASE_APP_NAME}-${SERVICES_ENV}-secret-orange-connect already exist > delete it and recreate it"
      oc delete secret ${OS_BASE_APP_NAME}-${SERVICES_ENV}-secret-orange-connect
      printInfo "secrets : ${OS_BASE_APP_NAME}-${SERVICES_ENV}-secret-orange-connect deleted"
  fi

  ORANGE_CONNECT_CLIENT_ID_REF="ORANGE_CONNECT_CLIENT_ID_$SERVICES_ENV_SSC"
  ORANGE_CONNECT_CLIENT_SECRET_REF="ORANGE_CONNECT_CLIENT_SECRET_$SERVICES_ENV_SSC"

  oc create secret generic ${OS_BASE_APP_NAME}-${SERVICES_ENV}-secret-orange-connect\
    --from-literal=ORANGE_CONNECT_CLIENT_ID=${!ORANGE_CONNECT_CLIENT_ID_REF} \
    --from-literal=ORANGE_CONNECT_CLIENT_SECRET=${!ORANGE_CONNECT_CLIENT_SECRET_REF}

  printInfo "Orange connect secret successfully created"
  oc label secret ${OS_BASE_APP_NAME}-${SERVICES_ENV}-secret-orange-connect app="$appname"
}

printInfo "Start services deployment"
printInfo "Stage: ${stage}"
printInfo "Env: ${env}"
create_configmap_url
create_configmap_s3
create_configmap_env
create_secret_orange_connect
#deploy_mongodb_replicaset
deploy_redis_standalone
#deploy_mongodb_backup
printInfo "Services deployment ended"
