import React, { useEffect, useState, useCallback } from "react";
import {
  Snackbar,
  IconButton,
  Menu,
  ListItem,
  Box,
  Typography,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Label,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import StorageUtility, { PlotPropertyName } from "../../models/StorageUtility";
import PlotContextMenu from "./PlotContextMenu";
import ResizableContent from "./ResizeableContent";
import { debounce } from "../../models/Utilities";
import TimeRange from "../../models/TimeRange";
import PSGScoring from "../../models/PSGScoring";

export const yAxisWidth = 75;
const yAxisPadding = 4;
const minimumRespiratoryEventSeconds = 10;

function Plot(props) {
  const plotHeight = props.height;
  const displayEvents = getDisplayEvents();
  console.log("plot called: " + props.channelName);
  let plotRange = props.channelProperties[PlotPropertyName.range];
  if (plotRange === null) {
    if (props.data.length > 0) {
      plotRange = props.data[0].plotRange;
    } else {
      plotRange = [-1, 1];
    }
  }

  const [state, setState] = useState({
    originalRange: plotRange,
    hasFocus: false,
    contextMouseX: null,
    contextMouseY: null,
    mouseX: 0,
    update: false,
    mouseLeftWidth: null,
    lastRespiratoryEventType: 1,
    snackbarOpenCount: 0,
  });

  const handleMouseEvent = (event) => {
    console.log(event.type);
    if (!props.enablePSGScoring || !props.scores || state.contextMouseX) {
      return;
    }
    if (event.button !== 0) {
      setState({
        ...state,
        mouseLeftWidth: null,
      });
      return;
    }
    switch (event.type) {
      case "mousemove":
        if (state.mouseLeftWidth) {
          if (event.clientX - state.mouseLeftWidth[0] > 10) {
            event.preventDefault();
            event.stopPropagation();
            const width = event.clientX - state.mouseLeftWidth[0];
            setState({
              ...state,
              mouseLeftWidth: [
                state.mouseLeftWidth[0],
                width,
                getDuration(width),
              ],
            });
          }
        } else if (Math.abs(event.clientX - state.mouseX) > 10) {
          setState({
            ...state,
            mouseX: event.clientX,
          });
        }
        break;
      case "mousedown":
        setState({
          ...state,
          mouseLeftWidth: [event.clientX, 0, 0],
        });
        break;
      case "mouseup":
        if (state.mouseLeftWidth) {
          createRespiratoryEvent(state.mouseLeftWidth);
          setState({
            ...state,
            mouseLeftWidth: null,
          });
          props.handleRefreshPlot(props.channelName);
        }
        break;
      default:
        return;
    }
  };

  const handleKeyDown = (event) => {
    if (state.contextMouseY !== null) {
      return;
    }
    console.log("handleKeyDown");
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
      case "Delete":
        if (props.enablePSGScoring && displayEvents) {
          for (var i = 0; i < displayEvents.length; i++) {
            if (
              displayEvents[i].left <= state.mouseX &&
              displayEvents[i].left + displayEvents[i].width >= state.mouseX
            ) {
              props.scores.deleteRespiratoryEvent(displayEvents[i].index);
              props.handleRefreshPlot(props.channelName);
              break;
            }
          }
        } else {
          return;
        }
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
    event.preventDefault();
    event.stopPropagation();
    if (state.contextMouseY === null) {
      if (event.type === "focus") {
        console.log("focus");
        setState({
          ...state,
          hasFocus: true,
          mouseLeftWidth: null,
        });
        props.handleEnableDrag(props.channelName);
      } else if (event.type === "blur") {
        console.log("blur");
        setState({
          ...state,
          hasFocus: false,
          mouseLeftWidth: null,
        });
        props.handleEnableDrag("");
      }
    }
  };

  const handleRespiratoryEventClick = (eventType) => (event) => {
    createRespiratoryEvent([state.contextMouseX, 0], eventType);
    setState({
      ...state,
      lastRespiratoryEventType: eventType,
      contextMouseX: null,
      contextMouseY: null,
    });
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    setState({
      ...state,
      contextMouseX: event.clientX - 2,
      contextMouseY: event.clientY - 4,
    });
  };

  const handleClose = () => {
    setState({
      ...state,
      contextMouseX: null,
      contextMouseY: null,
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
      if (filterType === PlotPropertyName.notchFilter) {
        props.handleRefreshPlot(props.channelName);
      } else {
        debounceRefreshPlots(props.channelName);
      }
    }
  };

  const handleChartTypeChange = (event) => {
    setState({
      ...state,
      snackbarOpenCount: 0,
      update: true,
    });
    StorageUtility.updateChannelProperty(
      props.channelName,
      PlotPropertyName.chartType,
      event.target.value
    );
  };

  const handleReferenceLinesChange = (event) => {
    const newValue = event.target.value;
    let referenceLines = [];
    if (newValue) {
      referenceLines = newValue.split(",");
    }
    setState({
      ...state,
      update: true,
    });
    StorageUtility.updateChannelProperty(
      props.channelName,
      PlotPropertyName.referenceLines,
      referenceLines
    );
  };

  const handleRangeChange = (event) => {
    const newValue = event.target.value;
    let range = [];
    if (newValue) {
      range = newValue.split(",");
    }
    setState({
      ...state,
      update: true,
    });
    StorageUtility.updateChannelProperty(
      props.channelName,
      PlotPropertyName.range,
      range
    );
  };

  const handleReferenceChannelsChange = (event) => {
    StorageUtility.updateChannelProperty(
      props.channelName,
      PlotPropertyName.referenceChannels,
      event.target.value
    );
    props.handleRefreshPlot(props.channelName);
  };

  const handleSnackbarClose = (event) => {
    setState({
      ...state,
      snackbarOpenCount: state.snackbarOpenCount + 1,
    });
  };

  const handleRespiratoryEventChange = (index, newLeft, newWidth) => {
    console.log(newLeft, newWidth);
    displayEvents.forEach((event) => {
      if (event.index === index) {
        const newTimeRange = getTimeRange(newLeft, newWidth);
        props.scores.updateRespiratoryEvent(index, newTimeRange);
        return;
      }
    });
    setState({
      ...state,
      mouseLeftWidth: null,
    });
  };

  const CustomizedLabel = (props) => {
    const { x, y, stroke, value } = props;

    if (typeof value === "number") {
      lastNumberXPosition = x;
      if (showLabel) {
        return (
          <text x={x} y={y} dy={-2} fill={stroke} fontSize={12}>
            {value}
          </text>
        );
      } else {
        return null;
      }
    } else {
      return (
        <text
          x={lastNumberXPosition}
          y={plotHeight / 2}
          dy={-2}
          fill={stroke}
          fontSize={12}
        >
          {value}
        </text>
      );
    }
  };

  const debounceRefreshPlots = useCallback(
    debounce((channelName) => {
      props.handleRefreshPlot(channelName);
    }, 500),
    []
  );

  if (plotRange === null) {
    if (state.plotRange) {
      plotRange = state.plotRange;
    } else {
      plotRange = [-32768, 32767];
    }
  }
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
  const plotWidth = props.width - yAxisPadding;
  let lastNumberXPosition = yAxisWidth;
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

  let hasStringValues = false;
  let displayXAxis = (props.channelProperties[PlotPropertyName.chartType] !== "Trend");
  let plotData = [];
  for (let i = 0; i < props.data.length; i++) {
    if (props.data[i].hasStringValues) {
      hasStringValues = true;
      for (let j = 0; j < props.data[i].values.length; j++) {
        plotData.push({
          x: props.data[i].times[j],
          y: props.data[i].values[j],
        });
      }
    } else {
      let lastValue = null;
      let showEveryValue = (props.channelProperties[PlotPropertyName.chartType] === "Trend");
      for (let j = 0; j < props.data[i].values.length; j++) {
        if (lastValue !== props.data[i].values[j] || showEveryValue) {
          plotData.push({
            x: props.data[i].times[j],
            y: polarityValue * props.data[i].values[j],
          });
        }
        lastValue = props.data[i].values[j];
      }
    }
    if (
      props.displayTimeRange.endTime >
        props.data[i].times[props.data[i].times.length - 1] ||
      props.displayTimeRange.startTime < props.data[i].times[0]
    ) {
      displayXAxis = true;
    }
  }

  let lineType = "linear";
  let showLabel = false;
  let openSnackbar = false;
  if (props.channelProperties[PlotPropertyName.chartType] !== "Trend") {
    lineType = "stepAfter";
    if (
      props.channelProperties[PlotPropertyName.chartType] === "Step & Label"
    ) {
      if (plotData.length / plotWidth < 0.1) {
        showLabel = true;
      } else {
        if (state.snackbarOpenCount < 1) {
          openSnackbar = true;
        }
      }
    }
  }
  let labelFontSize = 12;
  let tickFontSize = "0.7rem";
  switch (props.channelLabelFontSize) {
    case "Smaller":
      labelFontSize = 10;
      tickFontSize = "0.6rem";
      break;
    case "Larger":
      labelFontSize = 14;
      tickFontSize = "0.8rem";
      break;
    case "Normal":
    default:
      labelFontSize = 12;
      tickFontSize = "0.7rem";
      break;
  }
  if (props.showChannelScale === false) {
    tickFontSize = "0rem";
  }
  return (
    <div
      tabIndex={0}
      style={{
        marginLeft: 2,
        width: plotWidth,
        height: plotHeight,
        outline: state.hasFocus ? "1px solid red" : "none",
      }}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseEvent}
      onMouseMove={props.enablePSGScoring ? handleMouseEvent : null}
      onMouseUp={handleMouseEvent}
      onFocus={handleFocus}
      onBlur={handleFocus}
      onContextMenu={handleContextMenu}
    >
      <Snackbar
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        open={openSnackbar}
        autoHideDuration={10000}
        onClose={handleSnackbarClose}
        message="Value labels are not shown since their number exceeds the density limit."
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleSnackbarClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      <LineChart
        width={plotWidth}
        height={plotHeight}
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
          allowDataOverflow={true}
          domain={
            props.channelProperties[PlotPropertyName.isAutoScaled]
              ? ["auto", "auto"]
              : roundedDomain
          }
          width={props.showChannelLabel === false ? 0 : yAxisWidth}
          interval="preserveStartEnd"
          style={{ fontSize: tickFontSize }}
        >
          <Label
            value={props.channelName}
            position="insideLeft"
            fontSize={labelFontSize}
          />
        </YAxis>
        {(hasStringValues || displayXAxis) && (
          <XAxis
            dataKey="x"
            type="number"
            hide={true}
            domain={[
              props.displayTimeRange.startTime,
              props.displayTimeRange.endTime,
            ]}
          />
        )}
        {props.channelProperties[PlotPropertyName.referenceLines].map(
          (referenceLine) =>
            !isNaN(referenceLine) &&
            referenceLine.trim() && (
              <ReferenceLine
                id={referenceLine}
                y={referenceLine}
                key={referenceLine}
                stroke="red"
              />
            )
        )}
        <Line
          type={lineType}
          stroke={props.channelProperties[PlotPropertyName.color]}
          dataKey="y"
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 8 }}
          label={(hasStringValues || showLabel) && <CustomizedLabel />}
        />
      </LineChart>
      {state.mouseLeftWidth && (
        <Box
          style={{
            backgroundColor: "#FF000020",
            width: state.mouseLeftWidth[1],
            marginLeft: state.mouseLeftWidth[0],
            height: plotHeight,
            marginTop: -plotHeight,
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {state.mouseLeftWidth[2].toFixed(1)} sec
        </Box>
      )}
      {displayEvents && (
        <div
          style={{
            zIndex: 999,
            width: plotWidth,
            height: plotHeight,
            marginTop: -plotHeight,
          }}
        >
          {displayEvents.map((event) => (
            <ResizableContent
              key={
                Math.round(props.displayTimeRange.startTime) +
                "_" +
                Math.round(props.displayTimeRange.duration) +
                "_" +
                event.ID
              }
              left={event.left}
              minimumLeft={props.showChannelLabel === false ? 0 : yAxisWidth}
              maximumWidth={window.innerWidth - yAxisPadding}
              width={event.width}
              height={plotHeight}
              backgroundColor={event.color}
              enableEdit={props.enablePSGScoring}
              eventIndex={event.index}
              handleEventChange={handleRespiratoryEventChange}
            >
              {event.name + ": " + event.duration.toFixed(1)} sec{" "}
            </ResizableContent>
          ))}
        </div>
      )}
      {state.contextMouseX &&
        (props.scores && props.enablePSGScoring ? (
          <Menu
            open={state.contextMouseY !== null}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={{
              top: state.contextMouseY,
              left: state.contextMouseX,
            }}
          >
            {PSGScoring.getRespiratoryEventSettings().map((event) => (
              <ListItem
                button
                onClick={handleRespiratoryEventClick(event.type)}
              >
                {event.name}
              </ListItem>
            ))}
          </Menu>
        ) : (
          <PlotContextMenu
            mouseY={state.contextMouseY}
            mouseX={state.contextMouseX}
            channelName={props.channelName}
            polarity={props.channelProperties[PlotPropertyName.polarity]}
            isAutoScaled={
              props.channelProperties[PlotPropertyName.isAutoScaled]
            }
            lineColor={props.channelProperties[PlotPropertyName.color]}
            lowFrequencyFilter={
              props.channelProperties[PlotPropertyName.lowFrequencyFilter]
            }
            highFrequencyFilter={
              props.channelProperties[PlotPropertyName.highFrequencyFilter]
            }
            notchFilter={props.channelProperties[PlotPropertyName.notchFilter]}
            chartType={props.channelProperties[PlotPropertyName.chartType]}
            referenceLines={
              props.channelProperties[PlotPropertyName.referenceLines]
            }
            range={plotRange}
            referenceChannels={
              props.channelProperties[PlotPropertyName.referenceChannels]
            }
            referenceChannelOptions={props.channelNames}
            handleClose={handleClose}
            handlePolarityChange={handlePolarityChange}
            handleIsAutoScaledChange={handleIsAutoScaledChange}
            handleColorChange={handleColorChange}
            handleFilterChange={handleFilterChange}
            handleChartTypeChange={handleChartTypeChange}
            handleReferenceLinesChange={handleReferenceLinesChange}
            handleReferenceChannelsChange={handleReferenceChannelsChange}
            handleRangeChange={handleRangeChange}
          />
        ))}
    </div>
  );

  function getDisplayEvents() {
    if (props.scores) {
      const rawEvents = props.scores.getRespiratoryEvents(
        props.displayTimeRange
      );
      let displayEvents = [];
      for (var i = 0; i < rawEvents.length; i++) {
        const rawEvent = rawEvents[i];
        const leftAndWidth = getLeftAndWidth(rawEvent.timeRange);
        const respiratoryEvent = PSGScoring.getRespiratoryEvent(rawEvent.type);
        const displayEvent = {
          ID: rawEvent.ID,
          name: respiratoryEvent.name,
          index: rawEvent.index,
          left: leftAndWidth.left,
          width: leftAndWidth.width,
          duration: rawEvent.timeRange.duration,
          color: respiratoryEvent.backgroundColor,
        };
        displayEvents.push(displayEvent);
      }
      return displayEvents;
    } else {
      return null;
    }
  }

  function createRespiratoryEvent(leftAndWidth, type) {
    if (type === undefined) {
      type = state.lastRespiratoryEventType;
    }
    if (
      props.enablePSGScoring &&
      props.scores &&
      (leftAndWidth[1] === 0 ||
        leftAndWidth[2] >= minimumRespiratoryEventSeconds)
    ) {
      const timeRange = getTimeRange(leftAndWidth[0], leftAndWidth[1]);
      props.scores.addRespiratoryEvent(timeRange, type);
    }
  }

  function getTimeRange(left, width) {
    const widthOffset = props.showChannelLabel === false ? 0 : yAxisWidth;
    const chartWidth = window.innerWidth - yAxisPadding;
    const widthPerSecond =
      (chartWidth - widthOffset) / props.displayTimeRange.duration;
    const startTime =
      props.displayTimeRange.startTime + (left - widthOffset) / widthPerSecond;
    const duration = width ? width / widthPerSecond : 10;
    return new TimeRange([startTime, startTime + duration]);
  }

  function getDuration(width) {
    const widthOffset = props.showChannelLabel === false ? 0 : yAxisWidth;
    const chartWidth = window.innerWidth - yAxisPadding;
    const widthPerSecond =
      (chartWidth - widthOffset) / props.displayTimeRange.duration;
    return width / widthPerSecond;
  }

  function getLeftAndWidth(timeRange) {
    const widthOffset = props.showChannelLabel === false ? 0 : yAxisWidth;
    const chartWidth = window.innerWidth - yAxisPadding;
    const widthPerSecond =
      (chartWidth - widthOffset) / props.displayTimeRange.duration;
    return {
      left:
        widthOffset +
        (timeRange.startTime - props.displayTimeRange.startTime) *
          widthPerSecond,
      width: timeRange.duration * widthPerSecond,
    };
  }
}

export default React.memo(Plot);
