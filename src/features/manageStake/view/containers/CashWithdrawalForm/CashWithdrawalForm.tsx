import React from 'react';
import { FORM_ERROR } from 'final-form';
import BN from 'bn.js';

import { useDeps } from 'core';
import { useTranslate, tKeys as tKeysAll } from 'services/i18n';

import { getErrorMsg } from 'shared/helpers';
import BalanceChangingForm, { IFormData } from '../../components/BalanceChangingForm/BalanceChangingForm';
import { useSubscribable } from 'shared/helpers/react';

interface IProps {
  address: string;
  onCancel(): void;
}

function CashWithdrawalForm(props: IProps) {
  const { onCancel, address } = props;
  const { t } = useTranslate();
  const tKeys = tKeysAll.features.manageStake.cashWithdrawalForm;

  const { api } = useDeps();
  const [info] = useSubscribable(() => api.getStakingInfo$(address), [address]);
  const bondedAmount = info && info.stakingLedger ? info.stakingLedger.active : new BN(0);

  const onSubmit = React.useCallback(
    async (values: IFormData) => {
      try {
        await api.withdrawFromStake(address, new BN(values.amount));

        onCancel();
      } catch (error) {
        return {
          [FORM_ERROR]: getErrorMsg(error),
        };
      }
    },
    [address, onCancel],
  );

  return (
    <BalanceChangingForm
      availableAmount={bondedAmount}
      title={t(tKeys.title.getKey())}
      placeholder={t(tKeys.field.placeholder.getKey())}
      cancelButtonText={t(tKeys.cancelButtonText.getKey())}
      submitButtonText={t(tKeys.submitButtonText.getKey())}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}

export default CashWithdrawalForm;
