param(
  [string]$UsersCsv = "C:\Users\cacpa\Downloads\users.csv",
  [string]$ProductsCsv = "C:\Users\cacpa\Downloads\products.csv",
  [string]$OrdersCsv = "C:\Users\cacpa\Downloads\orders.csv",
  [string]$DeliveriesCsv = "C:\Users\cacpa\Downloads\deliveries.csv",
  [int]$BatchSize = 200
)

$ErrorActionPreference = "Stop"

function Read-EnvValue {
  param(
    [string]$Path,
    [string]$Key
  )

  $line = Select-String -Path $Path -Pattern "^$Key=" | Select-Object -First 1
  if (-not $line) {
    throw "Missing $Key in $Path"
  }

  $value = $line.Line.Split("=", 2)[1].Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    return $value.Trim('"')
  }
  return $value
}

function Split-ToArray {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return @()
  }

  return @(
    $Value -split "\s*,\s*" |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ }
  )
}

function Get-DeterministicMap {
  param(
    [object[]]$SourceValues,
    [int]$BaseValue
  )

  $map = @{}
  $index = 0
  foreach ($value in ($SourceValues | Sort-Object -Unique)) {
    $index += 1
    $map[[string]$value] = $BaseValue + $index
  }
  return $map
}

function Get-LastByKey {
  param(
    [object[]]$Rows,
    [string]$Key
  )

  $ordered = [ordered]@{}
  foreach ($row in $Rows) {
    $ordered[[string]$row.$Key] = $row
  }
  return @($ordered.Values)
}

function Invoke-SupabaseRequest {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [object]$Body = $null
  )

  if ($null -eq $Body) {
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers
  }

  $json = $Body | ConvertTo-Json -Depth 8 -Compress
  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers -Body $json -ContentType "application/json"
}

