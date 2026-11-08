# ===================================================================
# COMPLETE CODEBASE EXPORTER
# Production-Grade Repository Export Tool
# Reliability > Speed
# ===================================================================

param(
    [string]$Root = ".",
    [string]$OutputDir = ".\AI_EXPORT"
)

$ErrorActionPreference = "Continue"

# -------------------------------------------------------------------
# Create Output Directory
# -------------------------------------------------------------------

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$TreeFile       = Join-Path $OutputDir "PROJECT_STRUCTURE.txt"
$ExportFile     = Join-Path $OutputDir "SOURCE_CODE_EXPORT.txt"
$ReportFile     = Join-Path $OutputDir "INTEGRITY_REPORT.txt"
$UnreadableFile = Join-Path $OutputDir "UNREADABLE_FILES.txt"
$SkippedFile    = Join-Path $OutputDir "SKIPPED_FILES.txt"

# -------------------------------------------------------------------
# Ignore Directories
# -------------------------------------------------------------------

$IgnoredDirs = @(
    ".git",
    "node_modules",
    "dist",
    "build",
    "target",
    "out",
    ".next",
    "coverage",
    ".gradle",
    ".idea",
    ".vscode"
)

# -------------------------------------------------------------------
# Binary Extensions
# -------------------------------------------------------------------

$BinaryExtensions = @(
    ".exe",".dll",".so",".dylib",".bin",
    ".png",".jpg",".jpeg",".gif",".webp",".bmp",".ico",
    ".mp4",".avi",".mov",".mkv",
    ".zip",".rar",".7z",".tar",".gz",
    ".jar",".war",".apk",".aab",
    ".pdf",".woff",".woff2",".ttf",".eot",
    ".mp3",".wav",".ogg"
)

# -------------------------------------------------------------------
# Build Folder Tree
# -------------------------------------------------------------------

"PROJECT STRUCTURE" | Out-File $TreeFile -Encoding utf8

Get-ChildItem $Root -Recurse -Force |
Sort-Object FullName |
ForEach-Object {

    $relative = Resolve-Path $_.FullName -Relative

    $skip = $false

    foreach($dir in $IgnoredDirs)
    {
        if($_.FullName -match "\\$([regex]::Escape($dir))(\\|$)")
        {
            $skip = $true
            break
        }
    }

    if(-not $skip)
    {
        $relative | Out-File $TreeFile -Append -Encoding utf8
    }
}

# -------------------------------------------------------------------
# Discover Files
# -------------------------------------------------------------------

$AllFiles = Get-ChildItem $Root -Recurse -Force -File |
Where-Object {

    foreach($dir in $IgnoredDirs)
    {
        if($_.FullName -match "\\$([regex]::Escape($dir))(\\|$)")
        {
            return $false
        }
    }

    return $true
} |
Sort-Object FullName

# -------------------------------------------------------------------
# Counters
# -------------------------------------------------------------------

$TotalFiles      = 0
$ExportedFiles   = 0
$UnreadableFiles = 0
$SkippedFiles    = 0

"" | Out-File $UnreadableFile
"" | Out-File $SkippedFile

# -------------------------------------------------------------------
# Export Code
# -------------------------------------------------------------------

"" | Out-File $ExportFile -Encoding utf8

foreach($file in $AllFiles)
{
    $TotalFiles++

    $relativePath = Resolve-Path $file.FullName -Relative

    if($BinaryExtensions -contains $file.Extension.ToLower())
    {
        $SkippedFiles++

        $relativePath |
        Out-File $SkippedFile -Append -Encoding utf8

        continue
    }

    try
    {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8 -ErrorAction Stop

        @"
========================================================
FILE: $relativePath
========================================================

$content

========================================================
END FILE: $relativePath
========================================================

"@ | Out-File $ExportFile -Append -Encoding utf8

        $ExportedFiles++
    }
    catch
    {
        $UnreadableFiles++

        "$relativePath :: $($_.Exception.Message)" |
        Out-File $UnreadableFile -Append -Encoding utf8
    }
}

# -------------------------------------------------------------------
# Integrity Report
# -------------------------------------------------------------------

$IntegrityStatus = if($TotalFiles -eq ($ExportedFiles + $SkippedFiles + $UnreadableFiles))
{
    "PASS"
}
else
{
    "FAIL"
}

@"
==================================================
CODEBASE EXPORT INTEGRITY REPORT
==================================================

Repository Root:
$((Resolve-Path $Root).Path)

Total Files Discovered:
$TotalFiles

Files Exported:
$ExportedFiles

Binary Files Skipped:
$SkippedFiles

Unreadable Files:
$UnreadableFiles

Validation Status:
$IntegrityStatus

Expected:
$TotalFiles

Actual:
$(($ExportedFiles + $SkippedFiles + $UnreadableFiles))

Tree File:
$TreeFile

Export File:
$ExportFile

Unreadable List:
$UnreadableFile

Skipped List:
$SkippedFile

==================================================
END REPORT
==================================================
"@ | Out-File $ReportFile -Encoding utf8

Write-Host ""
Write-Host "========================================="
Write-Host "EXPORT COMPLETE"
Write-Host "========================================="
Write-Host "Files Found      : $TotalFiles"
Write-Host "Files Exported   : $ExportedFiles"
Write-Host "Files Skipped    : $SkippedFiles"
Write-Host "Unreadable Files : $UnreadableFiles"
Write-Host "Status           : $IntegrityStatus"
Write-Host "Output Folder    : $OutputDir"
Write-Host "========================================="