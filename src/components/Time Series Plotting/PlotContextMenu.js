import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Menu,
  Switch,
  FormControlLabel,
  TextField,
  FormControl,
  Typography,
  Divider,
  MenuItem,
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { PlotPropertyName } from "../../models/StorageUtility";
import ColorPicker from "../ColorPicker";

const useStyles = makeStyles((theme) => ({
  contentStyle: {
    display: "flex",
    justifyContent: "space-between",
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    height: 50,
  },
  customWidth: {
    width: "360px",
  },
}));

const chartTypeOptions = ["Trend", "Step", "Step & Label"];

const lowFrequencyFilterOptions = [
  "No Filter",
  "0.1",
  "0.2",
  "0.3",
  "0.5",
  "1",
  "3",
  "5",
  "10",
];

const highFrequencyFilterOptons = [
  "7",
  "12",
  "15",
  "30",
  "35",
  "50",
  "70",
  "100",
  "No Filter",
];

const notchFilterOptions = ["None", "50 Hz", "60 Hz"];

export default function PlotContextMenu(props) {
  const classes = useStyles();

  return (
    <Menu
      keepMounted
      open={props.mouseY !== null}
      onClose={props.handleClose}
      anchorReference="anchorPosition"
      anchorPosition={
        props.mouseY !== null && props.mouseX !== null
          ? { top: props.mouseY, left: props.mouseX }
          : undefined
      }
    >
      <Typography variant="h6" align="center">
        {props.channelName} Plot Properties
      </Typography>
      <Divider />
      <FormControlLabel
        control={
          <TextField
            id={PlotPropertyName.chartType}
            key={PlotPropertyName.chartType}
            select
            value={props.chartType}
            onChange={props.handleChartTypeChange}
            style={{ width: 120 }}
            SelectProps={{
              MenuProps: {
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "left",
                },
                getContentAnchorEl: null,
              },
            }}
          >
            {chartTypeOptions.map((chartType) => (
              <MenuItem value={chartType} key={chartType}>
                {chartType}
              </MenuItem>
            ))}
          </TextField>
        }
        label="Plot Type"
        labelPlacement="start"
        className={classes.contentStyle}
      />
      <FormControl className={classes.customWidth}>
        <FormControlLabel
          control={
            <ColorPicker
              currentColor={props.lineColor}
              handleColorChange={props.handleColorChange}
            />
          }
          label="Line Color"
          labelPlacement="start"
          className={classes.contentStyle}
        />
        <FormControlLabel
          control={
            <Switch
              checked={props.polarity}
              onChange={props.handlePolarityChange}
              name="Polarity"
            />
          }
          label="Polarity"
          labelPlacement="start"
          className={classes.contentStyle}
        />
        <FormControlLabel
          control={
            <Switch
              checked={props.isAutoScaled}
              onChange={props.handleIsAutoScaledChange}
              name="isAutoScaled"
            />
          }
          label="Is Auto Scaled"
          labelPlacement="start"
          className={classes.contentStyle}
        />
        {!props.isAutoScaled && <FormControlLabel
          control={
            <TextField
              id={props.channelName + PlotPropertyName.range}
              key={props.channelName + PlotPropertyName.range}
              value={props.range}
              onChange={props.handleRangeChange}
              style={{ width: 120 }}
            />
          }
          labelPlacement="start"
          className={classes.contentStyle}
          style={{marginTop: -20}}
        />}
        <FormControlLabel
          control={
            <TextField
              id={props.channelName + PlotPropertyName.referenceLines}
              key={props.channelName + PlotPropertyName.referenceLines}
              value={props.referenceLines}
              onChange={props.handleReferenceLinesChange}
              style={{ width: 120 }}
              placeholder="-75, 75"
            />
          }
          label="Reference Lines"
          labelPlacement="start"
          className={classes.contentStyle}
        />
        <FormControlLabel
          control={
            <TextField
              select
              id={PlotPropertyName.referenceChannels}
              key={PlotPropertyName.referenceChannels}
              name={PlotPropertyName.referenceChannels}
              SelectProps={{
                multiple: true,
                value: props.referenceChannels,
                onChange: props.handleReferenceChannelsChange,
                MenuProps: {
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                },
              }}
              style={{ width: 120 }}
            >
              {props.referenceChannelOptions.map(
                (channelName) =>
                  channelName !== props.channelName && (
                    <MenuItem id={channelName} value={channelName}>
                      {channelName}
                    </MenuItem>
                  )
              )}
            </TextField>
          }
          label="Reference Channels"
          labelPlacement="start"
          className={classes.contentStyle}
        />
        <FormControlLabel
          control={
            <Autocomplete
              id={props.channelName + PlotPropertyName.lowFrequencyFilter}
              key={props.channelName + PlotPropertyName.lowFrequencyFilter}
              freeSolo
              options={lowFrequencyFilterOptions}
              value={props.lowFrequencyFilter}
              renderInput={(params) => (
                <TextField
                  {...params}
                  key={PlotPropertyName.lowFrequencyFilter}
                  margin="normal"
                  style={{ width: 120 }}
                  onChange={props.handleFilterChange(
                    PlotPropertyName.lowFrequencyFilter
                  )}
                  onSelect={props.handleFilterChange(
                    PlotPropertyName.lowFrequencyFilter
                  )}
                />
              )}
            />
          }
          label="Low Frequency Filter (Hz)"
          labelPlacement="start"
          className={classes.contentStyle}
        />
        <FormControlLabel
          control={
            <Autocomplete
              id={props.channelName + PlotPropertyName.highFrequencyFilter}
              key={props.channelName + PlotPropertyName.highFrequencyFilter}
              freeSolo
              options={highFrequencyFilterOptons}
              value={props.highFrequencyFilter}
              renderInput={(params) => (
                <TextField
                  {...params}
                  key={PlotPropertyName.highFrequencyFilter}
                  margin="normal"
                  style={{ width: 120 }}
                  onSelect={props.handleFilterChange(
                    PlotPropertyName.highFrequencyFilter
                  )}
                  onChange={props.handleFilterChange(
                    PlotPropertyName.highFrequencyFilter
                  )}
                />
              )}
            />
          }
          label="High Frequency Filter (Hz)"
          labelPlacement="start"
          className={classes.contentStyle}
        />
        <FormControlLabel
          control={
            <TextField
              id={PlotPropertyName.notchFilter}
              key={PlotPropertyName.notchFilter}
              select
              value={props.notchFilter}
              onChange={props.handleFilterChange(PlotPropertyName.notchFilter)}
              style={{ width: 120 }}
              SelectProps={{
                MenuProps: {
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                },
              }}
            >
              {notchFilterOptions.map((filter) => (
                <MenuItem value={filter} key={filter}>
                  {filter}
                </MenuItem>
              ))}
            </TextField>
          }
          label="Notch Filter"
          labelPlacement="start"
          className={classes.contentStyle}
        />
      </FormControl>
    </Menu>
  );
}
