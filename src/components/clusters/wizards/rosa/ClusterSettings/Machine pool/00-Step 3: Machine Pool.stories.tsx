import React from 'react';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import createMockStore, { MockStoreEnhanced } from 'redux-mock-store';
import { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import promiseMiddleware from 'redux-promise-middleware';
import { thunk } from 'redux-thunk';
import { Wizard, WizardStep, WizardBody, Page, PageSection } from '@patternfly/react-core';

import MachinePoolScreen from '../../MachinePoolScreen/MachinePoolScreen';
import { baseRequestState } from '~/redux/reduxHelpers';
import { IMDSType } from '~/components/clusters/wizards/common/constants';
import { defaultWorkerNodeVolumeSizeGiB } from '~/components/clusters/common/machinePools/constants';
import { CloudVpc, Subnetwork, MachineType } from '~/types/clusters_mgmt.v1';
import { FormSubnet } from '~/components/clusters/wizards/common/FormSubnet';

import '../../createROSAWizard.scss';

// Mock VPC with subnets across multiple AZs
const mockVpcWithSubnets: CloudVpc = {
  id: 'vpc-123456789',
  name: 'rosa-vpc-example',
  aws_subnets: [
    {
      subnet_id: 'subnet-private-1a',
      public: false,
      availability_zone: 'us-east-1a',
      cidr_block: '10.0.1.0/24',
    },
    {
      subnet_id: 'subnet-private-1b',
      public: false,
      availability_zone: 'us-east-1b',
      cidr_block: '10.0.2.0/24',
    },
    {
      subnet_id: 'subnet-private-1c',
      public: false,
      availability_zone: 'us-east-1c',
      cidr_block: '10.0.3.0/24',
    },
  ] as Subnetwork[],
} as CloudVpc;

// Mock machine types
const mockMachineTypes: MachineType[] = [
  {
    id: 'm5.large',
    name: 'm5.large',
    cpu: { value: 2 },
    memory: { value: 8589934592 }, // 8GB in bytes
    category: 'general_purpose',
  },
  {
    id: 'm5.xlarge',
    name: 'm5.xlarge',
    cpu: { value: 4 },
    memory: { value: 17179869184 }, // 16GB in bytes
    category: 'general_purpose',
  },
  {
    id: 'c5.2xlarge',
    name: 'c5.2xlarge',
    cpu: { value: 8 },
    memory: { value: 17179869184 }, // 16GB in bytes
    category: 'compute_optimized',
  },
] as MachineType[];

const withState = (
  initialValues: any,
  showInWizardFramework: boolean = true,
): {
  store: MockStoreEnhanced<unknown, any>;
  Wrapper: (props: { children: React.ReactNode }) => React.ReactNode;
} => {
  const store = createMockStore([thunk, promiseMiddleware as any])({
    ...baseRequestState,
    userProfile: {
      keycloakProfile: {
        username: 'test-user',
      },
      organization: {
        ...baseRequestState,
        fulfilled: true,
        details: {
          id: '123',
          name: 'Test Org',
        },
        quotaList: {
          items: [],
        },
        timestamp: 0,
      },
    },
    cloudProviders: {
      fulfilled: true,
      details: [
        {
          id: 'aws',
          name: 'aws',
          machine_types: {
            fulfilled: true,
            items: mockMachineTypes,
          },
        },
      ],
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock React Query data for VPCs
    queryClient.setQueryData(['vpcs'], {
      items: [mockVpcWithSubnets],
    });

    const content = (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Formik initialValues={initialValues} onSubmit={() => {}}>
            {showInWizardFramework ? (
              <Page>
                <PageSection variant="default" hasBodyWrapper>
                  <div className="ocm-page">
                    <Wizard height="100%" width="100%" className="rosa-wizard">
                      <WizardStep name="Machine Pool" id="step3-machine-pool">
                        <WizardBody>{children}</WizardBody>
                      </WizardStep>
                    </Wizard>
                  </div>
                </PageSection>
              </Page>
            ) : (
              children
            )}
          </Formik>
        </QueryClientProvider>
      </Provider>
    );

    return content;
  };

  return { store, Wrapper };
};

const meta: Meta<typeof MachinePoolScreen> = {
  title: 'Wizards/ROSA/Step 3: Cluster settings/Machine pool',
  component: MachinePoolScreen,
  parameters: {
    docs: {
      description: {
        component: `
## Machine Pool Screen

The Machine Pool screen configures compute resources for ROSA clusters, with different behaviors for Classic vs Hypershift architectures.

### Key Features
- **Architecture-aware UI** - Different sections for Classic vs Hypershift
- **Machine type selection** - Choose EC2 instance types with resource quotas
- **Scaling configuration** - Fixed node counts or autoscaling with min/max
- **Storage configuration** - Root disk size with architecture-specific constraints
- **Networking** - VPC and subnet selection for Hypershift clusters
- **Security settings** - IMDS configuration and node labeling

### Architecture Differences
- **Classic ROSA** - Single default machine pool, optional node labels
- **Hypershift** - Up to 3 machine pools with subnet assignment, higher storage minimums
- **Shared features** - Instance types, scaling, root disk size, IMDS configuration

### Components Included
- **MachinePoolScreenHeader** - Context-aware header text
- **MachinePoolsSubnets** - VPC/subnet selection (Hypershift only)
- **ScaleSection** - Instance types, scaling, storage, IMDS, node labels
        `,
      },
    },
  },
  render: (args: any, { parameters }) => {
    const { initialValues, showInWizardFramework } = parameters;
    const { Wrapper } = withState(initialValues, showInWizardFramework);

    return (
      <Wrapper>
        <MachinePoolScreen {...args} />
      </Wrapper>
    );
  },
};

export default meta;

type Story = StoryObj<typeof MachinePoolScreen>;

// Base form values for Classic (non-Hypershift)
const baseClassicValues = {
  hypershift: 'false',
  multi_az: 'true',
  machine_type: 'm5.large',
  cloud_provider_id: 'aws',
  product: 'rosa',
  autoscaling_enabled: false,
  nodes_compute: 9, // 3 per zone for multi-AZ
  worker_volume_size_gib: defaultWorkerNodeVolumeSizeGiB,
  imds: IMDSType.V1AndV2,
  node_labels: [{ key: '', value: '' }],
  billing_model: 'standard',
  cluster_version: { raw_id: '4.15.0' },
  region: 'us-east-1',
  installer_role_arn: 'arn:aws:iam::123456789012:role/ManagedOpenShift-Installer-Role',
};

// Base form values for Hypershift
const baseHypershiftValues = {
  hypershift: 'true',
  multi_az: 'true',
  machine_type: 'm5.large',
  cloud_provider_id: 'aws',
  product: 'rosa',
  autoscaling_enabled: false,
  nodes_compute: 6, // 2 per machine pool, 3 machine pools = 6 total
  worker_volume_size_gib: 120, // Higher minimum for Hypershift
  imds: IMDSType.V2Only,
  billing_model: 'marketplace',
  cluster_version: { raw_id: '4.15.0' },
  region: 'us-east-1',
  installer_role_arn: 'arn:aws:iam::123456789012:role/ManagedOpenShift-Installer-Role',
  selected_vpc: mockVpcWithSubnets,
  machine_pools_subnets: [
    {
      privateSubnetId: 'subnet-private-1a',
    },
    {
      privateSubnetId: 'subnet-private-1b',
    },
  ] as FormSubnet[],
};

export const HypershiftHosted: Story = {
  name: 'Hypershift (Hosted) - Machine Pools & Subnets',
  parameters: {
    initialValues: baseHypershiftValues,
  },
};

export const ClassicMultiAz: Story = {
  name: 'Classic - Multi-AZ Default Machine Pool',
  parameters: {
    initialValues: baseClassicValues,
  },
};

export const ClassicSingleAz: Story = {
  name: 'Classic - Single-AZ Machine Pool',
  parameters: {
    initialValues: {
      ...baseClassicValues,
      multi_az: 'false',
      nodes_compute: 3, // Single AZ
    },
  },
};

export const HypershiftWithAutoscaling: Story = {
  name: 'Hypershift - Autoscaling Enabled',
  parameters: {
    initialValues: {
      ...baseHypershiftValues,
      autoscaling_enabled: true,
      min_replicas: 2,
      max_replicas: 10,
    },
  },
};

export const ClassicWithAutoscaling: Story = {
  name: 'Classic - Autoscaling Enabled',
  parameters: {
    initialValues: {
      ...baseClassicValues,
      autoscaling_enabled: true,
      min_replicas: 3,
      max_replicas: 24,
    },
  },
};

export const LargeInstanceType: Story = {
  name: 'Large Instance Type - c5.2xlarge',
  parameters: {
    initialValues: {
      ...baseClassicValues,
      machine_type: 'c5.2xlarge',
      nodes_compute: 6, // Fewer nodes with larger instances
    },
  },
};

export const CustomVolumeSize: Story = {
  name: 'Custom Root Disk Size - 500GB',
  parameters: {
    initialValues: {
      ...baseClassicValues,
      worker_volume_size_gib: 500,
    },
  },
};

export const WithNodeLabels: Story = {
  name: 'Classic - With Node Labels',
  parameters: {
    initialValues: {
      ...baseClassicValues,
      node_labels: [
        { key: 'environment', value: 'production' },
        { key: 'team', value: 'platform' },
      ],
    },
  },
};

export const StandaloneView: Story = {
  name: 'Standalone (No Wizard Framework)',
  parameters: {
    initialValues: baseClassicValues,
    showInWizardFramework: false,
  },
};
