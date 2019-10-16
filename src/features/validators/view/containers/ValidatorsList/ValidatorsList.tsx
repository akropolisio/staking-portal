import React from 'react';
import { of } from 'rxjs';

import { useDeps } from 'core';
import { useTranslate, tKeys as tKeysAll } from 'services/i18n';
import { Table, Typography, CircleProgressBar, Checkbox, Hint } from 'shared/view/elements';
import { usePagination } from 'shared/view/hooks';
import { useSubscribable } from 'shared/helpers/react';

import {
  AddressCell,
  CheckboxCell,
  OtherStakesCell,
  OwnStakeCell,
  UserStakeCell,
  ValidatorCommissionCell,
} from 'features/validators/view/components/validatorsTableCells';

import { useStyles } from './ValidatorsList.style';

export type MakeValidatorsCheckingHandler = (address: string | string[]) => () => void;

interface IProps {
  validatorStashes?: string[];
  checkedValidators?: string[];
  makeValidatorsCheckingHandler?: MakeValidatorsCheckingHandler;
}

const tKeys = tKeysAll.features.validators.list;

function ValidatorsList(props: IProps) {
  const { validatorStashes, checkedValidators, makeValidatorsCheckingHandler } = props;
  const { api } = useDeps();
  const [validators, validatorsMeta] = useSubscribable(
    () => (validatorStashes ? of(validatorStashes) : api.getValidators$()),
    [validatorStashes],
    [],
  );
  const { loaded: validatorsLoaded, error: validatorsLoadingError } = validatorsMeta;

  const classes = useStyles();
  const { t } = useTranslate();

  const { items: paginatedValidators, paginationView } = usePagination(validators || []);

  const renderCheckboxHeaderCell = () => {
    const isChecked =
      checkedValidators && paginatedValidators.every(validator => checkedValidators.includes(validator));

    return (
      <Checkbox
        checked={isChecked}
        onChange={makeValidatorsCheckingHandler ? makeValidatorsCheckingHandler(paginatedValidators) : undefined}
      />
    );
  };

  if (!validatorsLoaded) {
    return (
      <Hint>
        <CircleProgressBar />
      </Hint>
    );
  }

  if (!!validatorsLoadingError) {
    return (
      <Hint>
        <Typography color="error">{validatorsLoadingError}</Typography>
      </Hint>
    );
  }

  return !paginatedValidators.length ? (
    <Hint>
      <Typography>{t(tKeys.notFound.getKey())}</Typography>
    </Hint>
  ) : (
    <div>
      <Table data={paginatedValidators} separated>
        <Table.Column>
          <Table.Head align={'center'}>#</Table.Head>
          <Table.Cell<number> align={'center'}>
            {({ index }) => (
              <Typography key="1" variant="body1" className={classes.memberNumber}>
                {index + 1}
              </Typography>
            )}
          </Table.Cell>
        </Table.Column>
        {!!checkedValidators && !!makeValidatorsCheckingHandler && (
          <Table.Column>
            <Table.Head align={'center'}>{renderCheckboxHeaderCell()}</Table.Head>
            <Table.Cell<string> align={'center'}>
              {({ data }) => (
                <CheckboxCell
                  stashAddress={data}
                  checkedValidators={checkedValidators}
                  makeValidatorsCheckingHandler={makeValidatorsCheckingHandler}
                />
              )}
            </Table.Cell>
          </Table.Column>
        )}
        <Table.Column>
          <Table.Head align={'left'}>{t(tKeys.columns.address.getKey())}</Table.Head>
          <Table.Cell align={'left'}>{({ data }: { data: string }) => <AddressCell stashAddress={data} />}</Table.Cell>
        </Table.Column>
        <Table.Column>
          <Table.Head align={'left'}>{t(tKeys.columns.ownStake.getKey())}</Table.Head>
          <Table.Cell align={'left'}>{({ data }: { data: string }) => <OwnStakeCell stashAddress={data} />}</Table.Cell>
        </Table.Column>
        <Table.Column>
          <Table.Head align={'left'}>{t(tKeys.columns.commission.getKey())}</Table.Head>
          <Table.Cell<string> align={'left'}>
            {({ data }) => <ValidatorCommissionCell stashAddress={data} />}
          </Table.Cell>
        </Table.Column>
        <Table.Column>
          <Table.Head align={'left'}>{t(tKeys.columns.otherStakes.getKey())}</Table.Head>
          <Table.Cell<string> align={'left'}>{({ data }) => <OtherStakesCell stashAddress={data} />}</Table.Cell>
        </Table.Column>
        <Table.Column>
          <Table.Head align={'left'}>{t(tKeys.columns.myStake.getKey())}</Table.Head>
          <Table.Cell<string> align={'left'}>{({ data }) => <UserStakeCell stashAddress={data} />}</Table.Cell>
        </Table.Column>
      </Table>
      <div className={classes.pagination}>{paginationView}</div>
    </div>
  );
}

export default ValidatorsList;
