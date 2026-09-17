import { useMutation } from '@tanstack/react-query';

import { getClusterServiceForRegion } from '~/services/clusterService';

import { formatErrorData } from '../helpers';

export const useMutateChannelGroup = () => {
  const { data, isError, isPending, isSuccess, mutate, mutateAsync, error, status } = useMutation({
    mutationKey: ['clusterService', 'editChannelGroup'],
    mutationFn: async ({
      clusterID,
      channelGroup,
      region,
    }: {
      clusterID: string;
      channelGroup: string;
      region?: string;
    }) => {
      const clusterService = getClusterServiceForRegion(region);

      return clusterService.editCluster(clusterID, {
        version: {
          channel_group: channelGroup,
        },
      });
    },
  });

  return {
    data,
    isError,
    error: formatErrorData(isPending, isError, error),
    isSuccess,
    isPending,
    mutate,
    mutateAsync,
    status,
  };
};
