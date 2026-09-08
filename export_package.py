import os
import shutil
import zipfile
from pathlib import Path

src = Path(r"C:\antigravity-projects\PYJAMA-DZ-CAMERA-SYSTEM")
desktop = Path(r"C:\Users\Computs\Desktop")
dest = desktop / "PYJAMA-DZ-CAMERA-SYSTEM"
zip_path = desktop / "PYJAMA-DZ-CLIENT-PACKAGE.zip"

print(f"Exporting from {src} to {dest}...")

if dest.exists():
    shutil.rmtree(dest, ignore_errors=True)
if zip_path.exists():
    zip_path.unlink()

dest.mkdir(parents=True, exist_ok=True)

# Ignore folders
ignore_dirs = {".git", "venv", "node_modules", ".system_generated", ".tempmediaStorage", "__pycache__"}
ignore_files = {"test.mp4"}

for item in src.iterdir():
    if item.name in ignore_dirs:
        continue
    if item.name in ignore_files:
        continue
    target = dest / item.name
    if item.is_dir():
        def _ignore(directory, contents):
            ignored = set()
            for c in contents:
                if c in ignore_dirs or c.endswith(".log") or c.endswith(".tmp") or c.endswith(".pyc"):
                    ignored.add(c)
            return ignored
        shutil.copytree(item, target, ignore=_ignore)
    else:
        shutil.copy2(item, target)

# Ensure storage directories exist
(dest / "storage" / "clips").mkdir(parents=True, exist_ok=True)
(dest / "storage" / "faces").mkdir(parents=True, exist_ok=True)
(dest / "storage" / "snapshots").mkdir(parents=True, exist_ok=True)

print(f"Folder created at: {dest}")
print(f"Creating ZIP file: {zip_path}...")

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(dest):
        for file in files:
            file_path = Path(root) / file
            arcname = file_path.relative_to(dest)
            zipf.write(file_path, arcname)

size_mb = round(zip_path.stat().st_size / (1024 * 1024), 2)
print(f"[OK] Export finished successfully!")
print(f"[OK] Folder on Desktop: {dest}")
print(f"[OK] ZIP on Desktop: {zip_path} ({size_mb} MB)")
