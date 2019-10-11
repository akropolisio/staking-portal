import { Theme, colors, makeStyles } from 'shared/styles';

export const useStyles = makeStyles((theme: Theme) => {
  return {
    memberNumber: {
      color: colors.topaz,
    },

    pagination: {
      marginBottom: theme.spacing(2),
    },

    iconButton: {
      margin: `${theme.spacing(-1.5)}px 0`,
    },
  };
});
