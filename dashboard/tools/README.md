# Honeytoken Attacker Simulation Tool

This Python testing script simulates an attacker discovering planted AWS honeytoken credentials in an environment and attempting to list S3 buckets.

> **CRITICAL LEGAL NOTICE:**
> This tool is strictly intended for demonstration and verification of your own Honeytoken deployment. Only execute it against trap URLs and credentials created within your authorized test environment.

---

## Prerequisites

Python 3.8+ with `boto3` installed:

```bash
pip install boto3
```

---

## Running the Attack Simulation

After generating an AWS honeytoken in the **Honeytoken Monitor** dashboard (under `/tokens`):

1. Copy the **AWS_ACCESS_KEY_ID**, **AWS_SECRET_ACCESS_KEY**, and **TRAP_CALLBACK_URL** from the one-time reveal panel (or from the `.env` snippet).
2. Run the attacker script:

```bash
python3 tools/attacker.py \
  --endpoint "http://localhost:8000/t/tok-aws-9182" \
  --access-key "AKIAIOSFODNN7EXAMPLE" \
  --secret-key "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" \
  --repeat 5
```

### Options

| Flag | Shorthand | Description | Default |
| :--- | :--- | :--- | :--- |
| `--endpoint` | `-e` | The trap URL receiving the probe request | *Required* |
| `--access-key` | `-a` | Decoy AWS Access Key ID (`AKIA...`) | *Required* |
| `--secret-key` | `-s` | Decoy AWS Secret Access Key | *Required* |
| `--repeat` | `-r` | Number of times to repeat the probe | `1` |
| `--delay` | `-d` | Delay in seconds between requests | `0.5` |

### Environment Variable Support

Recent versions of `boto3` support the `AWS_ENDPOINT_URL` environment variable directly:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_ENDPOINT_URL="http://localhost:8000/t/tok-aws-..."
aws s3 ls
```

### Verifying SOC Detection

Once executed:
1. The Honeytoken backend will catch the hit, evaluate flags (`scripted_ua`, `rapid_fire`, etc.), and log an incident.
2. The **Honeytoken Monitor** dashboard will flash the new incident in red/amber on the Live Feed and increment the incident metrics on the Overview page.

