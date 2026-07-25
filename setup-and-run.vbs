Dim objShell, strDir, strScript
Set objShell = CreateObject("Shell.Application")
strDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
strScript = strDir & "\setup-and-run.ps1"
objShell.ShellExecute "powershell.exe", "-ExecutionPolicy Bypass -NoProfile -File """ & strScript & """", strDir, "runas", 1
