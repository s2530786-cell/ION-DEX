# Test Zhipu glm-5v-turbo (vision). API key via env only — never commit keys.
# Usage:
#   $env:ZHIPU_API_KEY = "your-key"
#   .\scripts\test-zhipu-vision.ps1

param(
  [string]$Model = "glm-5v-turbo",
  [string]$ImageUrl = "https://cloudcovert-1305175928.cos.ap-guangzhou.myqcloud.com/%E5%9B%BE%E7%89%87grounding.PNG",
  [string]$Prompt = "Where is the second bottle of beer from the right on the table? Provide coordinates in [[xmin,ymin,xmax,ymax]] format"
)

if (-not $env:ZHIPU_API_KEY) {
  Write-Error "Set ZHIPU_API_KEY first. Example: `$env:ZHIPU_API_KEY = 'your-key'"
  exit 1
}

$payload = @{
  model    = $Model
  messages = @(
    @{
      role    = "user"
      content = @(
        @{ type = "image_url"; image_url = @{ url = $ImageUrl } }
        @{ type = "text"; text = $Prompt }
      )
    }
  )
  thinking = @{ type = "enabled" }
} | ConvertTo-Json -Depth 8

try {
  $resp = Invoke-RestMethod `
    -Uri "https://open.bigmodel.cn/api/paas/v4/chat/completions" `
    -Method POST `
    -Headers @{
      Authorization  = "Bearer $env:ZHIPU_API_KEY"
      "Content-Type" = "application/json"
    } `
    -Body $payload `
    -TimeoutSec 120
  $resp | ConvertTo-Json -Depth 10
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
  $body = $reader.ReadToEnd()
  Write-Error "HTTP $status : $body"
  exit 1
}
