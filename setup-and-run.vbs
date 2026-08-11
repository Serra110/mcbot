Set objShell = CreateObject("Shell.Application")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
strScript = strDir & "\setup-and-run.ps1"
objShell.ShellExecute "powershell.exe", "-ExecutionPolicy Bypass -NoProfile -File """ & strScript & """", strDir, "open", 1
