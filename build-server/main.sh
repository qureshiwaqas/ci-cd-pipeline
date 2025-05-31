#!/bin/bash

export GIT_REPOSITORY_URL="$GIT_REPOSITORY_URL"

// cloning the repo in this path
git clone "$GIT_REPOSITORY_URL" /home/app/output

exec node script.js
