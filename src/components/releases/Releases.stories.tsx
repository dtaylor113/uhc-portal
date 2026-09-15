import React from 'react';
import axios from 'axios';

import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { OCP5_SUPPORT, TABBED_CLUSTERS } from '~/queries/featureGates/featureConstants';
import { V1_API_URL, V2_API_URL } from '~/services/productLifeCycleService';
import { ProductLifeCycle } from '~/types/product-life-cycles';
import { Graph } from '~/types/upgrades_info.v1';

import ocpLifeCycleStatuses from './__mocks__/ocpLifeCycleStatuses';
import Releases from './Releases';

const FEATURE_GATE_QUERY_KEY = 'featureGate' as const;
const OCP_LIFECYCLE_QUERY_KEY = 'ocpLifeCycleStatus' as const;

const ALL_VERSIONS = ocpLifeCycleStatuses.data.data[0].versions;
const FOUR_X_ONLY_VERSIONS = ALL_VERSIONS.filter((version) => !version.name.startsWith('5.'));

// A distinct, per-channel-prefix patch offset so e.g. "stable-5.0" and "candidate-5.0"
// don't collide on the exact same fake "latest version" — mirrors real staging data,
// where stable/fast/eus/candidate channels for the same minor sit on different patches.
const PATCH_OFFSET_BY_PREFIX: Record<string, number> = { stable: 2, fast: 5, eus: 1, candidate: 7 };

// Toggled per-story by buildQueryClient() just before the QueryClient is constructed —
// see the "Lifecycle fetch failed" story, which intentionally leaves the
// ocpLifeCycleStatus query unseeded so its queryFn actually runs (and needs to fail
// without hitting the real network).
let forceLifecycleFetchError = false;

/**
 * Two real network calls happen behind this page, neither of which we want Storybook
 * to make for real:
 *  - `getOCPLifeCycleStatus` (productLifeCycleService.ts) calls the real, absolute
 *    `access.redhat.com` product-life-cycles API directly — used to seed the "Lifecycle
 *    fetch failed" story with a genuine rejection instead of a real request.
 *  - `getOCPReleaseChannel` (hooks.ts) is a plain axios call (not react-query) to
 *    `/api/upgrades_info/v1/graph` for each channel's "Latest version" text and
 *    candidate-channel popover link. The real staging API has no channels for
 *    not-yet-released 5.x versions and silently falls back to an unrelated 4.x
 *    version, so we fake a per-channel response scoped to that channel's own
 *    major.minor instead.
 * Patched once at module scope.
 */
let isAxiosPatched = false;
const patchAxiosForStorybook = () => {
  if (isAxiosPatched) return;
  isAxiosPatched = true;

  const originalGet = axios.get.bind(axios);

  const fakeGraphForChannel = (channel: string | undefined): { data: Graph } => {
    const match = /^(stable|fast|eus|candidate)-(\d+\.\d+)$/.exec(channel ?? '');
    const [, prefix, version] = match ?? [undefined, 'stable', '4.99'];
    const patch = PATCH_OFFSET_BY_PREFIX[prefix ?? 'stable'] ?? 0;
    return {
      data: {
        version: 1,
        nodes: [
          {
            version: `${version}.${patch}`,
            payload: 'quay.io/openshift-release-dev/ocp-release@sha256:storybook-mock',
            metadata: {},
          },
        ],
        edges: [],
        conditionalEdges: [],
      },
    };
  };

  axios.get = ((url: string, config?: { params?: { channel?: string } }) => {
    if (url === '/api/upgrades_info/v1/graph') {
      return Promise.resolve(fakeGraphForChannel(config?.params?.channel));
    }
    if ((url === V1_API_URL || url === V2_API_URL) && forceLifecycleFetchError) {
      return Promise.reject(new Error('Storybook: simulated lifecycle API failure'));
    }
    return originalGet(url, config);
  }) as typeof axios.get;
};

type BuildQueryClientOptions = {
  isOcp5SupportEnabled: boolean;
  versions: ProductLifeCycle['versions'];
  simulateFetchError: boolean;
};

function buildQueryClient({
  isOcp5SupportEnabled,
  versions,
  simulateFetchError,
}: BuildQueryClientOptions) {
  patchAxiosForStorybook();
  forceLifecycleFetchError = simulateFetchError;

  const queryClient = new QueryClient({
    defaultOptions: {
      // The app's real QueryClient defaults to refetchOnMount: 'always' (see
      // src/components/App/queryClient.ts). Override it here so our seeded data
      // below is what renders, instead of racing a real network call that would
      // fall back to unrelated data and clobber it.
      queries: { retry: false, refetchOnMount: false, refetchOnWindowFocus: false },
    },
  });

  queryClient.setQueryData([FEATURE_GATE_QUERY_KEY, OCP5_SUPPORT], {
    data: { enabled: isOcp5SupportEnabled },
  });
  queryClient.setQueryData([FEATURE_GATE_QUERY_KEY, TABBED_CLUSTERS], { data: { enabled: false } });

  // Leave ocpLifeCycleStatus unseeded when simulating a fetch error, so useQuery
  // actually invokes queryFn (and hits our patched, rejecting axios.get above).
  if (!simulateFetchError) {
    queryClient.setQueryData([OCP_LIFECYCLE_QUERY_KEY, isOcp5SupportEnabled], {
      data: { data: [{ ...ocpLifeCycleStatuses.data.data[0], versions }] },
    });
  }

  return queryClient;
}

type StoryShellProps = {
  isOcp5SupportEnabled?: boolean;
  versions?: ProductLifeCycle['versions'];
  simulateFetchError?: boolean;
};

/**
 * Renders the real {@link Releases} page against seeded lifecycle data (see
 * `__mocks__/ocpLifeCycleStatuses.ts`, the same fixture `Releases.test.tsx` uses),
 * so a reviewer can see the Releases page doc-link fixes render without a live backend.
 */
function ReleasesStoryShell({
  isOcp5SupportEnabled = true,
  versions = ALL_VERSIONS,
  simulateFetchError = false,
}: StoryShellProps) {
  const queryClient = React.useMemo(
    () => buildQueryClient({ isOcp5SupportEnabled, versions, simulateFetchError }),
    [isOcp5SupportEnabled, versions, simulateFetchError],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Releases />
    </QueryClientProvider>
  );
}

const meta = {
  title: 'Releases/Releases',
  component: ReleasesStoryShell,
  parameters: {
    docs: {
      description: {
        component: 'Releases page rendered with mixed OCP v4.x and v5.x lifecycle data.',
      },
    },
  },
} satisfies Meta<typeof ReleasesStoryShell>;

export default meta;

type Story = StoryObj<typeof ReleasesStoryShell>;

export const MixedFourAndFiveX: Story = {
  name: 'OCP 4.x + 5.x versions (ocmui-ocp5-support on)',
};

export const FourXOnly: Story = {
  name: 'OCP 4.x only (ocmui-ocp5-support off)',
  args: {
    isOcp5SupportEnabled: false,
    versions: FOUR_X_ONLY_VERSIONS,
  },
};

export const FetchError: Story = {
  name: 'Lifecycle fetch failed',
  args: {
    simulateFetchError: true,
  },
};
