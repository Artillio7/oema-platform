# OEMA (Orange expert management application: back-end)

> This is the back-end for OEMA in Node.js, exposing a  REST API using Express,
Passport-jwt and jsonwebtoken for JWT Authentication, and Mongoose/MongoDB for
persistent storage. Note: Redis is also used for session storage and temporarily
saving users' credentials before account activation.

This README helps you to get started with a working local API server.

## Installation

**Prerequisites:** you need to install Node.js, MongoDB and Redis.

**Node.js dependencies:** git clone and go to the project folder:

    npm install

## Configuration

### Redis

Configure Redis (Debian/Ubuntu `/etc/redis/redis.conf`; Mac `/usr/local/etc/redis.conf`):

For Redis version 6, set the following ACL rule for user/password auth in Redis:

    user admin on +@all ~* >5097773f6365884b0129c7a4a975a287

For Redis version 5, put the following line

    requirepass 5097773f6365884b0129c7a4a975a287

in the `redis.conf` file. (NB: change the `5097773f6365884b0129c7a4a975a287`
value with your Redis password, don't remove the character `>`)

Start the Redis server:

(Debian/Ubuntu)

    sudo systemctl start redis

(Mac)

    brew services start redis

### MongoDB

Start MongoDB

(Debian/Ubuntu)

    sudo systemctl start mongod

(Mac)

    brew services start mongodb-community

Go the directory misc/mongo-init and load all the .js files to init the mongoDB
collections for the Orange Experts communities. Example for the OESW community:

    cd misc/mongo-init
    mongo 127.0.0.1:27017/oemadb insert-software.communities.js

### File .env

    cp env.example .env

Configure the file .env for JWT, MongoDB, Redis, and smtp, etc.

## Start the API server

    node --trace-warnings index.js 

(or you can use `nodemon index.js` intead of `node`).

## Swagger doc

`http://127.0.0.1:4040/docs/`

## Try the api

Use postman to try the API.

![preview postman](https://gitlab.forge.orange-labs.fr/oswe/expert-management/raw/master/back-end/misc/screenshots/screenshot.png)

## Live deployments of the back-end

Staging: [https://oswe-backend-staging.apps.fr01.paas.tech.orange/](https://oswe-backend-staging.apps.fr01.paas.tech.orange/)
Swagger: [https://oswe-backend-staging.apps.fr01.paas.tech.orange/docs](https://oswe-backend-staging.apps.fr01.paas.tech.orange/docs)
Production: [https://oswe-backend-prod.apps.fr01.paas.tech.orange/](https://oswe-backend-prod.apps.fr01.paas.tech.orange/)
Swagger: [https://oswe-backend-prod.apps.fr01.paas.tech.orange/docs](https://oswe-backend-prod.apps.fr01.paas.tech.orange/docs)

Web access in production:
[https://orange-expert-recruitment.apps.fr01.paas.diod.orange.com/orange-experts/](https://orange-expert-recruitment.apps.fr01.paas.diod.orange.com/orange-experts/)

## Contact

* <patrick.truong@orange.com>
