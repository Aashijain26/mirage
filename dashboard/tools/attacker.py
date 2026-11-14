#!/usr/bin/env python3
"""
Honeytoken Attacker Simulation Tool (Demo / Testing Only)

Simulates an adversary discovering an AWS honeytoken in a repository or server
and attempting to execute S3 operations (list_buckets) against the decoy endpoint.

Usage:
    python3 attacker.py --endpoint https://mock.example.com/t/tok-aws-9182 \
                       --access-key AKIAIOSFODNN7EXAMPLE \
                       --secret-key wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY \
                       --repeat 5

NOTE:
    Recent versions of boto3 automatically read AWS_ENDPOINT_URL if set in the
    environment. When testing against a local or deployed trap endpoint, passing
    --endpoint explicitly routes requests directly to the honeytoken receiver.

    WARNING: Only execute this script against authorized honeytoken endpoints
    belonging to your own environment.
"""

import argparse
import sys
import time
import urllib.error

try:
    import boto3
    from botocore.config import Config
    from botocore.exceptions import BotoCoreError, ClientError, EndpointConnectionError
except ImportError:
    print(
        "[!] Error: 'boto3' is required to run this simulation tool.\n"
        "    Install it using: pip install boto3",
        file=sys.stderr,
    )
    sys.exit(1)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Simulate honeytoken credential compromise by querying S3 list_buckets."
    )
    parser.add_argument(
        "--endpoint",
        "-e",
        required=True,
        help="Honeytoken trap callback URL (e.g. https://mock.example.com/t/tok-aws-9182 or http://localhost:8000/t/...)",
    )
    parser.add_argument(
        "--access-key",
        "-a",
        required=True,
        help="AWS Access Key ID from the planted decoy credential (AKIA...)",
    )
    parser.add_argument(
        "--secret-key",
        "-s",
        required=True,
        help="AWS Secret Access Key from the planted decoy credential",
    )
    parser.add_argument(
        "--repeat",
        "-r",
        type=int,
        default=1,
        help="Number of times to repeat the request (simulate rapid fire burst)",
    )
    parser.add_argument(
        "--delay",
        "-d",
        type=float,
        default=0.5,
        help="Delay in seconds between repeated attempts (default: 0.5s)",
    )
    return parser.parse_args()


def simulate_probe(endpoint, access_key, secret_key, attempt=1):
    print(f"[*] [Attempt {attempt}] Probing honeytoken endpoint: {endpoint} ...")

    # Boto3 client targeting trap endpoint
    # Note: Modern boto3 also reads the AWS_ENDPOINT_URL environment variable.
    session = boto3.Session(
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="us-east-1",
    )

    client = session.client(
        "s3",
        endpoint_url=endpoint,
        config=Config(
            signature_version="s3v4",
            connect_timeout=5,
            read_timeout=5,
            retries={"max_attempts": 0},
        ),
    )

    try:
        response = client.list_buckets()
        print(f"    [+] Trap responded successfully: {response}")
        return True
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "ClientError")
        message = e.response.get("Error", {}).get("Message", str(e))
        print(f"    [-] Server error response: [{code}] {message}")
        return False
    except EndpointConnectionError:
        print(
            f"    [-] Network error: Could not connect to endpoint '{endpoint}'. Ensure server is online."
        )
        return False
    except (BotoCoreError, urllib.error.URLError) as e:
        print(f"    [-] Request failed: {e}")
        return False
    except Exception as e:
        print(f"    [-] Unexpected execution error: {e}")
        return False


def main():
    args = parse_args()

    print("=" * 60)
    print("HONEYTOKEN ATTACKER PROBE SIMULATOR")
    print("=" * 60)
    print(f"Target Endpoint:  {args.endpoint}")
    print(f"Access Key ID:    {args.access_key}")
    print(f"Repeat Cadence:   {args.repeat} request(s)")
    print("=" * 60)

    for i in range(1, args.repeat + 1):
        simulate_probe(args.endpoint, args.access_key, args.secret_key, attempt=i)
        if i < args.repeat:
            time.sleep(args.delay)

    print("\n[*] Simulation finished. Check Honeytoken Monitor SOC dashboard for real-time alerts.")


if __name__ == "__main__":
    main()

