import React from 'react';
import { Box, Typography, Divider, Grid, TextField } from '@mui/material';
import { Adjust } from '@mui/icons-material';
import { useClickOutside } from '../../hooks';

export interface ShotNumberProps {
  searchParameterShotnumMin?: number;
  searchParameterShotnumMax?: number;
  changeSearchParameterShotnumMin: (min: number | undefined) => void;
  changeSearchParameterShotnumMax: (max: number | undefined) => void;
}

const ShotNumberPopup = (
  props: ShotNumberProps & { invalidRange: boolean }
): React.ReactElement => {
  const {
    searchParameterShotnumMin,
    searchParameterShotnumMax,
    changeSearchParameterShotnumMin,
    changeSearchParameterShotnumMax,
    invalidRange,
  } = props;

  return (
    <div style={{ paddingTop: 5, paddingLeft: 5 }}>
      <Typography gutterBottom sx={{ fontWeight: 'bold' }}>
        Select your shot number
      </Typography>
      <Divider
        sx={{
          marginBottom: 2,
          borderBottomWidth: 2,
          backgroundColor: 'black',
          width: '90%',
        }}
      />
      <Grid container spacing={1}>
        <Grid item xs={5}>
          <TextField
            name="shot number min"
            label="Min"
            value={searchParameterShotnumMin}
            type="number"
            size="small"
            inputProps={{ min: 0 }}
            onChange={(event) =>
              changeSearchParameterShotnumMin(
                event.target.value ? Number(event.target.value) : undefined
              )
            }
            error={invalidRange}
            {...(invalidRange && { helperText: 'Invalid range' })}
          />
        </Grid>
        <Grid item xs={1}>
          <p>to</p>
        </Grid>
        <Grid item xs={5}>
          <TextField
            name="shot number max"
            label="Max"
            value={searchParameterShotnumMax}
            type="number"
            size="small"
            inputProps={{ min: 0 }}
            onChange={(event) =>
              changeSearchParameterShotnumMax(
                event.target.value ? Number(event.target.value) : undefined
              )
            }
            error={invalidRange}
            {...(invalidRange && { helperText: 'Invalid range' })}
          />
        </Grid>
      </Grid>
    </div>
  );
};

const ShotNumber = (props: ShotNumberProps): React.ReactElement => {
  const popover = React.useRef<HTMLDivElement | null>(null);
  const parent = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, toggle] = React.useState(false);

  const close = React.useCallback(() => toggle(false), []);
  // use parent node which is always mounted to get the document to attach event listeners to
  useClickOutside(popover, close, parent.current?.ownerDocument);

  const invalidRange =
    props.searchParameterShotnumMin !== undefined &&
    props.searchParameterShotnumMax !== undefined
      ? props.searchParameterShotnumMin > props.searchParameterShotnumMax
      : false;

  return (
    <Box sx={{ position: 'relative' }} ref={parent}>
      <Box
        aria-label={`${isOpen ? 'close' : 'open'} shot number search box`}
        sx={{
          border: '1.5px solid',
          borderColor: invalidRange ? 'rgb(214, 65, 65)' : undefined,
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'row',
          paddingRight: 5,
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        onClick={() => toggle(!isOpen)}
      >
        <Adjust sx={{ fontSize: 40, padding: '10px 5px 0px 5px' }} />
        <div>
          <Typography noWrap>Shot Number</Typography>
          <Typography noWrap variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Select
          </Typography>
        </div>
      </Box>
      {isOpen && (
        <Box
          role="dialog"
          sx={{
            border: '1px solid',
            position: 'absolute',
            top: 55,
            zIndex: 2,
            backgroundColor: '#ffffff',
            width: 300,
          }}
          ref={popover}
        >
          <ShotNumberPopup {...props} invalidRange={invalidRange} />
        </Box>
      )}
    </Box>
  );
};

ShotNumber.displayName = 'ShotNumber';

export default ShotNumber;