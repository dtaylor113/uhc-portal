/**
 * Recorded Subscription Fixture
 * 
 * This fixture was auto-generated from a real subscription.
 * 
 * Cluster: osd-annual-redhataccount-gcp-singlezone-private
 * Subscription ID: 34CR9ZMUHOOsngcD738FwBwdEiD
 * Recorded: Fri Oct 17 18:11:32 EDT 2025
 */

import type { Subscription } from '../types.js';

export const osdUannualUredhataccountUgcpUsinglezoneUprivateSubscription: Subscription = (
{
  "billing_expiration_date": "0001-01-01T00:00:00Z",
  "cloud_provider_id": "gcp",
  "cluster_billing_model": "standard",
  "cluster_id": "2m019671a7lckulr06jemrj9o7i053me",
  "console_url": "https://console-openshift-console.apps.y1k9l3q1q3r7g9r.9ona.s2.devshift.org",
  "created_at": "2025-10-17T15:36:56.610892Z",
  "creator": {
    "href": "/api/accounts_mgmt/v1/accounts/1wzcgBIAy1hTMP9l7KAnFK7eJea",
    "id": "1wzcgBIAy1hTMP9l7KAnFK7eJea",
    "kind": "Account"
  },
  "display_name": "osd-annual-redhataccount-gcp-singlezone-private",
  "eval_expiration_date": "0001-01-01T00:00:00Z",
  "external_cluster_id": "b29ff850-ab3e-4530-ad6b-f5b8ceecfcd9",
  "href": "/api/accounts_mgmt/v1/subscriptions/34CR9ZMUHOOsngcD738FwBwdEiD",
  "id": "34CR9ZMUHOOsngcD738FwBwdEiD",
  "kind": "Subscription",
  "last_reconcile_date": "0001-01-01T00:00:00Z",
  "last_released_at": "0001-01-01T00:00:00Z",
  "last_telemetry_date": "2025-10-17T16:42:10.06784Z",
  "managed": true,
  "metrics": [
    {
      "arch": "amd64",
      "cloud_provider": "gcp",
      "cluster_type": "",
      "compute_nodes_cpu": {
        "total": {
          "unit": "",
          "value": 16
        },
        "updated_timestamp": "0001-01-01T00:00:00Z",
        "used": {
          "unit": "",
          "value": 0
        }
      },
      "compute_nodes_memory": {
        "total": {
          "unit": "B",
          "value": 67050348544
        },
        "updated_timestamp": "0001-01-01T00:00:00Z",
        "used": {
          "unit": "B",
          "value": 0
        }
      },
      "compute_nodes_sockets": {
        "total": {
          "unit": "",
          "value": 0
        },
        "updated_timestamp": "0001-01-01T00:00:00Z",
        "used": {
          "unit": "",
          "value": 0
        }
      },
      "console_url": "https://console-openshift-console.apps.y1k9l3q1q3r7g9r.9ona.s2.devshift.org",
      "cpu": {
        "total": {
          "unit": "",
          "value": 48
        },
        "updated_timestamp": "2025-10-17T22:10:16.085Z",
        "used": {
          "unit": "",
          "value": 4.036761904761948
        }
      },
      "critical_alerts_firing": 0,
      "health_state": "healthy",
      "memory": {
        "total": {
          "unit": "B",
          "value": 235291316224
        },
        "updated_timestamp": "2025-10-17T22:10:16.055Z",
        "used": {
          "unit": "B",
          "value": 46799155200
        }
      },
      "nodes": {
        "compute": 4,
        "infra": 2,
        "master": 3,
        "total": 9
      },
      "nodes_arch": [
        {
          "arch": "amd64",
          "compute": 4,
          "infra": 2,
          "master": 3,
          "total": 9
        }
      ],
      "non_virt_nodes": 0,
      "openshift_version": "4.19.15",
      "operating_system": "",
      "operators_condition_failing": 0,
      "query_timestamp": "2025-10-17T22:10:15Z",
      "region": "us-east1",
      "sockets": {
        "total": {
          "unit": "",
          "value": 0
        },
        "updated_timestamp": "0001-01-01T00:00:00Z",
        "used": {
          "unit": "",
          "value": 0
        }
      },
      "state": "ready",
      "state_description": "",
      "storage": {
        "total": {
          "unit": "B",
          "value": 0
        },
        "updated_timestamp": "0001-01-01T00:00:00Z",
        "used": {
          "unit": "B",
          "value": 0
        }
      },
      "subscription_cpu_total": 0,
      "subscription_obligation_exists": 3,
      "subscription_socket_total": 0,
      "upgrade": {
        "available": true,
        "state": "",
        "updated_timestamp": "2025-10-17T22:10:16.018Z",
        "version": ""
      }
    }
  ],
  "organization": {
    "id": "1wuVGGV6SCmD8ya6yRGEJzvmVuC"
  },
  "organization_id": "1wuVGGV6SCmD8ya6yRGEJzvmVuC",
  "plan": {
    "href": "/api/accounts_mgmt/v1/plans/OSD",
    "id": "OSD",
    "kind": "Plan",
    "type": "OSD"
  },
  "provenance": "Provisioning",
  "region_id": "us-east1",
  "status": "Active",
  "support_level": "Premium",
  "trial_end_date": "0001-01-01T00:00:00Z",
  "updated_at": "2025-10-17T16:42:10.070215Z"
}
) as any;
