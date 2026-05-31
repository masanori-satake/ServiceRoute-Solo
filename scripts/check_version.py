import json
import sys
import os
import re

def check_version_consistency():
    try:
        versions = {}

        # 1. projects/app/manifest.json
        manifest_path = "projects/app/manifest.json"
        if not os.path.exists(manifest_path):
            print(f"Error: {manifest_path} not found")
            return False
        with open(manifest_path, "r", encoding="utf-8") as f:
            versions[manifest_path] = json.load(f).get("version")

        # 2. package.json
        package_path = "package.json"
        if not os.path.exists(package_path):
            print(f"Error: {package_path} not found")
            return False
        with open(package_path, "r", encoding="utf-8") as f:
            package_json = json.load(f)
            package_version = package_json.get("version")
            versions[package_path] = package_version

        # 3. package-lock.json (if exists)
        lock_path = "package-lock.json"
        if os.path.exists(lock_path):
            with open(lock_path, "r", encoding="utf-8") as f:
                versions[lock_path] = json.load(f).get("version")

        # 4. README.md (Badge)
        readme_path = "README.md"
        if os.path.exists(readme_path):
            with open(readme_path, "r", encoding="utf-8") as f:
                content = f.read()
                match = re.search(r"badge/version-([\d\.]+)-[a-zA-Z]+", content)
                if match:
                    versions[readme_path] = match.group(1)
                else:
                    print(f"Error: Version badge not found in {readme_path}")
                    return False

        # 5. AGENTS.md
        agents_path = "AGENTS.md"
        if os.path.exists(agents_path):
            with open(agents_path, "r", encoding="utf-8") as f:
                content = f.read()
                matches = re.findall(r'"version":\s*"([\d\.]+)"', content)
                if matches:
                    if len(set(matches)) > 1:
                        print(f"Error: Inconsistent versions found within {agents_path}: {set(matches)}")
                        return False
                    versions[agents_path] = matches[0]
                else:
                    print(f"Error: Version not found in {agents_path}")
                    return False

        # 6. docs/specs.md
        specs_path = "docs/specs.md"
        if os.path.exists(specs_path):
            with open(specs_path, "r", encoding="utf-8") as f:
                content = f.read()
                matches = re.findall(r'"version":\s*"([\d\.]+)"', content)
                if matches:
                    if len(set(matches)) > 1:
                        print(f"Error: Inconsistent versions found within {specs_path}: {set(matches)}")
                        return False
                    versions[specs_path] = matches[0]
                else:
                    print(f"Error: Version not found in {specs_path}")
                    return False

        # 7. scripts/generate_store_assets.py
        assets_script_path = "scripts/generate_store_assets.py"
        if os.path.exists(assets_script_path):
            with open(assets_script_path, "r", encoding="utf-8") as f:
                content = f.read()
                matches = re.findall(r"version\s*=\s*['\"]([\d\.]+)['\"]", content)
                if matches:
                    if len(set(matches)) > 1:
                        print(f"Error: Inconsistent versions found within {assets_script_path}: {set(matches)}")
                        return False
                    versions[assets_script_path] = matches[0]
                else:
                    print(f"Error: Version not found in {assets_script_path}")
                    return False

        print("Checking version consistency:")
        for source, version in versions.items():
            print(f" - {source}: {version}")

        if len(set(versions.values())) > 1:
            print("\nError: Version mismatch detected!")
            return False

        print(f"\nAll versions are consistent: {package_version}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if not check_version_consistency():
        sys.exit(1)
