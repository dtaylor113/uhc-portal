import React from 'react';
import { useDispatch } from 'react-redux';

import {
  Button,
  Content,
  Flex,
  FlexItem,
  Popover,
  PopoverPosition,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';

import { deleteQueryParam, getQueryParam } from '~/common/queryHelpers';
import { normalizedProducts, STANDARD_TRIAL_BILLING_MODEL_TYPE } from '~/common/subscriptionTypes';
import supportLinks from '~/common/supportLinks.mjs';
import {
  getMinReplicasCount,
  getNodesCount,
} from '~/components/clusters/common/ScaleSection/AutoScaleSection/AutoScaleHelper';
import { CloudProviderType } from '~/components/clusters/wizards/common/constants';
import { RadioGroupField, RadioGroupOption } from '~/components/clusters/wizards/form';
import { useFormState } from '~/components/clusters/wizards/hooks';
import { FieldId } from '~/components/clusters/wizards/osd/constants';
import ExternalLink from '~/components/common/ExternalLink';
import { HIDE_RH_MARKETPLACE } from '~/queries/featureGates/featureConstants';
import { useFeatureGate } from '~/queries/featureGates/useFetchFeatureGate';
import { clustersActions } from '~/redux/actions';
import { useGlobalState } from '~/redux/hooks';
import CreateOSDWizardIntro from '~/styles/images/CreateOSDWizard-intro.png';
import { SubscriptionCommonFieldsCluster_billing_model as SubscriptionCommonFieldsClusterBillingModel } from '~/types/accounts_mgmt.v1';

import { MarketplaceSelectField } from './MarketplaceSelectField';
import { useGetBillingQuotas } from './useGetBillingQuotas';

import './BillingModel.scss';

export const BillingModel = () => {
  const hideRHMarketplace = useFeatureGate(HIDE_RH_MARKETPLACE);
  const sourceIsGCP = getQueryParam('source') === 'gcp';
  const {
    values: {
      [FieldId.Product]: product,
      [FieldId.BillingModel]: billingModel,
      [FieldId.MarketplaceSelection]: selectedMarketplace,
    },
    values,
    setFieldValue,
  } = useFormState();
  const dispatch = useDispatch();
  const { clusterVersions: getInstallableVersionsResponse } = useGlobalState(
    (state) => state.clusters,
  );

  const clearPreviousVersionsReponse = () => {
    // clears versions from redux if it was loaded before, since different billingModels
    // can get different versions
    if (getInstallableVersionsResponse?.fulfilled) {
      dispatch(clustersActions.clearInstallableVersions());
    }
  };

  const quotas = useGetBillingQuotas({ product });
  const showOsdTrial = quotas.osdTrial;

  const trialDescription = (
    <p>
      <ExternalLink href={supportLinks.BILLING_MODEL_KB} noIcon noTarget>
        Try OpenShift Dedicated
      </ExternalLink>{' '}
      for free for 60 days. Upgrade anytime
    </p>
  );

  const marketplaceQuotaDescription = (
    <>
      {selectedMarketplace === SubscriptionCommonFieldsClusterBillingModel.marketplace && (
        <p>Use Red Hat Marketplace to subscribe and pay based on the services you use</p>
      )}
      {selectedMarketplace === SubscriptionCommonFieldsClusterBillingModel.marketplace_gcp && (
        <p>Use Google Cloud Marketplace to subscribe and pay based on the services you use</p>
      )}
      {!(selectedMarketplace === SubscriptionCommonFieldsClusterBillingModel.marketplace) &&
        !(selectedMarketplace === SubscriptionCommonFieldsClusterBillingModel.marketplace_gcp) && (
          <p>Use your cloud marketplace to subscribe and pay based on the services you use</p>
        )}
    </>
  );

  const rhmLink = (
    <ExternalLink
      href="https://marketplace.redhat.com/en-us/products/red-hat-openshift-dedicated"
      noIcon
    >
      Red Hat Marketplace
    </ExternalLink>
  );

  const gcpLink = (
    <ExternalLink
      href="https://console.cloud.google.com/marketplace/product/redhat-marketplace/red-hat-openshift-dedicated"
      noIcon
    >
      Google Cloud
    </ExternalLink>
  );

  const marketplaceDisabledDescription = (
    <>
      {marketplaceQuotaDescription}
      <div>
        <Popover
          position={PopoverPosition.right}
          headerContent="On-Demand subscription"
          bodyContent={
            <p>
              Billing based on cluster consumption. Purchase a subscription via{' '}
              {!hideRHMarketplace ? `${rhmLink} or  ` : ''}
              {gcpLink}
            </p>
          }
          aria-label="help"
        >
          <Button icon={<OutlinedQuestionCircleIcon />} variant="link">
            How can I purchase a subscription?
          </Button>
        </Popover>
      </div>
    </>
  );

  const subOptions = [
    ...(showOsdTrial
      ? [
          {
            value: STANDARD_TRIAL_BILLING_MODEL_TYPE,
            label: 'Free trial (upgradeable)',
            // 60 days may be updated later based on an account capability
            // https://issues.redhat.com/browse/SDB-1846
            description: trialDescription,
          },
        ]
      : []),
    {
      disabled: !quotas.standardOsd,
      value: SubscriptionCommonFieldsClusterBillingModel.standard,
      label: 'Annual: Fixed capacity subscription from Red Hat',
      description: 'Use the quota pre-purchased by your organization',
    },
    {
      disabled: (!quotas.marketplace || hideRHMarketplace) && !quotas.gcpResources,
      value: 'marketplace-select',
      // check the radio button if billingModel starts with 'marketplace'
      shouldCheck: (fieldValue: string, radioValue: React.ReactText) =>
        fieldValue.startsWith('marketplace') && `${radioValue}` === 'marketplace-select',
      label: (
        <>
          <div>
            On-Demand: Flexible usage billed through {gcpLink}{' '}
            {!hideRHMarketplace ? <>or {rhmLink}</> : ''}
          </div>
          <MarketplaceSelectField
            hasGcpQuota={quotas.gcpResources}
            hasRhmQuota={quotas.marketplace}
          />
        </>
      ),
      description:
        (!quotas.marketplace || hideRHMarketplace) && !quotas.gcpResources
          ? marketplaceDisabledDescription
          : marketplaceQuotaDescription,
    },
  ];

  React.useEffect(() => {
    if (product === normalizedProducts.OSDTrial) {
      if (showOsdTrial) {
        setFieldValue(FieldId.BillingModel, STANDARD_TRIAL_BILLING_MODEL_TYPE);
        setFieldValue(FieldId.Byoc, 'true');
      } else {
        setFieldValue(FieldId.Product, normalizedProducts.OSD);
      }
    }

    // Select marketplace billing if user only has marketplace quota
    // Also, if the selected default billing model is disabled
    // Default to marketplace
    if (
      (!showOsdTrial || billingModel === SubscriptionCommonFieldsClusterBillingModel.standard) &&
      quotas.marketplace &&
      !quotas.standardOsd &&
      !billingModel.startsWith(SubscriptionCommonFieldsClusterBillingModel.marketplace)
    ) {
      setFieldValue(FieldId.BillingModel, SubscriptionCommonFieldsClusterBillingModel.marketplace);
    }

    clearPreviousVersionsReponse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    product,
    billingModel,
    showOsdTrial,
    quotas.marketplace,
    quotas.standardOsd,
    selectedMarketplace,
  ]);

  React.useEffect(() => {
    if (sourceIsGCP) {
      setFieldValue(
        FieldId.MarketplaceSelection,
        SubscriptionCommonFieldsClusterBillingModel.marketplace_gcp,
        false,
      );
      setFieldValue(FieldId.CloudProvider, CloudProviderType.Gcp, false);

      // it's possible the select was used before the parent radio button was selected
      // ensure the parent radio button is selected and the correct values are set
      setFieldValue(
        FieldId.BillingModel,
        SubscriptionCommonFieldsClusterBillingModel.marketplace_gcp,
        false,
      );
      setFieldValue(FieldId.Byoc, 'true', false);
      setFieldValue(FieldId.Product, normalizedProducts.OSD, false);
      deleteQueryParam('source');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceIsGCP]);

  let isRhInfraQuotaDisabled = false;
  let isByocQuotaDisabled = false;

  if (billingModel.startsWith(SubscriptionCommonFieldsClusterBillingModel.marketplace)) {
    isRhInfraQuotaDisabled = !quotas.marketplaceRhInfra;
    isByocQuotaDisabled = !quotas.marketplaceByoc;
  } else {
    isRhInfraQuotaDisabled = !quotas.rhInfra;
    isByocQuotaDisabled = !quotas.byoc;
  }

  const infraOptions: RadioGroupOption[] = [
    {
      label: 'Customer cloud subscription',
      description: 'Provision the cluster using your existing cloud provider account',
      value: 'true',
      disabled: isByocQuotaDisabled,
      tooltip: isByocQuotaDisabled
        ? 'No available quota for Customer cloud subscription in your organization.'
        : null,
    },
    {
      label: 'Red Hat cloud account',
      description: 'Deploy in cloud provider accounts owned by Red Hat',
      value: 'false',
      disabled: isRhInfraQuotaDisabled,
      tooltip: isRhInfraQuotaDisabled
        ? 'No available quota for Red Hat cloud account in your organization.'
        : null,
    },
  ];

  const onBillingModelChange = (_event: React.FormEvent<HTMLDivElement>, value: string) => {
    let selectedProduct = normalizedProducts.OSD;

    if (value !== SubscriptionCommonFieldsClusterBillingModel.standard) {
      setFieldValue(FieldId.Byoc, 'true');
    }

    if (value === STANDARD_TRIAL_BILLING_MODEL_TYPE) {
      selectedProduct = normalizedProducts.OSDTrial;
    }

    setFieldValue(FieldId.Product, selectedProduct);
  };

  const onByocChange = (_event: React.FormEvent<HTMLDivElement>, value: string) => {
    const isBYOC = value === 'true';
    const isMultiAz = values[FieldId.MultiAz] === 'true';

    setFieldValue(FieldId.NodesCompute, getNodesCount(isBYOC, isMultiAz, true));
    setFieldValue(FieldId.MinReplicas, getMinReplicasCount(isBYOC, isMultiAz, true));
    setFieldValue(FieldId.MaxReplicas, '');
  };

  return (
    <Flex alignItems={{ default: 'alignItemsFlexStart' }}>
      <FlexItem flex={{ default: 'flex_3' }}>
        <Stack hasGutter>
          <StackItem className="pf-v6-u-mb-xl">
            <Title headingLevel="h2" className="pf-v6-u-pb-md">
              Welcome to Red Hat OpenShift Dedicated
            </Title>
            <Content component="p" id="welcome-osd-text">
              Reduce operational complexity and focus on building applications that add more value
              to your business with Red Hat OpenShift Dedicated, a fully-managed service of Red Hat
              OpenShift on Google Cloud.
            </Content>
          </StackItem>

          <StackItem>
            <Title headingLevel="h3" className="pf-v6-u-mb-sm">
              Subscription type
            </Title>
            <RadioGroupField
              name={FieldId.BillingModel}
              options={subOptions}
              onChange={onBillingModelChange}
            />
          </StackItem>

          <StackItem>
            <Title headingLevel="h3" className="pf-v6-u-mb-sm">
              Infrastructure type
            </Title>

            <RadioGroupField name={FieldId.Byoc} options={infraOptions} onChange={onByocChange} />
          </StackItem>
        </Stack>
      </FlexItem>

      <FlexItem flex={{ default: 'flex_1' }}>
        <img
          src={CreateOSDWizardIntro}
          className="billing-model_osd-logo"
          aria-hidden="true"
          alt=""
        />
      </FlexItem>
    </Flex>
  );
};
