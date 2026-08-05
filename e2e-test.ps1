$ErrorActionPreference = "Continue"
$base = "http://localhost:3001/api"
$token = $null

function Assert($cond, $msg) {
  if ($cond) { Write-Host "PASS: $msg" -ForegroundColor Green }
  else { Write-Host "FAIL: $msg" -ForegroundColor Red }
}

# 1. Register test user
Write-Host "`n=== AUTH ===" -ForegroundColor Cyan
$email = "e2e_$(Get-Random)@jamit.app"
$regBody = @{email=$email;password="password123";displayName="E2E Tester"} | ConvertTo-Json
$reg = Invoke-WebRequest -Uri "$base/auth/register" -Method Post -ContentType "application/json" -Body $regBody -UseBasicParsing
$token = ($reg.Content | ConvertFrom-Json).accessToken
Assert ($null -ne $token) "Register user & obtain token"
if (-not $token) { Write-Host "No token, aborting" -ForegroundColor Red; exit 1 }
$headers = @{ Authorization = "Bearer $token" }

# 2. Upload duplicate-filename files via curl.exe
Write-Host "`n=== UPLOAD (duplicate filename) ===" -ForegroundColor Cyan
$src = Get-ChildItem "backend\uploads\*.mp3" | Select-Object -First 1
Assert ($null -ne $src) "Found source mp3 to upload"
if ($src) {
  # Upload 1
  $out1 = curl.exe -s -X POST "$base/songs/upload" -H "Authorization: Bearer $token" -F "file=@$($src.FullName)" -F "title=dup_song"
  $song1 = $out1 | ConvertFrom-Json
  Assert ($null -ne $song1._id) "Upload 1 created (id=$($song1._id))"
  Assert ($song1.originalName -eq $src.Name) "Upload 1 originalName stored = $($song1.originalName)"

  # Upload 2 (same original filename)
  $out2 = curl.exe -s -X POST "$base/songs/upload" -H "Authorization: Bearer $token" -F "file=@$($src.FullName)" -F "title=dup_song"
  $song2 = $out2 | ConvertFrom-Json
  Assert ($null -ne $song2._id) "Upload 2 (same original filename) created"
  Assert ($song1._id -ne $song2._id) "Two records have distinct _ids (no duplicate conflict)"
  Assert ($song1.filePath -ne $song2.filePath) "Two records have distinct storage filePaths"
}

# 3. List my library
Write-Host "`n=== LIBRARY ===" -ForegroundColor Cyan
$list = Invoke-WebRequest -Uri "$base/songs?mine=true" -Method Get -Headers $headers -UseBasicParsing
$songs = @($list.Content | ConvertFrom-Json)
Assert ($songs.Count -gt 0) "Library returns songs (mine=true) count=$($songs.Count)"

# 4. Trim
Write-Host "`n=== TRIM ===" -ForegroundColor Cyan
$trimSong = $songs | Select-Object -First 1
try {
  $trim = Invoke-WebRequest -Uri "$base/songs/$($trimSong._id)/trim" -Method Post -Headers $headers -ContentType "application/json" -Body (@{startTime=3;endTime=12} | ConvertTo-Json) -UseBasicParsing
  $trimRes = $trim.Content | ConvertFrom-Json
  Assert ($null -ne $trimRes._id) "Trim created clip doc"
  Assert ($trimRes.sourceType -eq 'trim') "Trim clip has sourceType=trim"
  Assert (Test-Path $trimRes.filePath) "Trim output file exists: $($trimRes.filePath)"
  # verify stream is playable
  try {
    $stream = Invoke-WebRequest -Uri "$base/songs/$($trimRes._id)/stream" -Method Get -UseBasicParsing -TimeoutSec 10
    Assert ($stream.StatusCode -eq 200) "Trim output streams (HTTP 200)"
  } catch { Write-Host "FAIL: trim stream - $($_.Exception.Message)" -ForegroundColor Red }
} catch {
  Write-Host "Trim failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Merge
Write-Host "`n=== MERGE ===" -ForegroundColor Cyan
if ($songs.Count -ge 2) {
  $ids = @( $songs[0]._id, $songs[1]._id )
  try {
    $merge = Invoke-WebRequest -Uri "$base/songs/merge" -Method Post -Headers $headers -ContentType "application/json" -Body (@{songIds=$ids} | ConvertTo-Json) -UseBasicParsing
    $mergeRes = $merge.Content | ConvertFrom-Json
    Assert ($null -ne $mergeRes._id) "Merge created clip doc"
    Assert ($mergeRes.sourceType -eq 'merged') "Merge clip has sourceType=merged"
    Assert (Test-Path $mergeRes.filePath) "Merge output file exists: $($mergeRes.filePath)"
    try {
      $stream = Invoke-WebRequest -Uri "$base/songs/$($mergeRes._id)/stream" -Method Get -UseBasicParsing -TimeoutSec 10
      Assert ($stream.StatusCode -eq 200) "Merge output streams (HTTP 200)"
    } catch { Write-Host "FAIL: merge stream - $($_.Exception.Message)" -ForegroundColor Red }
  } catch {
    Write-Host "Merge failed: $($_.Exception.Message)" -ForegroundColor Red
  }
} else { Write-Host "SKIP merge: need >=2 songs" -ForegroundColor Yellow }

# 6. Invalid operations
Write-Host "`n=== INVALID OPS ===" -ForegroundColor Cyan
# bad trim range (end <= start) -> 400
try {
  Invoke-WebRequest -Uri "$base/songs/$($trimSong._id)/trim" -Method Post -Headers $headers -ContentType "application/json" -Body (@{startTime=10;endTime=5} | ConvertTo-Json) -UseBasicParsing | Out-Null
  Write-Host "FAIL: invalid trim range accepted" -ForegroundColor Red
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Write-Host "PASS: invalid trim rejected with HTTP $code" -ForegroundColor Green
}
# merge with 1 song -> 400
try {
  Invoke-WebRequest -Uri "$base/songs/merge" -Method Post -Headers $headers -ContentType "application/json" -Body (@{songIds=@($trimSong._id)} | ConvertTo-Json) -UseBasicParsing | Out-Null
  Write-Host "FAIL: single-song merge accepted" -ForegroundColor Red
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Write-Host "PASS: single-song merge rejected with HTTP $code" -ForegroundColor Green
}
# missing song trim -> 404
try {
  Invoke-WebRequest -Uri "$base/songs/000000000000000000000000/trim" -Method Post -Headers $headers -ContentType "application/json" -Body (@{startTime=1;endTime=5} | ConvertTo-Json) -UseBasicParsing | Out-Null
  Write-Host "FAIL: nonexistent song trim accepted" -ForegroundColor Red
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Write-Host "PASS: nonexistent song trim -> HTTP $code" -ForegroundColor Green
}

Write-Host "`n=== DONE ===" -ForegroundColor Cyan
