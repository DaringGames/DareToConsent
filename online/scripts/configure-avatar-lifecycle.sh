#!/usr/bin/env bash
set -euo pipefail

# S3 lifecycle expiration has day-level granularity, so the app also runs a
# 30-minute sweeper that deletes selfies older than 8 hours. This lifecycle
# rule is a fallback for orphaned objects if the app is offline.

AWS_PROFILE="${AWS_PROFILE:-worst-prod}"
AWS_REGION="${AWS_REGION:-us-west-2}"
BUCKET="${DTC_AVATAR_BUCKET:-${S3_BUCKET:-worstinworld-assets-prod}}"
PREFIX="${DTC_AVATAR_PREFIX:-img/dtc-selfies}"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

cat > "$tmp" <<JSON
{
  "Rules": [
    {
      "ID": "expire-daretoconsent-selfies",
      "Status": "Enabled",
      "Filter": { "Prefix": "${PREFIX%/}/" },
      "Expiration": { "Days": 1 },
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 1 }
    }
  ]
}
JSON

aws --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET" \
  --lifecycle-configuration "file://$tmp"

echo "Configured lifecycle fallback for s3://${BUCKET}/${PREFIX%/}/"
