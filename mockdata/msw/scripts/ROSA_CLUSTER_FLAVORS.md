# ROSA Cluster Creation Commands

Reference guide for creating different ROSA cluster "flavors" that match your QE test profiles.

## Prerequisites

```bash
# Install ROSA CLI
brew install rosa-cli

# Login to your AWS account
aws configure

# Login to Red Hat OpenShift Cluster Manager
rosa login

# Verify setup
rosa verify quota
rosa verify permissions
```

## Cluster Flavors

### 1. ROSA HCP (Hosted Control Plane) - Public

**QE Profile:** `ROSA_HCP_PUBLIC`

```bash
rosa create cluster \
  --cluster-name rosa-hcp-public \
  --sts \
  --mode auto \
  --hosted-cp \
  --region us-east-1 \
  --multi-az \
  --machine-cidr 10.0.0.0/16 \
  --yes
```

**Key Characteristics:**
- `--hosted-cp`: Control plane in Red Hat AWS account
- `--sts`: Uses AWS STS for authentication
- `--mode auto`: Automatic IAM role creation (CCS)
- Public API endpoint

### 2. ROSA HCP - Private

**QE Profile:** `ROSA_HCP_PRIVATE`

```bash
rosa create cluster \
  --cluster-name rosa-hcp-private \
  --sts \
  --mode auto \
  --hosted-cp \
  --region us-east-1 \
  --multi-az \
  --private \
  --machine-cidr 10.0.0.0/16 \
  --yes
```

**Key Characteristics:**
- `--private`: Private API endpoint
- All traffic stays within VPC

### 3. ROSA Classic - CCS Public

**QE Profile:** `AWS_CCS_PUBLIC`

```bash
rosa create cluster \
  --cluster-name rosa-classic-ccs-public \
  --sts \
  --mode auto \
  --region us-east-1 \
  --multi-az \
  --compute-machine-type m5.xlarge \
  --replicas 2 \
  --yes
```

**Key Characteristics:**
- Classic architecture (control plane in customer account)
- CCS billing model
- Multi-AZ for high availability

### 4. ROSA Classic - CCS Public with Advanced Properties

**QE Profile:** `AWS_CCS_PUBLIC_ADVANCED`

```bash
rosa create cluster \
  --cluster-name rosa-classic-advanced \
  --sts \
  --mode auto \
  --region us-east-1 \
  --multi-az \
  --compute-machine-type m5.2xlarge \
  --replicas 3 \
  --version 4.14.0 \
  --enable-autoscaling \
  --min-replicas 3 \
  --max-replicas 6 \
  --pod-cidr 10.128.0.0/14 \
  --service-cidr 172.30.0.0/16 \
  --host-prefix 23 \
  --etcd-encryption \
  --disable-workload-monitoring=false \
  --yes
```

**Advanced Properties:**
- Custom CIDR ranges
- Autoscaling enabled
- ETCD encryption
- Specific OpenShift version

### 5. ROSA Classic - Private with PrivateLink

**QE Profile:** `AWS_PRIVATELINK`

```bash
rosa create cluster \
  --cluster-name rosa-classic-privatelink \
  --sts \
  --mode auto \
  --region us-east-1 \
  --multi-az \
  --private-link \
  --subnet-ids subnet-abc123,subnet-def456,subnet-ghi789 \
  --yes
```

**Key Characteristics:**
- `--private-link`: Uses AWS PrivateLink for connectivity
- Requires existing VPC with subnets
- No public internet required

### 6. ROSA Classic - Single AZ

**QE Profile:** `AWS_SINGLE_AZ`

```bash
rosa create cluster \
  --cluster-name rosa-classic-single-az \
  --sts \
  --mode auto \
  --region us-east-1 \
  --availability-zone us-east-1a \
  --compute-machine-type m5.xlarge \
  --replicas 2 \
  --yes
```

**Key Characteristics:**
- Single availability zone (cost optimization)
- Lower fault tolerance

