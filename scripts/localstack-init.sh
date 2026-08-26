#!/bin/sh
# Creates the local S3 bucket when LocalStack starts
awslocal s3 mb s3://cloud-todo-dev
awslocal s3api put-bucket-cors --bucket cloud-todo-dev --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000"],
    "MaxAgeSeconds": 3000
  }]
}'
echo "LocalStack S3 bucket ready."
