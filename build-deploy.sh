#!/usr/bin/env bash
# Netlify / Linux용: deploy 폴더 생성 (build-deploy.ps1과 동일 동작)
set -e
root="$(cd "$(dirname "$0")" && pwd)"
out="${root}/deploy"
rm -rf "$out"
mkdir -p "$out"

# 단일 파일
for f in index.html login.html signup.html dashboard.html manifest.json netlify.toml sw.js; do
  [ -f "$root/$f" ] && cp "$root/$f" "$out/"
done

# 폴더 통째로
for d in css icons js; do
  [ -d "$root/$d" ] && cp -R "$root/$d" "$out/"
done

# supabase: migrations 제외
if [ -d "$root/supabase" ]; then
  mkdir -p "$out/supabase"
  for item in "$root/supabase"/*; do
    [ "$(basename "$item")" != "migrations" ] && cp -R "$item" "$out/supabase/"
  done
fi

echo "deploy 폴더 생성 완료: $out"