### 7. ROSA Classic - Non-CCS (Red Hat Pays)

**QE Profile:** `AWS_NONCCS_PUBLIC`

> **Note:** Non-CCS clusters require special account setup with Red Hat billing.
> Contact Red Hat support to enable non-CCS quota.

```bash
# Non-CCS requires pre-configured billing setup
# Create cluster without --sts (uses traditional IAM)
rosa create cluster \
  --cluster-name rosa-nonccs \
  --region us-east-1 \
  --multi-az \
  --compute-machine-type m5.xlarge \
  --replicas 2 \
  --yes
```

**Key Characteristics:**
- No `--sts` flag
- Red Hat pays for AWS infrastructure
- Traditional IAM user credentials

## After Creating a Cluster

### 1. Wait for Installation

```bash
# Monitor cluster creation (takes 30-40 minutes)
rosa describe cluster --cluster rosa-hcp-public --watch

# Check installation logs
rosa logs install --cluster rosa-hcp-public --watch
```

### 2. Get Cluster Details

```bash
# Get cluster ID
rosa describe cluster --cluster rosa-hcp-public

# Get subscription ID
ocm list subscriptions --parameter search="display_name like 'rosa-hcp-public'"
```

### 3. Record the Cluster

```bash
# Use the recording script with subscription ID
./mockdata/msw/scripts/record-cluster.sh <subscription-id> rosa-hcp-public
```

### 4. Add to MSW Fixtures

```typescript
// mockdata/msw/fixtures/clusters.ts
import { rosaHcpPublicCluster } from './recorded/rosa-hcp-public.js';

export const mockClusters: Cluster[] = [
  hypershiftReadyCluster,
  rosaHcpPublicCluster,  // Your newly recorded cluster!
];
```

### 5. Clean Up (Optional)

```bash
# Delete cluster when done testing
rosa delete cluster --cluster rosa-hcp-public --yes
```

## Mapping to API Fields

When you record a cluster, here's how the ROSA CLI options map to API fields:

| ROSA CLI Flag | API Field | Values |
|--------------|-----------|--------|
| `--hosted-cp` | `hypershift.enabled` | `true` = HCP, `false` = Classic |
| `--sts` | `aws.sts.enabled` | `true` = STS auth |
| `--mode auto` | `ccs.enabled` | `true` = CCS/BYOC |
| `--private` | `api.listening` | `internal` = private |
| `--multi-az` | `multi_az` | `true` = multi-AZ |
| `--private-link` | `aws.private_link` | `true` = PrivateLink |
| `--region` | `region.id` | e.g., `us-east-1` |
| `--compute-machine-type` | `nodes.compute_machine_type.id` | e.g., `m5.xlarge` |

## GCP Clusters (OSD)

For GCP clusters, use the `ocm` CLI instead:

```bash
# GCP with Workload Identity Federation (WIF)
ocm create cluster \
  --name gcp-wif-public \
  --provider gcp \
  --ccs \
  --region us-east1 \
  --multi-az \
  --compute-machine-type n2-standard-4 \
  --compute-nodes 2

# The cluster will automatically configure WIF
# Record it the same way using subscription ID
```

## Resources

- [ROSA Documentation](https://docs.openshift.com/rosa/welcome/index.html)
- [ROSA CLI Reference](https://docs.openshift.com/rosa/cli_reference/rosa_cli/rosa-get-started-cli.html)
- [OCM API Documentation](https://api.openshift.com/)
- [OpenShift Cluster Manager Console](https://console.redhat.com/openshift)

## Tips

1. **Start with HCP clusters** - They're faster to create (~10 minutes vs 30-40)
2. **Use descriptive names** - Include flavor in the name (e.g., `rosa-hcp-private-test`)
3. **Tag your clusters** - Use `--tags "purpose=msw-testing,team=frontend"`
4. **Monitor costs** - HCP clusters are generally cheaper than classic
5. **Clean up** - Delete test clusters promptly to avoid charges

