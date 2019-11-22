import * as React from 'react';
import { withRouter, RouteComponentProps, Link } from 'react-router-dom';
import BN from 'bn.js';
import { DerivedSessionInfo } from '@polkadot/api-derive/types';

import { IMetric, BalanceMetrics } from 'shared/view/components/BalanceMetrics/BalanceMetrics';
import { Back } from 'shared/view/elements/Icons';
import { Grid, IconButton, Typography, Loading } from 'shared/view/elements';
import { withComponent, useSubscribable } from 'shared/helpers/react';
import BalanceValue from 'components/BalanceValue';
import { useTranslate, tKeys as tKeysAll } from 'services/i18n';
import { useDeps } from 'core';

import { provideStyles, StylesProps } from './Header.style';

const LinkIconButton = withComponent(Link)(IconButton);

interface IOwnProps {
  actions?: React.ReactNode[];
  backRoutePath?: string;
  title: React.ReactNode;
  additionalContent?: React.ReactNode;
  showMetrics?: boolean;
  showEra?: boolean;
}

type IProps = IOwnProps & StylesProps & RouteComponentProps;

function Header(props: IProps) {
  const { classes, actions, title, backRoutePath, additionalContent, showMetrics, showEra } = props;
  const { t } = useTranslate();
  const tKeys = tKeysAll.shared;
  const { api } = useDeps();

  const [{ totalBalance, totalBonded }, totalBalanceInfoMeta] = useSubscribable(() => api.getTotalBalanceInfo$(), [], {
    totalBalance: new BN(0),
    totalBonded: new BN(0),
  });

  const [{ eraProgress, eraLength }, sessionInfoMeta] = useSubscribable(
    () => api.getSessionInfo$(),
    [],
    {} as DerivedSessionInfo,
  );

  const eraMetrics = React.useMemo(
    () => [
      {
        title: t(tKeys.era.getKey()),
        value: `${eraProgress}/${eraLength}`,
      },
    ],
    [eraProgress, eraLength],
  );

  const metrics: IMetric[] = React.useMemo(
    () => [
      {
        title: t(tKeys.balance.getKey()),
        value: <BalanceValue input={totalBalance} />,
      },
      {
        title: t(tKeys.bonded.getKey()),
        value: <BalanceValue input={totalBonded} />,
      },
      ...eraMetrics,
    ],
    [t, totalBalance, totalBonded, eraProgress, eraLength],
  );

  return (
    <div className={classes.root}>
      <Grid container alignItems="center" spacing={2}>
        {backRoutePath && (
          <Grid item>
            <LinkIconButton to={backRoutePath} className={classes.backButton}>
              <Back />
            </LinkIconButton>
          </Grid>
        )}
        <Grid item xs zeroMinWidth>
          <Typography variant="h5" noWrap weight="bold" className={classes.title}>
            {title}
          </Typography>
        </Grid>
        {actions &&
          !!actions.length &&
          actions.map((action, index) => (
            <Grid item key={index}>
              {action}
            </Grid>
          ))}
        {(showMetrics || showEra) && (
          <Loading meta={[totalBalanceInfoMeta, sessionInfoMeta]} progressVariant="circle" hideError>
            <Grid item>
              <BalanceMetrics className={classes.metrics} metrics={showMetrics ? metrics : eraMetrics} />
            </Grid>
          </Loading>
        )}
        {!!additionalContent && (
          <Grid item xs={12}>
            {additionalContent}
          </Grid>
        )}
      </Grid>
    </div>
  );
}

export { IProps };
export default withRouter(provideStyles(Header));
