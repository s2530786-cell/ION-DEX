# twitter-scraper.ps1 — 抓取大V推文 → JSON
# 数据源: syndication.twitter.com (Twitter 官方公共 API)
# 用法: powershell -File scripts/twitter-scraper.ps1
# 输出: frontend/public/twitter-feeds.json

$ErrorActionPreference = "Continue"
$env:HTTP_PROXY = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"

$OUT = "D:\openclaw-tools\ion-dex-nuke\frontend\public\twitter-feeds.json"
$STATE = "D:\openclaw-tools\ion-dex-nuke\cache\twitter-state.json"

# ===================== 目标账号 =====================
$WATCHLIST = @(
    # S 级 — 核心影响者
    @{id="elonmusk";      name="Elon Musk";        tier="S"; tags=@("tech","crypto","macro")},
    @{id="cz_binance";    name="CZ Binance";        tier="S"; tags=@("exchange","bnb")},
    @{id="VitalikButerin"; name="Vitalik Buterin";  tier="S"; tags=@("eth","l1","thought")},
    @{id="aeyakovenko";   name="Anatoly (Solana)";  tier="S"; tags=@("sol","l1")},
    @{id="realDonaldTrump"; name="Donald Trump";    tier="S"; tags=@("macro","regulation")},
    # A 级 — ION+DeFi
    @{id="ice_blockchain"; name="ICE Blockchain";   tier="A"; tags=@("ion","ecosystem")},
    @{id="Uniswap";       name="Uniswap";           tier="A"; tags=@("defi","dex")},
    @{id="PancakeSwap";   name="PancakeSwap";       tier="A"; tags=@("defi","bsc")},
    @{id="haydenzadams";  name="Hayden Adams";      tier="A"; tags=@("defi","uni")},
    @{id="SBF_FTX";       name="SBF";               tier="A"; tags=@("exchange","drama")},
    # B 级 — 新闻/KOL
    @{id="WatcherGuru";   name="WatcherGuru";       tier="B"; tags=@("news","alert")},
    @{id="WuBlockchain";  name="Wu Blockchain";     tier="B"; tags=@("news","asia")},
    @{id="CoinDesk";      name="CoinDesk";          tier="B"; tags=@("news","media")},
    # C 级 — 项目方
    @{id="LayerZero_Labs"; name="LayerZero";        tier="C"; tags=@("bridge","infra")},
    @{id="wormhole";      name="Wormhole";          tier="C"; tags=@("bridge","infra")}
)

# ===================== 情绪关键词 =====================
$BULLISH = @("bullish","moon","pump","rally","surge","partnership","launch","listing","adoption",
    "breakthrough","upgrade","buy","long","approve","etf","institutional","accumulat",
    "halving","announc","integration","mainnet","airdrop","grant","record","soar",
    "spike","outperform","beat","profit","growth","expansion","milestone","soon","incoming")
$BEARISH = @("bearish","dump","crash","hack","exploit","ban","regulation","lawsuit","sec",
    "crackdown","delist","sell-off","short","scam","rug","ponzi","investigation",
    "freeze","sanction","liquidat","default","bankrupt","depeg","plummet","plunge",
    "decline","fear","uncertainty","volatility","risk","warning","sell","drop",
    "fall","loss","bear","correction")

# ===================== 加载状态 =====================
$state = @{}
if (Test-Path $STATE) {
    try { $state = Get-Content $STATE -Raw | ConvertFrom-Json -AsHashtable } catch {}
}

# ===================== 抓推文 =====================
function Get-Tweets($accountId) {
    $url = "https://syndication.twitter.com/srv/timeline-profile/screen-name/$accountId"
    try {
        $r = Invoke-WebRequest -Uri $url -TimeoutSec 20 -UseBasicParsing
        $html = $r.Content

        # 方法1: 找 data-tweet-id + 临近 text
        $tweets = @()
        $tweetIdPattern = 'data-tweet-id="(\d+)"'
        $matches = [regex]::Matches($html, $tweetIdPattern)
        
        # 找所有 tweet text
        $textPattern = '<span[^>]*>([^<]+)</span>'
        $textMatches = [regex]::Matches($html, $textPattern)
        
        # 简单策略: 收集所有 >= 20 字符的 span 文本作为潜在推文
        $potentialTweets = @()
        foreach ($m in $textMatches) {
            $t = $m.Groups[1].Value.Trim()
            if ($t.Length -ge 20 -and $t -notmatch '^(Skip|Log|Sign|Create|Home|Explore|Notifications|Messages|Bookmarks|Profile|Settings|More|Verified|Follow|Following|View|Search|Trends|Terms|Privacy|Cookie|Help|About|Status|Loading)') {
                $potentialTweets += @{ text = $t; index = $m.Index }
            }
        }
        
        # 按 data-tweet-id 分组
        $count = 0
        foreach ($tidMatch in $matches) {
            if ($count -ge 3) { break }
            $tid = $tidMatch.Groups[1].Value
            $pos = $tidMatch.Index
            
            # 找离这个 tweet-id 最近的文本 (50 char 差距内)
            $best = $null
            foreach ($pt in $potentialTweets) {
                $dist = [Math]::Abs($pt.index - $pos)
                if ($dist -lt 800) {
                    if (-not $best -or $dist -lt $best.dist) {
                        $best = @{ text = $pt.text; dist = $dist }
                    }
                }
            }
            
            if ($best -and $best.text.Length -ge 15) {
                $tweets += @{
                    id = $tid
                    text = $best.text.Substring(0, [Math]::Min(300, $best.text.Length))
                }
                $count++
            }
        }
        
        return $tweets
    } catch {
        return @()
    }
}

