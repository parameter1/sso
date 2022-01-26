#!/bin/bash
docker-compose run \
  --rm \
  --entrypoint yarn \
  commands \
  $@
