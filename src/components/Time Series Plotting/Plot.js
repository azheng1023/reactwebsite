import React, { useEffect, useState } from "react";
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
import { LineChart, Line, YAxis, CartesianGrid } from "recharts";
import StorageUtility, { PlotPropertyName } from "../../models/StorageUtility";
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

export function Plot(props) {
  console.log("Plot called: ");
  const plotRange = props.channelProperties[PlotPropertyName.range];
  const [state, setState] = useState({
    originalRange: plotRange,
    hasFocus: false,
    mouseX: null,
    mouseY: null,
    update: false,
  });

  const handleKeyDown = (event) => {
    if (state.mouseY !== null) {
      return;
    }
    console.log("handleKeyDown");
    event.stopPropagation();
    let currentMin = plotRange[0];
    let currentMax = plotRange[1];
    const delta = currentMax - currentMin;
    switch (event.key) {
      case "0":
        currentMin = state.originalRange[0];
        currentMax = state.originalRange[1];
        break;
      case "+":
        currentMin = currentMin + 0.25 * delta;
        currentMax = currentMax - 0.25 * delta;
        break;
      case "-":
        currentMin = currentMin - 0.5 * delta;
        currentMax = currentMax + 0.5 * delta;
        break;
      case "ArrowUp":
        currentMin = currentMin + 0.25 * delta;
        currentMax = currentMax + 0.25 * delta;
        break;
      case "ArrowDown":
        currentMin = currentMin - 0.25 * delta;
        currentMax = currentMax - 0.25 * delta;
        break;
      default:
        return;
    }
    setState({
      ...state,
      update: true,
    });
    StorageUtility.updateChannelProperty(
      props.channelName,
      PlotPropertyName.range,
      [currentMin, currentMax]
    );
  };

  const handleFocus = (event) => {
    if (state.mouseY === null) {
      if (event.type === "focus") {
        console.log("focus");
        setState({
          ...state,
          hasFocus: true,
        });
      } else if (event.type === "blur") {
        console.log("blur");
        setState({
          ...state,
          hasFocus: false,
        });
      }
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    setState({
      ...state,
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  };

  const handleClose = () => {
    setState({
      ...state,
      mouseX: null,
      mouseY: null,
    });
  };

  const handlePolarityChange = (event) => {
    setState({
      ...state,
      update: true,
    });
    StorageUtility.updateChannelProperty(
      props.channelName,
      PlotPropertyName.polarity,
      event.target.checked
    );
  };

  const handleIsAutoScaledChange = (event) => {
    setState({
      ...state,
      update: true,
    });
    StorageUtility.updateChannelProperty(
      props.channelName,
      PlotPropertyName.isAutoScaled,
      event.target.checked
    );
  };

  const handleHideYAxisLabelChange = (event) => {
    setState({
      ...state,
      update: true,
    });
    StorageUtility.updateChannelProperty(
      props.channelName,
      PlotPropertyName.hideYAxisTicks,
      event.target.checked
    );
  };

  const handleColorChange = (newColor) => {
    setState({
      ...state,
      update: true,
    });
    StorageUtility.updateChannelProperty(
      props.channelName,
      PlotPropertyName.color,
      newColor
    );
  };

  const handleFilterChange = (filterType) => (event) => {
    if (props.channelProperties[filterType] !== event.target.value) {
      StorageUtility.updateChannelProperty(
        props.channelName,
        filterType,
        event.target.value
      );
      props.handleFilterChange();
    }
  };

  const classes = useStyles();
  const roundFactor = Math.max(
    1 / (plotRange[1] - plotRange[0]),
    Math.pow(
      10,
      Math.round(
        Math.log10(100000 / (state.originalRange[1] - state.originalRange[0]))
      )
    )
  );
  const roundedDomain = [
    Math.round(plotRange[0] * roundFactor) / roundFactor,
    Math.round(plotRange[1] * roundFactor) / roundFactor,
  ];
  const yAxisWidth = 75;
  const plotWidth = window.innerWidth - 4;
  let numberOfVerticalPoints = Math.round(plotWidth / 200);
  if (numberOfVerticalPoints > 5) {
    numberOfVerticalPoints = Math.round(numberOfVerticalPoints / 5) * 5;
  }
  const verticalPoints = [...Array(numberOfVerticalPoints).keys()].map(
    (x) =>
      yAxisWidth +
      ((x + 1) / numberOfVerticalPoints) * (plotWidth - yAxisWidth - 3)
  );
  const polarityValue = props.channelProperties[PlotPropertyName.polarity]
    ? -1
    : 1;
  let plotData = [];
  for (var i = 0; i < props.data.length; i++) {
    plotData.push({
      y: polarityValue * props.data[i],
    });
  }

  return (
    <div
      tabIndex={0}
      style={{
        marginLeft: 2,
        width: plotWidth,
        outline: state.hasFocus ? "1px solid red" : "none",
      }}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleFocus}
      onContextMenu={handleContextMenu}
    >
      <LineChart
        width={plotWidth}
        height={props.height}
        data={plotData}
        margin={{
          top: 0,
          bottom: 0,
        }}
      >
        {props.showGrid && (
          <CartesianGrid strokeDasharray="0" verticalPoints={verticalPoints} />
        )}
        <YAxis
          axisLine={props.showGrid}
          allowDataOverflow={false}
          domain={
            props.channelProperties[PlotPropertyName.isAutoScaled]
              ? ["auto", "auto"]
              : roundedDomain
          }
          tick={!props.channelProperties[PlotPropertyName.hideYAxisTicks]}
          width={yAxisWidth}
          interval="preserveStartEnd"
          label={props.channelName}
        />
        <Line
          type="monotone"
          stroke={props.channelProperties[PlotPropertyName.color]}
          dataKey="y"
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 8 }}
        />
      </LineChart>
      <Menu
        keepMounted
        open={state.mouseY !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          state.mouseY !== null && state.mouseX !== null
            ? { top: state.mouseY, left: state.mouseX }
            : undefined
        }
      >
        <Typography variant="h6" align="center">
          Plot Properties
        </Typography>
        <Divider />
        <FormControl className={classes.customWidth}>
          <FormControlLabel
            control={
              <Switch
                checked={props.channelProperties[PlotPropertyName.polarity]}
                onChange={handlePolarityChange}
                name="isAutoScaled"
              />
            }
            label="Polarity"
            labelPlacement="start"
            className={classes.contentStyle}
          />
          <FormControlLabel
            control={
              <Switch
                checked={props.channelProperties[PlotPropertyName.isAutoScaled]}
                onChange={handleIsAutoScaledChange}
                name="isAutoScaled"
              />
            }
            label="Is Auto Scaled"
            labelPlacement="start"
            className={classes.contentStyle}
          />
          <FormControlLabel
            control={
              <Switch
                checked={
                  props.channelProperties[PlotPropertyName.hideYAxisTicks]
                }
                onChange={handleHideYAxisLabelChange}
                name="hideYAxisTicks"
              />
            }
            label="Hide Y-Axis Ticks"
            labelPlacement="start"
            className={classes.contentStyle}
          />
          <FormControlLabel
            control={
              <ColorPicker
                backgroundColor={
                  props.channelProperties[PlotPropertyName.color]
                }
                handleColorChange={handleColorChange}
              />
            }
            label="Line Color"
            labelPlacement="start"
            className={classes.contentStyle}
          />
          <FormControlLabel
            control={
              <Autocomplete
                id={PlotPropertyName.lowFrequencyFilter}
                key={PlotPropertyName.lowFrequencyFilter}
                freeSolo
                options={[
                  "No Filter",
                  "0.01",
                  "0.02",
                  "0.05",
                  "0.1",
                  "0.2",
                  "0.3",
                  "0.4",
                  "0.5",
                  "1",
                  "3",
                  "5",
                  "8",
                  "10",
                  "12",
                  "20",
                  "30",
                ]}
                value={
                  props.channelProperties[PlotPropertyName.lowFrequencyFilter]
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    key={PlotPropertyName.lowFrequencyFilter}
                    margin="normal"
                    style={{ width: 120 }}
                    onChange={handleFilterChange(
                      PlotPropertyName.lowFrequencyFilter
                    )}
                    onSelect={handleFilterChange(
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
                id={PlotPropertyName.highFrequencyFilter}
                key={PlotPropertyName.highFrequencyFilter}
                freeSolo
                options={[
                  "3",
                  "7",
                  "12",
                  "15",
                  "30",
                  "35",
                  "50",
                  "60",
                  "70",
                  "100",
                  "120",
                  "No Filter",
                ]}
                value={
                  props.channelProperties[PlotPropertyName.highFrequencyFilter]
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    key={PlotPropertyName.highFrequencyFilter}
                    margin="normal"
                    style={{ width: 120 }}
                    onSelect={handleFilterChange(
                      PlotPropertyName.highFrequencyFilter
                    )}
                    onChange={handleFilterChange(
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
                value={props.channelProperties[PlotPropertyName.notchFilter]}
                onChange={handleFilterChange(PlotPropertyName.notchFilter)}
                style={{ width: 120 }}
              >
                {["None", "50 Hz", "60 Hz"].map((filter) => (
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
    </div>
  );
}