# ===================== AI 情绪分析 =====================
function Get-Sentiment($text) {
    $t = $text.ToLower()
    $bull = 0; $bear = 0
    foreach ($w in $BULLISH) { if ($t.Contains($w)) { $bull++ } }
    foreach ($w in $BEARISH) { if ($t.Contains($w)) { $bear++ } }
    
    $total = $bull + $bear
    if ($total -eq 0) { return @{ sentiment="neutral"; confidence=50; reason="No signal words" } }
    
    $ratio = ($bull - $bear) / $total
    $conf = [Math]::Min(95, 50 + $total * 8)
    
    if ($ratio -gt 0.3) { return @{ sentiment="bullish"; confidence=$conf; reason="Bullish ratio $([math]::Round($bull/$total*100))%" } }
    if ($ratio -lt -0.3) { return @{ sentiment="bearish"; confidence=$conf; reason="Bearish ratio $([math]::Round($bear/$total*100))%" } }
    return @{ sentiment="neutral"; confidence=55; reason="Mixed signals" }
}

# ===================== 主流程 =====================
$signals = @()
$archived = if ($state.ContainsKey("archived")) { $state["archived"] } else { @() }

foreach ($acct in $WATCHLIST) {
    $lastKey = "last_" + $acct.id
    $lastId = if ($state.ContainsKey($lastKey)) { $state[$lastKey] } else { "" }
    
    $tweets = Get-Tweets $acct.id
    if ($tweets.Count -eq 0) { continue }
    
    $newCount = 0
    foreach ($tw in $tweets) {
        if ($tw.id -eq $lastId) { continue }
        
        $ai = Get-Sentiment $tw.text
        $signals += @{
            accountId     = $acct.id
            name          = $acct.name
            tier          = $acct.tier
            tags          = $acct.tags
            tweetId       = $tw.id
            text          = $tw.text
            url           = "https://x.com/$($acct.id)/status/$($tw.id)"
            ai            = $ai
        }
        $newCount++
        
        # 归档旧推文 (保留最近30条)
        $archived += "$($acct.id):$($tw.id):$($tw.text.Substring(0, [Math]::Min(50, $tw.text.Length)))"
        if ($archived.Count -gt 200) { $archived = $archived[-100..-1] }
    }
    
    if ($tweets[0]) {
        $state[$lastKey] = $tweets[0].id
    }
}

$state["archived"] = $archived

# 计算市场情绪
$bullTotal = ($signals | Where-Object { $_.ai.sentiment -eq "bullish" }).Count
$bearTotal = ($signals | Where-Object { $_.ai.sentiment -eq "bearish" }).Count
$total = $signals.Count

$netScore = if ($total -gt 0) { [math]::Round(($bullTotal - $bearTotal) / $total * 100, 1) } else { 0 }

$mood = switch ($netScore) {
    { $_ -gt 30 } { "🟢 Strongly Bullish"; break }
    { $_ -gt 10 } { "🟢 Bullish"; break }
    { $_ -gt -10 } { "⚪ Neutral"; break }
    { $_ -gt -30 } { "🔴 Bearish"; break }
    default { "🔴 Strongly Bearish" }
}

$color = switch ($netScore) {
    { $_ -gt 30 } { "#10b981"; break }
    { $_ -gt 10 } { "#34d399"; break }
    { $_ -gt -10 } { "#94a3b8"; break }
    { $_ -gt -30 } { "#f87171"; break }
    default { "#ef4444" }
}

$output = [ordered]@{
    updated = (Get-Date -Format "o")
    source  = "Twitter via syndication.twitter.com"
    totalAccounts = $WATCHLIST.Count
    activeSignals = $signals.Count
    marketSentiment = [ordered]@{
        netScore      = "$netScore"
        mood          = $mood
        color         = $color
        totalSignals  = $total
        bullCount     = $bullTotal
        bearCount     = $bearTotal
    }
    signals = @($signals | Sort-Object { 
        $tierMap = @{ S=0; A=1; B=2; C=3 }
        $tierMap[$_.tier] 
    })
}

$output | ConvertTo-Json -Depth 6 | Out-File $OUT -Encoding UTF8 -NoNewline
$state | ConvertTo-Json -Depth 3 | Out-File $STATE -Encoding UTF8 -NoNewline

if ($total -gt 0) {
    Write-Host "Twitter: $total signals | $mood ($netScore)"
    Write-Host "  Bullish: $bullTotal | Bearish: $bearTotal"
} else {
    Write-Host "Twitter: No new tweets"
}
Write-Host "Output: $OUT"