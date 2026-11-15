#!/bin/bash
# Create (or rotate) the MCP smoke API key on a deployed instance and drop the plaintext in
# /tmp/c2i-smoke-key. Never prints the secret.
# Usage (on 192.168.1.45): bash scripts/mcp-key.sh [repo-dir]
set -euo pipefail
set -a
. "${1:-$HOME/code2img/code2img}/.env"
set +a

user_id=$(psql -tA "$DATABASE_URL" -c 'select id from "user" order by created_at limit 1')
prefix="c2i_live_$(openssl rand -hex 4)"
secret=$(openssl rand -base64 24 | tr '+/' '-_' | tr -d '=\n')
key="${prefix}_${secret}"
hash=$(printf '%s' "$key" | openssl dgst -sha256 -hex | awk '{print $2}')

printf '%s' "$key" > /tmp/c2i-smoke-key
chmod 600 /tmp/c2i-smoke-key

psql -q "$DATABASE_URL" -c "insert into api_key (id,user_id,prefix,key_hash,scopes) values ('smoke_mcp_key','$user_id','$prefix','$hash','[\"read\",\"write\"]'::jsonb) on conflict (id) do update set prefix=excluded.prefix, key_hash=excluded.key_hash, revoked_at=null"
echo "key ready (prefix $prefix) for user $user_id"