import React from 'react';
import BN from 'bn.js';

import { useDeps } from 'core';
import { useTranslate } from 'services/i18n';
import { ModalButton } from 'shared/view/components';
import { CircleProgressBar } from 'shared/view/elements';
import { useSubscribable } from 'shared/helpers/react';

import BalanceReplenishmentForm from '../view/containers/BalanceReplenishmentForm/BalanceReplenishmentForm';
import CashWithdrawalForm from '../view/containers/CashWithdrawalForm/CashWithdrawalForm';
import ValidatorsListEditingForm from '../view/containers/ValidatorsListEditingForm/ValidatorsListEditingForm';
import NominatingStop from '../view/containers/NominatingStop/NominatingStop';
import CashRedeeming from '../view/containers/CashRedeeming/CashRedeeming';
import { lightTheme } from 'shared/styles';
import { MuiThemeProvider } from '@material-ui/core/styles';

export function useStakeActions(address: string) {
  const { api } = useDeps();
  const { t, tKeys: allTKeys } = useTranslate();
  const tKeys = allTKeys.features.manageStake.actions;
  const [info, infoMeta] = useSubscribable(() => api.getStakingInfo$(address), [address]);

  const isEmptyNominees = !info || !info.nominators || !info.nominators.length;
  const nominators = (info && info.nominators) || [];
  const redeemable = ((info && info.redeemable) || new BN(0)).toString();

  const infoLoadedWithoutErrors = infoMeta.loaded && !infoMeta.error;

  const changeNomineesButtons = React.useMemo(
    () =>
      isEmptyNominees
        ? [
            <ModalButton
              key="Nominate"
              dialogMaxWidth="lg"
              color="primary"
              variant="contained"
              content={t(tKeys.nominate.getKey())}
            >
              {({ closeModal }) => (
                <MuiThemeProvider theme={lightTheme}>
                  <ValidatorsListEditingForm
                    onCancel={closeModal}
                    address={address}
                    initialCheckedValidators={nominators}
                  />
                </MuiThemeProvider>
              )}
            </ModalButton>,
          ]
        : [
            <ModalButton
              key="Edit nominees"
              dialogMaxWidth="lg"
              color="primary"
              variant="contained"
              content={t(tKeys.editNominees.getKey())}
            >
              {({ closeModal }) => (
                <MuiThemeProvider theme={lightTheme}>
                  <ValidatorsListEditingForm
                    onCancel={closeModal}
                    address={address}
                    initialCheckedValidators={nominators}
                  />
                </MuiThemeProvider>
              )}
            </ModalButton>,
            <ModalButton
              key="Stop nominating"
              color="primary"
              variant="contained"
              content={t(tKeys.stopNominating.getKey())}
            >
              {({ closeModal }) => (
                <MuiThemeProvider theme={lightTheme}>
                  <NominatingStop onCancel={closeModal} address={address} />
                </MuiThemeProvider>
              )}
            </ModalButton>,
          ],
    [isEmptyNominees, address, nominators],
  );

  const redeemButton = (
    <ModalButton key="Redeem" color="primary" variant="contained" content={t(tKeys.redeem.getKey())}>
      {({ closeModal }) => (
        <MuiThemeProvider theme={lightTheme}>
          <CashRedeeming onCancel={closeModal} address={address} />
        </MuiThemeProvider>
      )}
    </ModalButton>
  );

  const actions = React.useMemo(
    () =>
      ([
        [BalanceReplenishmentForm, t(tKeys.deposit.getKey())],
        [CashWithdrawalForm, t(tKeys.withdraw.getKey())],
      ] as const)
        .map(([Form, buttonText]) => (
          <ModalButton color="primary" key={buttonText} variant="contained" content={buttonText}>
            {({ closeModal }) => (
              <MuiThemeProvider theme={lightTheme}>
                <Form onCancel={closeModal} address={address} />
              </MuiThemeProvider>
            )}
          </ModalButton>
        ))
        .concat(infoMeta.loaded ? [] : [<CircleProgressBar key="Loader" />])
        .concat(infoLoadedWithoutErrors && Number(redeemable) ? redeemButton : [])
        .concat(infoLoadedWithoutErrors ? changeNomineesButtons : []),
    [infoLoadedWithoutErrors, changeNomineesButtons, address, redeemable],
  );

  return actions;
}
