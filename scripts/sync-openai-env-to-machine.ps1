<#
.SYNOPSIS
  Sync OPENAI_API_KEY / OPENAI_API_BASE / MODEL into Windows Machine environment variables.

  Resolution order:
    1. Explicit parameters
    2. Current User environment variables
    3. Interactive prompt

  Usage (run from an elevated PowerShell for actual Machine writes):
    Set-ExecutionPolicy -Scope Process Bypass -Force
    & "D:\openclaw-tools\ion-dex-nuke\scripts\sync-openai-env-to-machine.ps1"
    & "D:\openclaw-tools\ion-dex-nuke\scripts\sync-openai-env-to-machine.ps1" -RemoveUserAfterSync
    & "D:\openclaw-tools\ion-dex-nuke\scripts\sync-openai-env-to-machine.ps1" -Preview
    & "D:\openclaw-tools\ion-dex-nuke\scripts\sync-openai-env-to-machine.ps1" `
      -OpenAiApiBase "https://apinebula.com/v1" `
      -ModelName "gpt-5.4"
#>

[CmdletBinding()]
param(
  [switch]$RemoveUserAfterSync,
  [switch]$Preview,
  [string]$OpenAiApiKey,
  [string]$OpenAiApiBase,
  [string]$ModelName
)

$ErrorActionPreference = 'Stop'

$variableSpecs = @(
  @{
    Name = 'OPENAI_API_KEY'
    ProvidedValue = $OpenAiApiKey
    Secret = $true
  },
  @{
    Name = 'OPENAI_API_BASE'
    ProvidedValue = $OpenAiApiBase
    Secret = $false
  },
  @{
    Name = 'MODEL'
    ProvidedValue = $ModelName
    Secret = $false
  }
)

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function ConvertTo-PlainText {
  param(
    [Parameter(Mandatory = $true)]
    [Security.SecureString]$SecureValue
  )

  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  }
  finally {
    if ($bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
  }
}

function Resolve-VariableValue {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$Spec
  )

  if (-not [string]::IsNullOrWhiteSpace($Spec.ProvidedValue)) {
    return @{
      Value = $Spec.ProvidedValue
      Source = 'parameter'
    }
  }

  $userValue = [Environment]::GetEnvironmentVariable($Spec.Name, 'User')
  if (-not [string]::IsNullOrWhiteSpace($userValue)) {
    return @{
      Value = $userValue
      Source = 'user-env'
    }
  }

  if ($Preview) {
    return @{
      Value = $null
      Source = 'missing'
    }
  }

  if ($Spec.Secret) {
    $secureValue = Read-Host -Prompt "Enter $($Spec.Name) (input hidden)" -AsSecureString
    $promptedValue = ConvertTo-PlainText -SecureValue $secureValue
  }
  else {
    $promptedValue = Read-Host -Prompt "Enter $($Spec.Name)"
  }

  if ([string]::IsNullOrWhiteSpace($promptedValue)) {
    throw "$($Spec.Name) cannot be empty."
  }

  return @{
    Value = $promptedValue
    Source = 'prompt'
  }
}

function Broadcast-EnvironmentChange {
  if (-not ('IonDexEnvironmentNativeMethods' -as [type])) {
    $typeDefinition = @"
using System;
using System.Runtime.InteropServices;

public static class IonDexEnvironmentNativeMethods {
  [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
  public static extern IntPtr SendMessageTimeout(
    IntPtr hWnd,
    uint Msg,
    IntPtr wParam,
    string lParam,
    uint fuFlags,
    uint uTimeout,
    out IntPtr lpdwResult
  );
}
"@
    Add-Type -TypeDefinition $typeDefinition
  }

  $HWND_BROADCAST = [IntPtr]0xffff
  $WM_SETTINGCHANGE = 0x001A
  $SMTO_ABORTIFHUNG = 0x0002
  $result = [IntPtr]::Zero

  [void][IonDexEnvironmentNativeMethods]::SendMessageTimeout(
    $HWND_BROADCAST,
    $WM_SETTINGCHANGE,
    [IntPtr]::Zero,
    'Environment',
    $SMTO_ABORTIFHUNG,
    5000,
    [ref]$result
  )
}

if (-not $Preview -and -not (Test-IsAdministrator)) {
  Write-Error "Run this in an elevated PowerShell, or add -Preview for a non-destructive check."
  exit 1
}

$resolvedVariables = foreach ($spec in $variableSpecs) {
  $resolved = Resolve-VariableValue -Spec $spec
  [pscustomobject]@{
    Name = $spec.Name
    Value = $resolved.Value
    Source = $resolved.Source
    Secret = [bool]$spec.Secret
  }
}

if ($Preview) {
  Write-Host "Preview only: no Machine variables were changed." -ForegroundColor Yellow
}
else {
  foreach ($item in $resolvedVariables) {
    [Environment]::SetEnvironmentVariable($item.Name, $item.Value, 'Machine')
  }

  if ($RemoveUserAfterSync) {
    foreach ($item in $resolvedVariables) {
      [Environment]::SetEnvironmentVariable($item.Name, $null, 'User')
    }
  }

  Broadcast-EnvironmentChange
}

$report = foreach ($item in $resolvedVariables) {
  $machineValue = [Environment]::GetEnvironmentVariable($item.Name, 'Machine')
  $userValue = [Environment]::GetEnvironmentVariable($item.Name, 'User')
  $displayValue = if ($item.Secret) {
    if ($item.Source -eq 'missing') { '<missing>' } else { '<hidden>' }
  }
  elseif ($item.Source -eq 'missing') {
    '<missing>'
  }
  elseif ($Preview) {
    $item.Value
  }
  else {
    $machineValue
  }

  [pscustomobject]@{
    Name = $item.Name
    Source = $item.Source
    MachineSet = -not [string]::IsNullOrWhiteSpace($machineValue)
    UserSet = -not [string]::IsNullOrWhiteSpace($userValue)
    Value = $displayValue
  }
}

$report | Format-Table -Auto

if ($Preview) {
  Write-Host ""
  Write-Host "Preview complete. Re-run in an elevated PowerShell without -Preview to write Machine variables." -ForegroundColor Yellow
}
else {
  Write-Host ""
  Write-Host "Done. Newly opened terminals and apps should pick up the Machine-scoped values." -ForegroundColor Green
}
