#!/bin/sh
# Verify that the student found the flag file
if [ -f /tmp/.secret_flag ]; then
    echo "The flag file exists. Did you find and submit the flag?"
    exit 0
else
    echo "The flag file seems to be missing. It should be at /tmp/.secret_flag"
    exit 1
fi
