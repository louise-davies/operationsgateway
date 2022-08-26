import React from 'react';
import PlotSettings from './plotSettings.component';
import Plot from './plot.component';
import {
  Box,
  Grid,
  Drawer,
  IconButton,
  Typography,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { AxisSettings, PlotType } from '../app.types';
import { useRecords } from '../api/records';
import { useScalarChannels } from '../api/channels';

interface PlotWindowProps {}

const drawerWidth = 300;

const PlotWindow = (props: PlotWindowProps) => {
  const [plotTitle, setPlotTitle] = React.useState('');
  const [plotType, setPlotType] = React.useState<PlotType>('scatter');
  const [XAxisSettings, setXAxisSettings] = React.useState<AxisSettings>({
    scale: 'linear',
  });
  const [YAxesSettings, setYAxesSettings] = React.useState<AxisSettings>({
    scale: 'linear',
  });
  const [XAxis, setXAxis] = React.useState<string>('');
  const [YAxis, setYAxis] = React.useState<string>('');

  const [open, setOpen] = React.useState(true);
  const handleDrawerOpen = React.useCallback(() => {
    setOpen(true);
  }, [setOpen]);
  const handleDrawerClose = React.useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const { data: records, isLoading: recordsLoading } = useRecords();
  const { data: channels, isLoading: channelsLoading } = useScalarChannels();

  return (
    <Grid
      container
      direction="row"
      id="plotting-window"
      sx={{
        position: 'relative',
      }}
      spacing={0}
    >
      <Grid item>
        <Drawer
          PaperProps={{
            sx: {
              position: 'absolute',
              width: drawerWidth,
            },
          }}
          BackdropProps={{ sx: { position: 'absolute' } }}
          ModalProps={{
            container: document.getElementById('drawer-container'),
            sx: { position: 'absolute' },
          }}
          variant="persistent"
          anchor="left"
          open={open}
        >
          <Box mr={1} ml={1}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography>Config</Typography>
              <IconButton
                onClick={handleDrawerClose}
                aria-label="close settings"
              >
                <ChevronLeftIcon />
              </IconButton>
            </Box>
            <PlotSettings
              channels={channels ?? []}
              changePlotTitle={setPlotTitle}
              plotType={plotType}
              changePlotType={setPlotType}
              XAxis={XAxis}
              YAxis={YAxis}
              changeXAxis={setXAxis}
              changeYAxis={setYAxis}
              XAxisSettings={XAxisSettings}
              changeXAxisSettings={setXAxisSettings}
              YAxesSettings={YAxesSettings}
              changeYAxesSettings={setYAxesSettings}
            />
          </Box>
          {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
          <Backdrop
            component="div"
            sx={{ position: 'absolute', zIndex: 100, height: 'inherit' }}
            open={recordsLoading || channelsLoading}
            role="none"
            aria-hidden={false}
          >
            <CircularProgress
              id="settings-loading-indicator"
              aria-label="settings-loading-indicator"
            />
          </Backdrop>
        </Drawer>
      </Grid>

      <Grid
        item
        sx={
          open
            ? {
                marginLeft: `${drawerWidth}px`,
                width: `calc(100% - ${drawerWidth}px)`,
              }
            : { width: '100%' }
        }
      >
        <IconButton
          color="inherit"
          aria-label="open settings"
          onClick={handleDrawerOpen}
          sx={{ position: 'absolute', ...(open && { display: 'none' }) }}
        >
          <SettingsIcon />
        </IconButton>
        <Plot
          records={records ?? []}
          channels={channels ?? []}
          title={plotTitle}
          type={plotType}
          XAxis={XAxis}
          YAxis={YAxis}
          XAxisSettings={XAxisSettings}
          YAxesSettings={YAxesSettings}
        />
      </Grid>
      {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
      <Backdrop
        component="div"
        sx={{ position: 'absolute', zIndex: 100, height: 'inherit' }}
        open={recordsLoading || channelsLoading}
        role="none"
        aria-hidden={false}
      >
        <CircularProgress
          id="plot-loading-indicator"
          aria-label="plot-loading-indicator"
        />
      </Backdrop>
    </Grid>
  );
};

export default PlotWindow;
