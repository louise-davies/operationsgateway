import React from 'react';
import {
  Box,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { SearchParams } from '../../app.types';

export const MAX_SHOTS_VALUES = [50, 1000, 'Unlimited'];

export interface MaxShotsProps {
  maxShots: SearchParams['maxShots'];
  changeMaxShots: (maxShots: SearchParams['maxShots']) => void;
}

const MaxShots = (props: MaxShotsProps): React.ReactElement => {
  const { maxShots, changeMaxShots } = props;

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        aria-label="select max shots to display"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          paddingRight: 5,
          overflow: 'hidden',
        }}
      >
        <Grid container direction="row">
          <Grid
            item
            xs={1}
            display="flex"
            alignItems="center"
            justifyContent="left"
          >
            <FormLabel>Max shots</FormLabel>
          </Grid>
          <Grid item xs={11} justifyContent="left" display="flex">
            <FormControl>
              <RadioGroup
                row
                name="max shots group"
                aria-label="select max shots"
                value={maxShots}
                onChange={(_, value) =>
                  Number.isNaN(Number.parseInt(value))
                    ? changeMaxShots('Unlimited')
                    : changeMaxShots(Number(value))
                }
              >
                {MAX_SHOTS_VALUES.map((value, i) => (
                  <FormControlLabel
                    key={i}
                    value={value}
                    control={<Radio />}
                    label={value}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

MaxShots.displayName = 'MaxShots';

export default MaxShots;
