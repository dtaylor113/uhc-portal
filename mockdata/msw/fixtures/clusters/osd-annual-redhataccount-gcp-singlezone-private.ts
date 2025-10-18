/**
 * Recorded Cluster Fixture
 * 
 * This fixture was auto-generated from a real cluster.
 * 
 * Cluster: osd-annual-redhataccount-gcp-singlezone-private
 * Product: osd
 * Cloud: gcp
 * Architecture: Classic
 * Billing: Non-CCS
 * Recorded: Fri Oct 17 18:11:32 EDT 2025
 */

import type { Cluster } from '../types.js';

export const osdUannualUredhataccountUgcpUsinglezoneUprivateCluster: Cluster = (
{
  "kind": "Cluster",
  "id": "2m019671a7lckulr06jemrj9o7i053me",
  "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me",
  "name": "osd-annual-redhataccount-gcp-singlezone-private",
  "domain_prefix": "y1k9l3q1q3r7g9r",
  "external_id": "b29ff850-ab3e-4530-ad6b-f5b8ceecfcd9",
  "infra_id": "y1k9l3q1q3r7g9r-5lx9p",
  "display_name": "osd-annual-redhataccount-gcp-singlezone-private",
  "creation_timestamp": "2025-10-17T15:36:56.777871Z",
  "activity_timestamp": "2025-10-17T22:03:56Z",
  "expiration_timestamp": "2025-10-19T03:36:56.308572Z",
  "cloud_provider": {
    "kind": "CloudProviderLink",
    "id": "gcp",
    "href": "/api/clusters_mgmt/v1/cloud_providers/gcp"
  },
  "openshift_version": "4.19.15",
  "subscription": {
    "kind": "SubscriptionLink",
    "id": "34CR9ZMUHOOsngcD738FwBwdEiD",
    "href": "/api/accounts_mgmt/v1/subscriptions/34CR9ZMUHOOsngcD738FwBwdEiD"
  },
  "region": {
    "kind": "CloudRegionLink",
    "id": "us-east1",
    "href": "/api/clusters_mgmt/v1/cloud_providers/gcp/regions/us-east1"
  },
  "console": {
    "url": "https://console-openshift-console.apps.y1k9l3q1q3r7g9r.9ona.s2.devshift.org"
  },
  "api": {
    "url": "https://api.y1k9l3q1q3r7g9r.9ona.s2.devshift.org:6443",
    "listening": "external"
  },
  "nodes": {
    "master": 3,
    "infra": 2,
    "compute": 4,
    "availability_zones": [
      "us-east1-b"
    ],
    "compute_machine_type": {
      "kind": "MachineTypeLink",
      "id": "n2-standard-4",
      "href": "/api/clusters_mgmt/v1/machine_types/n2-standard-4"
    },
    "infra_machine_type": {
      "kind": "MachineTypeLink",
      "id": "n2-highmem-4",
      "href": "/api/clusters_mgmt/v1/machine_types/n2-highmem-4"
    }
  },
  "state": "ready",
  "flavour": {
    "kind": "FlavourLink",
    "id": "osd-4",
    "href": "/api/clusters_mgmt/v1/flavours/osd-4"
  },
  "groups": {
    "kind": "GroupListLink",
    "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/groups"
  },
  "gcp": {
    "project_id": "",
    "security": {
      "secure_boot": false
    }
  },
  "dns": {
    "base_domain": "9ona.s2.devshift.org"
  },
  "network": {
    "type": "OVNKubernetes",
    "machine_cidr": "10.0.0.0/16",
    "service_cidr": "172.30.0.0/16",
    "pod_cidr": "10.128.0.0/14",
    "host_prefix": 23
  },
  "external_configuration": {
    "kind": "ExternalConfiguration",
    "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/external_configuration",
    "syncsets": {
      "kind": "SyncsetListLink",
      "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/external_configuration/syncsets"
    },
    "labels": {
      "kind": "LabelListLink",
      "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/external_configuration/labels"
    },
    "manifests": {
      "kind": "ManifestListLink",
      "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/external_configuration/manifests"
    }
  },
  "multi_az": false,
  "managed": true,
  "ccs": {
    "enabled": false,
    "disable_scp_checks": false
  },
  "version": {
    "kind": "Version",
    "id": "openshift-v4.19.15",
    "href": "/api/clusters_mgmt/v1/versions/openshift-v4.19.15",
    "raw_id": "4.19.15",
    "channel_group": "stable",
    "available_upgrades": [
      "4.19.16"
    ],
    "end_of_life_timestamp": "2026-10-21T00:00:00Z"
  },
  "storage_quota": {
    "value": 107374182400,
    "unit": "B"
  },
  "load_balancer_quota": 0,
  "identity_providers": {
    "kind": "IdentityProviderListLink",
    "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/identity_providers"
  },
  "ingresses": {
    "kind": "IngressListLink",
    "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/ingresses"
  },
  "machine_pools": {
    "kind": "MachinePoolListLink",
    "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/machine_pools"
  },
  "inflight_checks": {
    "kind": "InflightCheckListLink",
    "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/inflight_checks"
  },
  "product": {
    "kind": "ProductLink",
    "id": "osd",
    "href": "/api/clusters_mgmt/v1/products/osd"
  },
  "status": {
    "state": "ready",
    "dns_ready": true,
    "oidc_ready": false,
    "provision_error_message": "",
    "provision_error_code": "",
    "configuration_mode": "full",
    "limited_support_reason_count": 0
  },
  "node_drain_grace_period": {
    "value": 60,
    "unit": "minutes"
  },
  "etcd_encryption": false,
  "billing_model": "standard",
  "disable_user_workload_monitoring": false,
  "managed_service": {
    "enabled": false,
    "managed": false
  },
  "hypershift": {
    "enabled": false
  },
  "byo_oidc": {
    "enabled": false
  },
  "delete_protection": {
    "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/delete_protection",
    "enabled": false
  },
  "external_auth_config": {
    "kind": "ExternalAuthConfig",
    "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/external_auth_config",
    "external_auths": {
      "href": "/api/clusters_mgmt/v1/clusters/2m019671a7lckulr06jemrj9o7i053me/external_auth_config/external_auths"
    },
    "enabled": false
  },
  "multi_arch_enabled": false,
  "image_registry": {
    "state": "enabled"
  }
}
) as any;
