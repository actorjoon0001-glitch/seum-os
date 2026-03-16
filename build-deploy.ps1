# Netlify deploy 폴더 생성: 서비스에 필요한 파일만 복사
$root = $PSScriptRoot
$out = Join-Path $root "deploy"

if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $out | Out-Null

# 단일 파일
@("index.html", "login.html", "signup.html", "dashboard.html", "manifest.json", "netlify.toml", "sw.js") | ForEach-Object {
  $f = Join-Path $root $_
  if (Test-Path $f) { Copy-Item $f $out -Force }
}

# 폴더 통째로 (css, icons, js)
@("css", "icons", "js") | ForEach-Object {
  $dir = Join-Path $root $_
  if (Test-Path $dir) {
    $dest = Join-Path $out $_
    Copy-Item $dir $dest -Recurse -Force
  }
}

# supabase: migrations 제외하고 복사
$supaSrc = Join-Path $root "supabase"
$supaDest = Join-Path $out "supabase"
if (Test-Path $supaSrc) {
  New-Item -ItemType Directory -Path $supaDest -Force | Out-Null
  Get-ChildItem $supaSrc -Force | Where-Object { $_.Name -ne "migrations" } | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $supaDest $_.Name) -Recurse -Force
  }
}

Write-Host "deploy 폴더 생성 완료: $out"
