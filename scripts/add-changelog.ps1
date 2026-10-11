param(
    [string]$Agent = "Claude",
    [Parameter(Mandatory = $true)][string]$Message,
    [ValidateSet("Added","Changed","Fixed","Removed","Security","Docs","Decision")][string]$Type = "Added",
    [string]$Phase = "-",
    [string]$Status = "Done",
    [string[]]$Files = @()
)
$now  = [DateTimeOffset]::UtcNow.ToOffset([TimeSpan]::FromHours(3))
$ci   = [Globalization.CultureInfo]::InvariantCulture
$date = $now.ToString("yyyy-MM-dd", $ci)
$time = $now.ToString("HHmmss", $ci)
$day  = $now.ToString("dddd", $ci)

$lines = @("", "## [$date $time] $day | UTC+3 | Agent: $Agent",
           "- **Phase:** $Phase", "- **Type:** $Type", "- **Status:** $Status",
           "- **Summary:** $Message")
if ($Files.Count -gt 0) {
    $lines += "- **Files:**"
    foreach ($f in $Files) { $lines += "  - ``$f``" }
}
$entry  = ($lines -join "`n") + "`n"
$path   = Join-Path $PSScriptRoot "..\CHANGELOG.md"
$marker = "<!-- ENTRIES -->"
$content = [IO.File]::ReadAllText($path)
$content = $content.Replace($marker, $marker + "`n" + $entry)
[IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Logged: [$date $time] $day UTC+3 - $Agent"