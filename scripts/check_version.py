import json
import sys
import os

def get_version_from_json(filepath, key="version"):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get(key)

def main():
    package_json = 'package.json'
    manifest_json = 'projects/app/manifest.json'

    if not os.path.exists(package_json):
        print(f"Error: {package_json} not found.")
        sys.exit(1)

    if not os.path.exists(manifest_json):
        print(f"Error: {manifest_json} not found.")
        sys.exit(1)

    v_package = get_version_from_json(package_json)
    v_manifest = get_version_from_json(manifest_json)

    print(f"package.json version: {v_package}")
    print(f"manifest.json version: {v_manifest}")

    if v_package != v_manifest:
        print("Error: Version mismatch between package.json and manifest.json.")
        sys.exit(1)

    print("Version consistency check passed.")

if __name__ == "__main__":
    main()