function Invoke-SupabaseUpsertBatches {
  param(
    [string]$Table,
    [string]$ConflictColumn,
    [object[]]$Rows,
    [hashtable]$Headers,
    [string]$BaseUrl,
    [int]$BatchSize
  )

  if (-not $Rows -or $Rows.Count -eq 0) {
    Write-Host "Skipping ${Table}: no rows to import."
    return
  }

  $headersWithResolution = @{}
  foreach ($key in $Headers.Keys) {
    $headersWithResolution[$key] = $Headers[$key]
  }
  $headersWithResolution["Prefer"] = "resolution=merge-duplicates"

  for ($offset = 0; $offset -lt $Rows.Count; $offset += $BatchSize) {
    $count = [Math]::Min($BatchSize, $Rows.Count - $offset)
    $batch = @($Rows[$offset..($offset + $count - 1)])
    $url = "$BaseUrl/$Table?on_conflict=$ConflictColumn"
    Invoke-SupabaseRequest -Method "POST" -Url $url -Headers $headersWithResolution -Body $batch | Out-Null
    Write-Host ("Imported {0} rows into zippo.{1} ({2}/{3})" -f $count, $Table, ($offset + $count), $Rows.Count)
  }
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backendEnv = Join-Path $repoRoot "backend\.env"

$serviceRoleKey = Read-EnvValue -Path $backendEnv -Key "SUPABASE_SERVICE_ROLE_KEY"
$supabaseUrl = Read-EnvValue -Path $backendEnv -Key "SUPABASE_URL"
$restBaseUrl = "$supabaseUrl/rest/v1"

$headers = @{
  "apikey"          = $serviceRoleKey
  "Authorization"   = "Bearer $serviceRoleKey"
  "Accept-Profile"  = "zippo"
  "Content-Profile" = "zippo"
}

$usersCsvRows = Get-LastByKey -Rows @(Import-Csv $UsersCsv) -Key "user_id"
$productsCsvRows = Get-LastByKey -Rows @(Import-Csv $ProductsCsv) -Key "product_id"
$ordersCsvRows = Get-LastByKey -Rows @(Import-Csv $OrdersCsv) -Key "order_id"
$deliveriesCsvRows = Get-LastByKey -Rows @(Import-Csv $DeliveriesCsv) -Key "delivery_id"

$userIdMap = Get-DeterministicMap -SourceValues ($usersCsvRows | Select-Object -ExpandProperty user_id) -BaseValue 200000000
$productIdMap = Get-DeterministicMap -SourceValues ($productsCsvRows | Select-Object -ExpandProperty product_id) -BaseValue 300000000
$orderIdMap = Get-DeterministicMap -SourceValues ($ordersCsvRows | Select-Object -ExpandProperty order_id) -BaseValue 400000000
$deliveryIdMap = Get-DeterministicMap -SourceValues ($deliveriesCsvRows | Select-Object -ExpandProperty delivery_id) -BaseValue 500000000

$riderCodeMap = @{}
foreach ($riderCode in ($deliveriesCsvRows | Select-Object -ExpandProperty rider_id | Sort-Object -Unique)) {
  $numericSuffix = [int]([regex]::Match([string]$riderCode, "\d+").Value)
  $riderCodeMap[[string]$riderCode] = 600000000 + $numericSuffix
}

$userRows = foreach ($row in $usersCsvRows) {
  @{
    user_id = $userIdMap[[string]$row.user_id]
    full_name = [string]$row.full_name
    age_group = [string]$row.age_group
    gender = [string]$row.gender
    barangay = [string]$row.barangay
    budget_range = ([string]$row.budget_range).ToLowerInvariant()
    preferred_occasions = @(Split-ToArray -Value ([string]$row.preferred_occasions))
    lat = [double]$row.lat
    lng = [double]$row.lng
    created_at = [string]$row.created_at
  }
}

$productRows = foreach ($row in $productsCsvRows) {
  $occasionTags = @(Split-ToArray -Value ([string]$row.occasion_tags))
  $recipientTags = @(
    Split-ToArray -Value ([string]$row.recipient_tags) |
      ForEach-Object { $_.ToLowerInvariant() }
  )
  @{
    product_id = $productIdMap[[string]$row.product_id]
    vendor_id = $null
    name = [string]$row.name
    description = $null
    category = ([string]$row.category).ToLowerInvariant()
    price = [math]::Round([decimal]$row.price, 2)
    occasion_tags = $occasionTags
    recipient_tags = $recipientTags
    tags = @()
    delivery_zones = @()
    local_vendor = [System.Convert]::ToBoolean($row.local_vendor)
    avg_rating = [math]::Round([decimal]$row.avg_rating, 1)
    stock = [int]$row.stock
    vendor_name = [string]$row.vendor_name
    popularity_score = 0
    weight_score = [double]$row.weight_score
  }
}

$riderGroups = $deliveriesCsvRows | Group-Object rider_id
$riderRows = foreach ($group in $riderGroups) {
  $latitudes = @($group.Group | ForEach-Object { [double]$_.lat })
  $longitudes = @($group.Group | ForEach-Object { [double]$_.lng })
  $barangay = ($group.Group | Group-Object barangay | Sort-Object Count -Descending | Select-Object -First 1).Name

  @{
    rider_id = $riderCodeMap[[string]$group.Name]
    rider_name = "Rider $($group.Name)"
    barangay = [string]$barangay
    current_lat = [math]::Round((($latitudes | Measure-Object -Average).Average), 5)
    current_lng = [math]::Round((($longitudes | Measure-Object -Average).Average), 5)
    capacity = 3
    speed_kmph = 22.0
    average_rating = $null
    available = $true
  }
}

$orderRows = foreach ($row in $ordersCsvRows) {
  @{
    order_id = $orderIdMap[[string]$row.order_id]
    user_id = $userIdMap[[string]$row.user_id]
    product_id = $productIdMap[[string]$row.product_id]
    occasion = [string]$row.occasion
    recipient_type = ([string]$row.recipient_type).ToLowerInvariant()
    rating = [int]$row.rating
    order_date = [string]$row.order_date
    total_price = [math]::Round([decimal]$row.total_price, 2)
    status = ([string]$row.status).ToLowerInvariant()
    priority = 0
    promised_minutes = 60
  }
}

$deliveryRows = foreach ($row in $deliveriesCsvRows) {
  @{
    delivery_id = $deliveryIdMap[[string]$row.delivery_id]
    order_id = $orderIdMap[[string]$row.order_id]
    rider_id = $riderCodeMap[[string]$row.rider_id]
    barangay = [string]$row.barangay
    lat = [double]$row.lat
    lng = [double]$row.lng
    time_slot = [string]$row.time_slot
    distance_km = [math]::Round([decimal]$row.distance_km, 2)
    assigned_at = [string]$row.assigned_at
    status = ([string]$row.status).ToLowerInvariant()
  }
}

Invoke-SupabaseUpsertBatches -Table "users" -ConflictColumn "user_id" -Rows $userRows -Headers $headers -BaseUrl $restBaseUrl -BatchSize $BatchSize
Invoke-SupabaseUpsertBatches -Table "products" -ConflictColumn "product_id" -Rows $productRows -Headers $headers -BaseUrl $restBaseUrl -BatchSize $BatchSize
Invoke-SupabaseUpsertBatches -Table "riders" -ConflictColumn "rider_id" -Rows $riderRows -Headers $headers -BaseUrl $restBaseUrl -BatchSize $BatchSize
Invoke-SupabaseUpsertBatches -Table "orders" -ConflictColumn "order_id" -Rows $orderRows -Headers $headers -BaseUrl $restBaseUrl -BatchSize $BatchSize
Invoke-SupabaseUpsertBatches -Table "deliveries" -ConflictColumn "delivery_id" -Rows $deliveryRows -Headers $headers -BaseUrl $restBaseUrl -BatchSize $BatchSize

Write-Host ""
Write-Host "Import complete."
Write-Host ("users: {0}" -f $userRows.Count)
Write-Host ("products: {0}" -f $productRows.Count)
Write-Host ("riders: {0}" -f $riderRows.Count)
Write-Host ("orders: {0}" -f $orderRows.Count)
Write-Host ("deliveries: {0}" -f $deliveryRows.Count)
