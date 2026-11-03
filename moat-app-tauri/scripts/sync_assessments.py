#!/usr/bin/env python3
"""
Sync MOAT assessment files from Supabase Storage to local p##/ folders.

Usage:
  python sync_assessments.py                          # Sync all patients
  python sync_assessments.py --patient p03            # Sync one patient
  python sync_assessments.py --output ./data          # Custom output dir
  python sync_assessments.py --run-analysis "python analyze.py"

Environment variables (or .env file in the same directory):
  SUPABASE_URL         - Supabase project URL
  SUPABASE_SERVICE_KEY - Service role key (NOT the publishable/anon key)
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

BUCKET = "moat-assessments"


def normalize_patient_folder(raw_id: str) -> str:
    """Match the frontend normalization logic exactly."""
    trimmed = raw_id.strip().lower()
    if trimmed.startswith("p"):
        return trimmed
    return f"p{trimmed}"


def get_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.", file=sys.stderr)
        print("Set them as environment variables or in a .env file.", file=sys.stderr)
        sys.exit(1)
    return create_client(url, key)


def list_patient_folders(client: Client) -> list[str]:
    """List top-level patient folders in the bucket."""
    result = client.storage.from_(BUCKET).list("", {"limit": 1000})
    folders = []
    for item in result:
        name = item.get("name", "")
        # Supabase Storage returns folder entries with id=None
        if item.get("id") is None and name:
            folders.append(name)
    return sorted(folders)


def list_files_in_folder(client: Client, folder: str) -> list[dict]:
    """List files inside a patient folder."""
    result = client.storage.from_(BUCKET).list(folder, {"limit": 1000})
    return [f for f in result if f.get("id") is not None]


def sync_folder(client: Client, folder: str, output_dir: Path) -> int:
    """Download new/updated files for one patient folder. Returns count of files synced."""
    local_dir = output_dir / folder
    local_dir.mkdir(parents=True, exist_ok=True)

    files = list_files_in_folder(client, folder)
    synced = 0

    for f in files:
        fname = f["name"]
        remote_path = f"{folder}/{fname}"
        local_path = local_dir / fname

        # Always download (files are small xlsx, typically <100KB)
        print(f"  {remote_path}", end="")
        try:
            data = client.storage.from_(BUCKET).download(remote_path)
            local_path.write_bytes(data)
            synced += 1
            print(" -> OK")
        except Exception as e:
            print(f" -> FAILED: {e}")

    return synced


def main():
    load_dotenv()

    parser = argparse.ArgumentParser(
        description="Sync MOAT assessment xlsx files from Supabase Storage"
    )
    parser.add_argument(
        "--patient",
        help="Sync only this patient (e.g. p03, P03, or 03)",
    )
    parser.add_argument(
        "--output",
        default="./assessments",
        help="Output directory (default: ./assessments)",
    )
    parser.add_argument(
        "--run-analysis",
        help="Shell command to run after sync (e.g. 'python analyze.py')",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List files without downloading",
    )
    args = parser.parse_args()

    client = get_client()
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    patient_filter = normalize_patient_folder(args.patient) if args.patient else None

    # Get folders to sync
    if patient_filter:
        folders = [patient_filter]
        print(f"Syncing patient: {patient_filter}")
    else:
        folders = list_patient_folders(client)
        print(f"Found {len(folders)} patient folder(s): {', '.join(folders) if folders else '(none)'}")

    total_synced = 0
    for folder in folders:
        files = list_files_in_folder(client, folder)
        if args.dry_run:
            print(f"\n{folder}/  ({len(files)} file(s))")
            for f in files:
                print(f"  {f['name']}")
        else:
            print(f"\n{folder}/")
            total_synced += sync_folder(client, folder, output_dir)

    if not args.dry_run:
        print(f"\nSync complete. {total_synced} file(s) downloaded to {output_dir.resolve()}")

    # Run analysis command if requested
    if args.run_analysis and not args.dry_run:
        print(f"\nRunning: {args.run_analysis}")
        result = subprocess.run(args.run_analysis, shell=True, cwd=str(output_dir))
        sys.exit(result.returncode)


if __name__ == "__main__":
    main()
