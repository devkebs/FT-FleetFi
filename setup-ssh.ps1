# Setup SSH for GitHub on Windows
$ErrorActionPreference = 'Stop'

$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) {
  New-Item -ItemType Directory -Path $sshDir | Out-Null
}

# Generate key if it doesn't exist
$keyPath = Join-Path $sshDir 'id_ed25519'
if (-not (Test-Path $keyPath)) {
  Write-Host 'Generating new ed25519 SSH key...'
  $pass = ""
  ssh-keygen -t ed25519 -C "devkebs@users.noreply.github.com" -f $keyPath -N $pass | Out-Null
  Write-Host 'SSH key generated.'
} else {
  Write-Host 'SSH key already exists, skipping generation.'
}

# Ensure ssh-agent is running
try {
  $svc = Get-Service -Name 'ssh-agent' -ErrorAction Stop
  if ($svc.Status -ne 'Running') {
    Set-Service -Name 'ssh-agent' -StartupType Automatic
    Start-Service -Name 'ssh-agent'
    Write-Host 'ssh-agent started.'
  } else {
    Write-Host 'ssh-agent already running.'
  }
} catch {
  Write-Warning 'ssh-agent service not found. Ensure OpenSSH is installed from Windows Optional Features.'
}

# Add key to agent
try {
  & ssh-add $keyPath | Out-Null
  Write-Host 'SSH key added to agent.'
} catch {
  Write-Warning "Failed to add key to agent: $($_.Exception.Message)"
}

# Copy public key to clipboard
$pubKeyPath = "$keyPath.pub"
if (Test-Path $pubKeyPath) {
  Get-Content $pubKeyPath | Set-Clipboard
  Write-Host 'Public key copied to clipboard. Add it to GitHub: https://github.com/settings/keys'
  Write-Host 'Preview of your public key:'
  Get-Content $pubKeyPath
} else {
  Write-Warning 'Public key not found.'
}
