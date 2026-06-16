' Launcher for CoursAI with zero console flash.
' Double-click this file to start the app. It runs start.bat in its
' already-hidden mode; only the application window appears.
' If something fails to start, open start.log next to start.bat.
Dim sh, fso, here
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
here = fso.GetParentFolderName(WScript.ScriptFullName)
' 0 = hidden window, False = do not wait. __hidden tells start.bat it is
' already running hidden, so it does not relaunch itself again.
sh.Run "cmd /c """ & here & "\start.bat"" __hidden", 0, False
