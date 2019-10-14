import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';

import { useTranslate } from 'services/i18n';
import { BaseLayout } from 'modules/shared';
import { ValidatorsListEditingForm } from 'features/manageStake';

function Demo(_props: RouteComponentProps<any>) {
  const { t, tKeys } = useTranslate();

  return (
    <BaseLayout title={t(tKeys.shared.mainTitle.getKey())}>
      <Grid container justify="center" spacing={10}>
        <Grid item xs={12}>
          <Box mb={10}>
            <ValidatorsListEditingForm />
          </Box>
        </Grid>
      </Grid>
    </BaseLayout>
  );
}

export default Demo;
