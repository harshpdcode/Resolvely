Add-Type -AssemblyName System.IO.Compression.FileSystem

$pptxPath = "c:\Users\harsh\OneDrive\Desktop\diya\Resolvely.pptx"
if (-not (Test-Path $pptxPath)) {
    Write-Host "File not found at: $pptxPath"
    exit 1
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($pptxPath)
$slides = $zip.Entries | Where-Object { $_.FullName -like "ppt/slides/slide*.xml" } | Sort-Object { 
    $num = [regex]::Match($_.Name, "\d+").Value
    if ($num) { [int]$num } else { 0 }
}

foreach ($slide in $slides) {
    $stream = $slide.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()

    # Extract all text inside <a:t> tags
    $matches = [regex]::Matches($xml, "<a:t>([^<]*)</a:t>")
    $textParts = @()
    foreach ($m in $matches) {
        $textParts += $m.Groups[1].Value
    }
    $slideText = ($textParts -join " ").Trim()

    Write-Host "========================================"
    Write-Host "SLIDE: $($slide.Name)"
    Write-Host "========================================"
    Write-Host $slideText
    Write-Host ""
}

$zip.Dispose()
