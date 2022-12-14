import React from 'react';
import { Grid, Box, styled, Tab, Tabs } from '@mui/material';
import {
  XAxisScale,
  YAxesScale,
  FullScalarChannelMetadata,
  PlotType,
  SelectedPlotChannel,
} from '../../app.types';
import ChartTypeButtons from './chartTypeButtons.component';
import PlotTitleField from './plotTitleField.component';
import XAxisTab from './xAxisTab.component';
import YAxisTab from './yAxisTab.component';

type TabValue = 'X' | 'Y';

interface TabPanelProps {
  children?: React.ReactNode;
  value: TabValue;
  label: TabValue;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, label, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== label}
      id={`${label}-tabpanel`}
      aria-labelledby={`${label}-tab`}
      {...other}
    >
      {value === label && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(label: TabValue) {
  return {
    id: `${label}-tab`,
    'aria-controls': `${label}-tabpanel`,
  };
}

const StyledTab = styled(Tab)(() => ({
  minHeight: 30,
  minWidth: 10,
  height: 30,
  width: 10,
}));

export interface PlotSettingsControllerProps {
  selectedRecordTableChannels: FullScalarChannelMetadata[];
  allChannels: FullScalarChannelMetadata[];
  plotTitle: string;
  changePlotTitle: (title: string) => void;
  plotType: PlotType;
  changePlotType: (plotType: PlotType) => void;
  XAxis?: string;
  changeXAxis: (value: string) => void;
  XAxisScale: XAxisScale;
  changeXAxisScale: (XAxisScale: XAxisScale) => void;
  leftYAxisScale: YAxesScale;
  changeLeftYAxisScale: (YAxisScale: YAxesScale) => void;
  rightYAxisScale: YAxesScale;
  changeRightYAxisScale: (YAxisScale: YAxesScale) => void;
  selectedPlotChannels: SelectedPlotChannel[];
  changeSelectedPlotChannels: (
    selectedPlotChannels: SelectedPlotChannel[]
  ) => void;
  xMinimum?: number;
  xMaximum?: number;
  leftYAxisMinimum?: number;
  leftYAxisMaximum?: number;
  rightYAxisMinimum?: number;
  rightYAxisMaximum?: number;
  changeXMinimum: (value: number | undefined) => void;
  changeXMaximum: (value: number | undefined) => void;
  changeLeftYAxisMinimum: (value: number | undefined) => void;
  changeLeftYAxisMaximum: (value: number | undefined) => void;
  changeRightYAxisMinimum: (value: number | undefined) => void;
  changeRightYAxisMaximum: (value: number | undefined) => void;
  selectedColours: string[];
  remainingColours: string[];
  changeSelectedColours: (selected: string[]) => void;
  changeRemainingColours: (remaining: string[]) => void;
}

const PlotSettingsController = (props: PlotSettingsControllerProps) => {
  const {
    selectedRecordTableChannels,
    allChannels,
    plotTitle,
    changePlotTitle,
    plotType,
    changePlotType,
    XAxis,
    changeXAxis,
    XAxisScale,
    changeXAxisScale,
    leftYAxisScale,
    changeLeftYAxisScale,
    rightYAxisScale,
    changeRightYAxisScale,
    selectedPlotChannels,
    changeSelectedPlotChannels,
    xMinimum,
    xMaximum,
    leftYAxisMinimum,
    leftYAxisMaximum,
    rightYAxisMinimum,
    rightYAxisMaximum,
    changeXMinimum,
    changeXMaximum,
    changeLeftYAxisMinimum,
    changeLeftYAxisMaximum,
    changeRightYAxisMinimum,
    changeRightYAxisMaximum,
    selectedColours,
    remainingColours,
    changeSelectedColours,
    changeRemainingColours,
  } = props;

  const [XYTabValue, setXYTabValue] = React.useState<TabValue>('X');

  const handleXYTabChange = React.useCallback(
    (event: React.SyntheticEvent, newValue: TabValue) => {
      setXYTabValue(newValue);
    },
    [setXYTabValue]
  );

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <PlotTitleField
          plotTitle={plotTitle}
          changePlotTitle={changePlotTitle}
        />
      </Grid>
      <Grid item>
        <ChartTypeButtons plotType={plotType} changePlotType={changePlotType} />
      </Grid>
      <Grid item>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={XYTabValue}
            onChange={handleXYTabChange}
            aria-label="tabs"
            sx={{ height: 30, minHeight: 30 }}
          >
            <StyledTab value="X" label="X" {...a11yProps('X')} />
            <StyledTab value="Y" label="Y" {...a11yProps('Y')} />
          </Tabs>
        </Box>
        <TabPanel value={XYTabValue} label={'X'}>
          <XAxisTab
            allChannels={allChannels}
            XAxisScale={XAxisScale}
            XAxis={XAxis}
            changeXAxis={changeXAxis}
            changeXAxisScale={changeXAxisScale}
            initialXMinimum={xMinimum}
            initialXMaximum={xMaximum}
            changeXMinimum={changeXMinimum}
            changeXMaximum={changeXMaximum}
          />
        </TabPanel>
        <TabPanel value={XYTabValue} label={'Y'}>
          <YAxisTab
            selectedRecordTableChannels={selectedRecordTableChannels}
            allChannels={allChannels}
            selectedPlotChannels={selectedPlotChannels}
            changeSelectedPlotChannels={changeSelectedPlotChannels}
            initialLeftYAxisMinimum={leftYAxisMinimum}
            initialLeftYAxisMaximum={leftYAxisMaximum}
            changeLeftYAxisMinimum={changeLeftYAxisMinimum}
            changeLeftYAxisMaximum={changeLeftYAxisMaximum}
            initialRightYAxisMinimum={rightYAxisMinimum}
            initialRightYAxisMaximum={rightYAxisMaximum}
            changeRightYAxisMinimum={changeRightYAxisMinimum}
            changeRightYAxisMaximum={changeRightYAxisMaximum}
            leftYAxisScale={leftYAxisScale}
            changeLeftYAxisScale={changeLeftYAxisScale}
            rightYAxisScale={rightYAxisScale}
            changeRightYAxisScale={changeRightYAxisScale}
            initialSelectedColours={selectedColours}
            initialRemainingColours={remainingColours}
            changeSelectedColours={changeSelectedColours}
            changeRemainingColours={changeRemainingColours}
          />
        </TabPanel>
      </Grid>
    </Grid>
  );
};

export default PlotSettingsController;
