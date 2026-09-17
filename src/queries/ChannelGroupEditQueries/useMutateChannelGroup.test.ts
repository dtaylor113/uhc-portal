import * as clusterService from '~/services/clusterService';
import { renderHook, waitFor } from '~/testUtils';

import { useMutateChannelGroup } from './useMutateChannelGroup';

const mockGetClusterServiceForRegion = jest.spyOn(clusterService, 'getClusterServiceForRegion');
const mockedEditCluster = jest.fn();

describe('useMutateChannelGroup', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const clusterID = 'cluster-456';

  it('calls regional service when region is provided', async () => {
    const region = 'aws.ap-southeast-1.stage';
    // @ts-ignore
    mockGetClusterServiceForRegion.mockReturnValue({
      editCluster: mockedEditCluster,
    });
    mockedEditCluster.mockResolvedValue({});

    const { result } = renderHook(() => useMutateChannelGroup());

    result.current.mutate({ clusterID, channelGroup: 'fast', region });

    await waitFor(() => {
      expect(mockedEditCluster).toHaveBeenCalled();
    });
    expect(mockGetClusterServiceForRegion).toHaveBeenCalledWith(region);
    expect(mockedEditCluster).toHaveBeenCalledWith(clusterID, {
      version: { channel_group: 'fast' },
    });
  });

  it('calls default service when region is not provided', async () => {
    // @ts-ignore
    mockGetClusterServiceForRegion.mockReturnValue({
      editCluster: mockedEditCluster,
    });
    mockedEditCluster.mockResolvedValue({});

    const { result } = renderHook(() => useMutateChannelGroup());

    result.current.mutate({ clusterID, channelGroup: 'stable' });

    await waitFor(() => {
      expect(mockedEditCluster).toHaveBeenCalled();
    });
    expect(mockGetClusterServiceForRegion).toHaveBeenCalledWith(undefined);
    expect(mockedEditCluster).toHaveBeenCalledWith(clusterID, {
      version: { channel_group: 'stable' },
    });
  });
});
