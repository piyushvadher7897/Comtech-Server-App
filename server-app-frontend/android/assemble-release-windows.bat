@echo off
REM Windows: long project paths break CMake/Ninja for react-native-screens.
REM This script maps a short drive letter, then runs assembleRelease.

set "PROJECT_ROOT=%~dp0.."
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

subst | findstr /i "\\R:" >nul
if not errorlevel 1 (
  echo Drive R: is already mapped. Unmap with: subst R: /d
  exit /b 1
)

subst R: "%PROJECT_ROOT%"
if errorlevel 1 (
  echo Failed to map R: to "%PROJECT_ROOT%"
  exit /b 1
)

cd /d R:\android
call gradlew.bat assembleRelease %*
set BUILD_EXIT=%ERRORLEVEL%

subst R: /d
exit /b %BUILD_EXIT%
