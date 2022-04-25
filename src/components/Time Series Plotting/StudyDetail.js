import React, { useEffect, useState, useRef, useContext } from "react";
import { useHistory } from "react-router-dom";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { Modal, Tooltip, Grid, Typography, Box } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import FastForwardIcon from "@material-ui/icons/FastForward";
import FastRewindIcon from "@material-ui/icons/FastRewind";
import FullscreenIcon from "@material-ui/icons/Fullscreen";
import RedoIcon from "@material-ui/icons/Redo";
import UndoIcon from "@material-ui/icons/Undo";
import Save from "@material-ui/icons/Save";
import AssessmentIcon from "@material-ui/icons/Assessment";
import { MessagedProgress } from "../MessagedProgress";
import Plots from "./Plots";
import ChannelDataList from "../../models/ChannelDataList";
import TimeRange from "../../models/TimeRange";
import { XAxis } from "./XAxis";
import { TimeNavigation } from "./TimeNavigation";
import ServerClient from "../../models/ServerClient";
import PropertyMenu from "./PropertyMenu";
import StorageUtility, { PlotPropertyName } from "../../models/StorageUtility";
import { debounce } from "../../models/Utilities";
import PSGScoring from "../../models/PSGScoring";
import { DataGrid, Watermark } from "@material-ui/data-grid";
import PSGScoreReport from "./PSGScoreReport";
import { UserContext } from "../UserContext";
import { Opacity } from "@material-ui/icons";

const epochDuration = 30;
const columns = [
  {
    field: "id",
    headerName: "ID",
    flex: 0.05,
    type: "string",
    hide: true,
    filterable: false,
    sortable: false,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "time",
    headerName: "Time",
    width: 90,
    type: "string",
    hide: false,
    filterable: false,
    sortable: false,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <Tooltip title={new Date(params.value * 1000).toLocaleString()}>
        <span>{new Date(params.value * 1000).toLocaleTimeString()}</span>
      </Tooltip>
    ),
  },
  {
    field: "comment",
    headerName: "Annotation",
    flex: 0.5,
    type: "string",
    hide: false,
    filterable: false,
    sortable: false,
    align: "left",
    headerAlign: "center",
    renderCell: (params) => (
      <Tooltip title={params.row.channel + ": " + params.value}>
        <span>{params.value}</span>
      </Tooltip>
    ),
  },
];

export function StudyDetail() {
  const history = useHistory();
  const { sessionInfo, setSessionInfo } = useContext(UserContext);
  const studyInfo = history.location.state;
  const [state, setState] = useState({
    dataTimeRange: new TimeRange([
      studyInfo.startTime,
      studyInfo.endTime ? studyInfo.endTime : Date.now() / 1000,
    ]),
    displayTimeRange: new TimeRange([
      studyInfo.startTime,
      studyInfo.startTime +
        StorageUtility.getPlotProperty(PlotPropertyName.displayInterval),
    ]),
    displayInterval: StorageUtility.getPlotProperty(
      PlotPropertyName.displayInterval
    ),
    sliderValue: 0,
    resizeCount: 0,
    dataList: studyInfo.dataList,
    errorMessage: "",
    refreshPlots: true,
    hasFetchedAllData: studyInfo.dataList ? true : false,
    isLiveData: studyInfo.isLiveData,
    openMenu: false,
    openReport: false,
    enablePSGScoring: false,
    playingSpeed:
      -1 * StorageUtility.getPlotProperty(PlotPropertyName.playingSpeed),
  });
  const stateRef = useRef({});
  stateRef.current = state;

  const handleMenuClick = () => {
    setState({
      ...stateRef.current,
      openMenu: true,
      refreshPlots: false,
    });
  };

  const handleMenuClose = () => {
    setState({
      ...stateRef.current,
      openMenu: false,
      refreshPlots: false,
    });
  };

  const handleIntervalChange = (event) => {
    let newValue = event.target.value;
    StorageUtility.updatePlotProperty(
      PlotPropertyName.displayInterval,
      newValue
    );
    updateDisplayInterval(newValue);
  };

  const handleSliderChange = (event, newValue) => {
    if (event !== null) {
      event.stopPropagation();
    }
    console.log("Handling slider change: " + newValue);
    if (newValue === stateRef.current.sliderValue) {
      return;
    } else if (newValue >= stateRef.current.dataTimeRange.duration) {
      setState({
        ...stateRef.current,
        refreshPlots: true,
      });
      return;
    } else if (
      stateRef.current.dataList &&
      stateRef.current.dataList.timeRange.duration >
        stateRef.current.displayInterval
    ) {
      let sliderValue = Math.min(
        Math.max(
          newValue,
          stateRef.current.dataList.timeRange.startTime -
            stateRef.current.dataTimeRange.startTime
        ),
        stateRef.current.dataList.timeRange.endTime -
          stateRef.current.dataTimeRange.startTime -
          stateRef.current.displayInterval * 0
      );
      let displayTimeRange = new TimeRange([
        stateRef.current.dataTimeRange.startTime + sliderValue,
        stateRef.current.dataTimeRange.startTime +
          sliderValue +
          stateRef.current.displayInterval,
      ]);
      setState({
        ...stateRef.current,
        sliderValue: sliderValue,
        displayTimeRange: displayTimeRange,
        refreshPlots: true,
      });
      if (sliderValue < newValue && stateRef.current.playingSpeed > 0) {
        handlePlayPause();
      }
    }
  };

  function play() {
    if (stateRef.current.playingSpeed > 0) {
      let timeout = 10;
      if (stateRef.current.playingSpeed < 0.4) {
        timeout = 2000;
      } else if (stateRef.current.playingSpeed < 2.5) {
        timeout = 1000;
      } else if (stateRef.current.playingSpeed < 5) {
        timeout = 500;
      }
      let moveIntervalFraction = 1;
      if (stateRef.current.playingSpeed < 0.2) {
        moveIntervalFraction = 1 / 30;
      } else if (stateRef.current.playingSpeed < 0.4) {
        moveIntervalFraction = 1 / 15;
      } else if (stateRef.current.playingSpeed < 0.6) {
        moveIntervalFraction = 1 / 6;
      } else if (stateRef.current.playingSpeed < 1.2) {
        moveIntervalFraction = 1 / 3;
      }
      Math.min(2000, 1000 / stateRef.current.playingSpeed);
      const moveInterval =
        moveIntervalFraction * stateRef.current.displayInterval;
      handleSliderChange(null, stateRef.current.sliderValue + moveInterval);
      setTimeout(() => {
        play(timeout);
      }, timeout);
    }
  }

  const handleFastRewind = () => {
    if (stateRef.current.playingSpeed > 0) {
      StorageUtility.updatePlotProperty(
        PlotPropertyName.playingSpeed,
        stateRef.current.playingSpeed / 2
      );
      setState({
        ...stateRef.current,
        playingSpeed: stateRef.current.playingSpeed / 2,
      });
    } else {
      handleSliderChange(
        null,
        stateRef.current.sliderValue - 2 * stateRef.current.displayInterval
      );
    }
  };

  const handlePlayPause = () => {
    setState({
      ...stateRef.current,
      playingSpeed: -stateRef.current.playingSpeed,
    });
    setTimeout(() => {
      play();
    }, 500);
  };

  const handleFastForward = () => {
    if (stateRef.current.playingSpeed > 0) {
      StorageUtility.updatePlotProperty(
        PlotPropertyName.playingSpeed,
        stateRef.current.playingSpeed * 2
      );
      setState({
        ...stateRef.current,
        playingSpeed: stateRef.current.playingSpeed * 2,
      });
    } else {
      handleSliderChange(
        null,
        stateRef.current.sliderValue + 2 * stateRef.current.displayInterval
      );
    }
  };

  const handleChannelCheckboxChange = (channelName) => (event) => {
    StorageUtility.updateChannelProperty(
      channelName,
      "visible",
      event.target.checked
    );
    setState({
      ...stateRef.current,
      refreshPlots: true,
    });
  };

  const handleBackgroundColorChange = (newColor) => {
    StorageUtility.updatePlotProperty(
      PlotPropertyName.backgroundColor,
      newColor
    );
    setState({
      ...stateRef.current,
      refreshPlots: true,
    });
  };

  const handleShowGridChange = (event) => {
    StorageUtility.updatePlotProperty(
      PlotPropertyName.showGrid,
      event.target.checked
    );
    setState({
      ...stateRef.current,
      refreshPlots: true,
    });
  };

  const handleShowChannelScaleChange = (event) => {
    StorageUtility.updatePlotProperty(
      PlotPropertyName.showChannelScale,
      event.target.checked
    );
    setState({
      ...stateRef.current,
      refreshPlots: true,
    });
  };

  const handleShowCommentWindowChange = (event) => {
    StorageUtility.updatePlotProperty(
      PlotPropertyName.showCommentWindow,
      event.target.checked
    );
    setState({
      ...stateRef.current,
      refreshPlots: true,
    });
  };

  const handleShowChannelLabelChange = (event) => {
    StorageUtility.updatePlotProperty(
      PlotPropertyName.showChannelLabel,
      event.target.checked
    );
    setState({
      ...stateRef.current,
      refreshPlots: true,
    });
  };

  const handlePreferenceChange = () => {
    const displayInterval = StorageUtility.getPlotProperty(
      PlotPropertyName.displayInterval
    );
    updateDisplayInterval(displayInterval);
  };

  const handleWatermarkChange = (watermark) => (event) => {
    let currentWatermark = StorageUtility.getPlotProperty(
      PlotPropertyName.watermark
    );
    if (event.target.checked) {
      currentWatermark += watermark;
    } else {
      currentWatermark = currentWatermark.replace(watermark, "");
    }
    StorageUtility.updatePlotProperty(
      PlotPropertyName.watermark,
      currentWatermark
    );
    setState({
      ...stateRef.current,
      refreshPlots: true,
    });
  };

  const handlePSGScoringChange = (userID) => (event) => {
    if (event.target.checked) {
      stateRef.current.dataList.initializeNewScore(
        userID,
        studyInfo.dataIDs[0],
        new TimeRange([studyInfo.startTime, studyInfo.endTime])
      );
    }
    setState({
      ...stateRef.current,
      enablePSGScoring: event.target.checked,
      refreshPlots: true,
    });
  };

  const handleRespiratoryChannelChange = (event) => {
    StorageUtility.updatePlotProperty(
      PlotPropertyName.respiratoryChannel,
      event.target.value
    );
    setState({
      ...stateRef.current,
      refreshPlots: true,
    });
  };

  const handleChannelLabelFontSizeChange = (event) => {
    StorageUtility.updatePlotProperty(
      PlotPropertyName.channelLabelFontSize,
      event.target.value
    );
    setState({
      ...stateRef.current,
      refreshPlots: true,
    });
  };

  const handleCommentWindowDoubleClick = (event) => {
    console.log(event);
    let sliderValue =
      stateRef.current.displayInterval *
      Math.floor(
        (event.row.time - stateRef.current.dataTimeRange.startTime) /
          stateRef.current.displayInterval
      );
    handleSliderChange(null, sliderValue);
  };

  const handleRefreshPlots = (channelName) => {
    setState({
      ...stateRef.current,
      refreshPlots: true,
    });
  };

  const handleEpochClick = (deltaEpoch) => {
    const moveStep = 30;
    if (deltaEpoch !== 0) {
      handleSliderChange(
        null,
        Math.floor(stateRef.current.sliderValue / moveStep) * moveStep +
          deltaEpoch * moveStep
      );
    }
  };

  const handleKeydown = (e) => {
    e.stopPropagation();
    let moveStep = 30;
    if (stateRef.current.enablePSGScoring) {
      const epochNumber =
        Math.ceil(stateRef.current.sliderValue / epochDuration) + 1;
      switch (e.key) {
        case "0":
        case "w":
        case "W":
          stateRef.current.dataList.PSGScores.updateStage(epochNumber, 0);
          break;
        case "1":
          stateRef.current.dataList.PSGScores.updateStage(epochNumber, 2);
          break;
        case "2":
          stateRef.current.dataList.PSGScores.updateStage(epochNumber, 3);
          break;
        case "3":
        case "4":
          stateRef.current.dataList.PSGScores.updateStage(epochNumber, 4);
          break;
        case "r":
        case "R":
          stateRef.current.dataList.PSGScores.updateStage(epochNumber, 1);
          break;
        default:
          moveStep = 0;
          break;
      }
    } else {
      moveStep = 0;
    }
    if (!e.path || !e.path[0].className.includes("MuiSlider")) {
      switch (e.key) {
        case "ArrowRight":
          if (e.shiftKey || e.ctrlKey) {
            moveStep = stateRef.current.displayInterval / 2;
          } else {
            moveStep = stateRef.current.displayInterval;
          }
          break;
        case "ArrowLeft":
          if (e.shiftKey || e.ctrlKey) {
            moveStep = -stateRef.current.displayInterval / 2;
          } else {
            moveStep = -stateRef.current.displayInterval;
          }
          break;
        default:
          break;
      }
    }
    if (moveStep !== 0) {
      handleSliderChange(
        null,
        Math.floor(stateRef.current.sliderValue / moveStep) * moveStep +
          moveStep
      );
    }
  };

  const handleSaveScoring = (event) => {
    state.dataList.PSGScores.isDirty = false;
    ServerClient.savePSGScores(state.dataList.PSGScores.getDataChunks());
  };

  const handleClearAll = (event) => {
    state.dataList.PSGScores.clearAllEvents();
    moveToEpoch(1);
  };

  const handleViewScoringReport = (event) => {
    console.log(event);
    setState({
      ...stateRef.current,
      openReport: true,
    });
  };

  const handleReportClose = (event) => {
    setState({
      ...stateRef.current,
      openReport: false,
    });
  };

  const handleUndoScoring = (event) => {
    const epoch = state.dataList.PSGScores.undo();
    moveToEpoch(epoch);
  };

  const handleRedoScoring = (event) => {
    const epoch = state.dataList.PSGScores.redo();
    moveToEpoch(epoch);
  };

  function moveToEpoch(epoch) {
    const newSliderValue = (epoch - 1) * epochDuration;
    if (epoch && newSliderValue !== stateRef.current.sliderValue) {
      handleSliderChange(null, newSliderValue);
    } else {
      setState({
        ...stateRef.current,
        refreshPlots: true,
      });
    }
  }

  useEffect(() => {
    const debounceResizeHandler = debounce(() => {
      setState({
        ...stateRef.current,
        resizeCount: state.resizeCount + 1,
        refreshPlots: true,
      });
    }, 250);
    document.addEventListener("keyup", handleKeydown);
    window.addEventListener("resize", debounceResizeHandler);
    fetchData(true);
    return () => {
      document.removeEventListener("keyup", handleKeydown);
      window.removeEventListener("resize", debounceResizeHandler);
    };
  }, []);

  const fullScreenHandle = useFullScreenHandle();

  if (state.dataList) {
    let displayDataList = {};
    if (state.displayTimeRange.duration === 0) {
      updateDisplayInterval(state.displayInterval);
    }
    if (state.refreshPlots) {
      console.log("getData called.");
      displayDataList = state.dataList.getData(
        state.displayTimeRange,
        window.innerWidth
      );
    }
    let progressBarValue =
      (100 * state.dataList.timeRange.duration) / state.dataTimeRange.duration;
    if (state.dataList.timeRange.startTime > state.dataTimeRange.startTime) {
      progressBarValue = 200 - progressBarValue;
    } else if (state.isLiveData && progressBarValue > 98) {
      progressBarValue = 98;
    }
    const sliderMax = state.dataTimeRange.duration - state.displayInterval;
    const plotProperties = StorageUtility.getPlotProperties();
    const timeNavigationWidth = window.innerWidth - 260;
    const buttonIconMarginTop = state.enablePSGScoring ? -15 : -25;
    const epochNumber =
      Math.ceil(stateRef.current.sliderValue / epochDuration) + 1;
    const comments = state.dataList.comments;
    let width = window.innerWidth;
    if (plotProperties.showCommentWindow) {
      width = (window.innerWidth * 5.0) / 6;
    }
    return (
      <FullScreen handle={fullScreenHandle}>
        <div
          style={{
            width: "100%",
            margin: "auto",
            marginTop: 10,
            background: "white",
          }}
        >
          <Grid container>
            <Grid item xs={plotProperties.showCommentWindow ? 10 : 12}>
              <Plots
                dataList={displayDataList}
                refreshPlots={state.refreshPlots}
                plotProperties={plotProperties}
                displayTimeRange={state.displayTimeRange}
                channelNames={state.dataList.channelNames}
                handleRefreshPlots={handleRefreshPlots}
                enablePSGScoring={state.enablePSGScoring}
                startEpochNumber={epochNumber}
                scores={state.dataList.PSGScores}
                width={width}
              />
            </Grid>
            {plotProperties.showCommentWindow && (
              <Grid item xs={2}>
                <div style={{ height: "100%", width: "100%" }}>
                  <DataGrid
                    components={{ NoRowsOverlay }}
                    rows={comments}
                    columns={columns}
                    pageSize={100}
                    rowsPerPageOptions={[100]}
                    density="compact"
                    hideFooter={comments.length <= 100}
                    hideFooterSelectedRowCount={true}
                    hideFooterRowCount={true}
                    isCellEditable={false}
                    onRowDoubleClick={handleCommentWindowDoubleClick}
                  ></DataGrid>
                </div>
              </Grid>
            )}
          </Grid>
          <XAxis
            disabled={fullScreenHandle.active}
            displayTimeRange={state.displayTimeRange}
            displayInterval={state.displayInterval}
            dataTimeRange={state.dataTimeRange}
            enablePSGScoring={state.enablePSGScoring}
            handleIntervalChange={handleIntervalChange}
            scores={state.dataList.PSGScores}
            handleEpochClick={handleEpochClick}
            width={width}
          />
          <div style={{ display: "inline-block" }}>
            <IconButton
              disabled={fullScreenHandle.active}
              style={{ marginTop: buttonIconMarginTop }}
              onClick={handleMenuClick}
            >
              <MenuIcon />
            </IconButton>
            <IconButton
              style={{ marginTop: buttonIconMarginTop }}
              onClick={
                fullScreenHandle.active
                  ? fullScreenHandle.exit
                  : fullScreenHandle.enter
              }
            >
              <FullscreenIcon />
            </IconButton>
            {state.enablePSGScoring && (
              <Tooltip title="Save scoring to server">
                <IconButton
                  style={{ marginTop: buttonIconMarginTop }}
                  disabled={!state.dataList.PSGScores.isDirty}
                  onClick={handleSaveScoring}
                >
                  <Save />
                </IconButton>
              </Tooltip>
            )}
            {state.enablePSGScoring && (
              <Tooltip title="View results">
                <IconButton
                  style={{ marginTop: buttonIconMarginTop }}
                  onClick={handleViewScoringReport}
                >
                  <AssessmentIcon />
                </IconButton>
              </Tooltip>
            )}
            {state.enablePSGScoring && (
              <Tooltip title="Undo last scoring event">
                <IconButton
                  style={{ marginTop: buttonIconMarginTop }}
                  onClick={handleUndoScoring}
                  disabled={!state.dataList.PSGScores.canUndo}
                >
                  <UndoIcon />
                </IconButton>
              </Tooltip>
            )}
            {state.enablePSGScoring && (
              <Tooltip title="Redo last scoring event">
                <IconButton
                  style={{ marginTop: buttonIconMarginTop }}
                  onClick={handleRedoScoring}
                  disabled={!state.dataList.PSGScores.canRedo}
                >
                  <RedoIcon />
                </IconButton>
              </Tooltip>
            )}
            {!state.enablePSGScoring && (
              <IconButton
                style={{ marginTop: buttonIconMarginTop }}
                onClick={handleFastRewind}
                disabled={
                  stateRef.current.playingSpeed > 0 &&
                  stateRef.current.playingSpeed < 0.2
                }
              >
                <FastRewindIcon />
              </IconButton>
            )}
            {!state.enablePSGScoring && (
              <IconButton
                style={{ marginTop: buttonIconMarginTop }}
                onClick={handlePlayPause}
              >
                {state.playingSpeed > 0 ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            )}
            {!state.enablePSGScoring && (
              <IconButton
                style={{ marginTop: buttonIconMarginTop }}
                onClick={handleFastForward}
                disabled={
                  stateRef.current.playingSpeed > 0 &&
                  stateRef.current.playingSpeed > 5
                }
              >
                <FastForwardIcon />
              </IconButton>
            )}
            <PropertyMenu
              openMenu={state.openMenu}
              plotProperties={plotProperties}
              channels={state.dataList.channelNames}
              isLiveData={state.isLiveData}
              hasScoringReport={state.dataList.PSGScores}
              handleMenuClose={handleMenuClose}
              handleChannelCheckboxChange={handleChannelCheckboxChange}
              handleColorChange={handleBackgroundColorChange}
              handlePreferenceChange={handlePreferenceChange}
              handleShowGridChange={handleShowGridChange}
              handleShowChannelScaleChange={handleShowChannelScaleChange}
              handleShowCommentWindowChange={handleShowCommentWindowChange}
              handleShowChannelLabelChange={handleShowChannelLabelChange}
              handleWatermarkChange={handleWatermarkChange}
              handlePSGScoringChange={handlePSGScoringChange}
              handleRespiratoryChannelChange={handleRespiratoryChannelChange}
              handleChannelLabelFontSizeChange={
                handleChannelLabelFontSizeChange
              }
              handleViewScoringReport={handleViewScoringReport}
            />
          </div>
          <div
            style={{
              width: state.enablePSGScoring
                ? timeNavigationWidth - 45
                : timeNavigationWidth,
              display: "inline-block",
            }}
          >
            <TimeNavigation
              dataTimeRange={state.dataTimeRange}
              displayInterval={state.displayInterval}
              sliderValue={state.sliderValue}
              sliderMax={sliderMax}
              handleSliderChange={handleSliderChange}
              progressBarValue={progressBarValue}
              isLiveData={state.isLiveData}
              enablePSGScoring={state.enablePSGScoring}
              scores={state.dataList.PSGScores}
              width={
                state.enablePSGScoring
                  ? timeNavigationWidth - 45
                  : timeNavigationWidth
              }
            />
          </div>
          <Modal open={state.openReport} onClose={handleReportClose}>
            <PSGScoreReport scores={state.dataList.PSGScores} />
          </Modal>
        </div>
      </FullScreen>
    );
  } else if (state.hasFetchedAllData) {
    return (
      <MessagedProgress message="No data is available." hideProgress={true} />
    );
  } else if (state.errorMessage !== "") {
    return (
      <MessagedProgress message={state.errorMessage} hideProgress={true} />
    );
  } else {
    return <MessagedProgress message="Retrieving time series data ..." />;
  }

  function updateDisplayInterval(newInterval) {
    let newValue = newInterval;
    if (newValue === 0) {
      newValue = state.dataList.timeRange.duration;
    }
    const currentDisplayMiddleTime =
      state.displayTimeRange.startTime -
      state.dataList.timeRange.startTime +
      0.5 * state.displayTimeRange.duration;
    const startTimeFactor = Math.max(
      0,
      Math.min(
        state.dataList.timeRange.duration / newValue - 1,
        Math.round(currentDisplayMiddleTime / newValue - 0.5)
      )
    );
    let newDisplayTimeRange = new TimeRange();
    newDisplayTimeRange.startTime =
      state.dataList.timeRange.startTime + startTimeFactor * newValue;
    newDisplayTimeRange.endTime = newDisplayTimeRange.startTime + newValue;
    const newSlideValue =
      newDisplayTimeRange.startTime - state.dataList.timeRange.startTime;
    setState({
      ...stateRef.current,
      displayInterval: newInterval,
      sliderValue: newSlideValue,
      displayTimeRange: newDisplayTimeRange,
      refreshPlots: true,
    });
  }

  async function fetchData(isFirst = false) {
    if (stateRef.current.hasFetchedAllData) {
      return;
    }
    console.log("calling server");
    let query = { DataIDs: studyInfo.dataIDs };
    if (isFirst) {
      query = { DataIDs: studyInfo.dataIDs, RetrievalPreference: 4 };
    }
    const response = await ServerClient.getTimeSeriesData(query);
    if (response.status === 200) {
      updateData(response.data);
      if (response.data.length === 0) {
        setState({
          ...stateRef.current,
          hasFetchedAllData: true,
          isLiveData: false,
        });
      } else {
        setTimeout(() => {
          fetchData();
        }, 10);
      }
    } else if (response.status === 401) {
      history.push(window.$websiteAlias + "signin");
      setSessionInfo({
        userName: "",
        isLoggedIn: false,
        pageTitle: "",
        dataIDs: [0],
      });
    } else {
      setState({
        ...stateRef.current,
        errorMessage:
          "Unable to retrieve time series data (" +
          response.status +
          "): " +
          response.errorMessage,
      });
    }
  }

  function NoRowsOverlay() {
    return (
      <div style={{ marginTop: 45 }}>
        <Typography align="center" variant="body2">
          No Annotation Found
        </Typography>
      </div>
    );
  }

  function updateData(newData) {
    if (newData && newData.length > 0) {
      newData.forEach((dataChunk) => {
        const index = studyInfo.dataIDs.indexOf(dataChunk.dataID);
        if (index >= 0 && studyInfo.deviceIDs.length > index) {
          dataChunk.deviceID = studyInfo.deviceIDs[index];
        } else {
          dataChunk.deviceID = -1;
        }
      });
      if (stateRef.current.dataList) {
        const currentChannelCount =
          stateRef.current.dataList.channelNames.length;
        const newDataList = stateRef.current.dataList;
        newDataList.add(newData);
        let dataTimeRange = stateRef.current.dataTimeRange;
        let displayTimeRange = stateRef.current.displayTimeRange;
        let refreshPlots = false;
        if (stateRef.current.isLiveData) {
          if (
            displayTimeRange.endTime >
            dataTimeRange.endTime - stateRef.current.displayInterval
          ) {
            dataTimeRange.endTime = newDataList.timeRange.endTime;
            displayTimeRange.endTime = dataTimeRange.endTime;
            displayTimeRange.startTime =
              displayTimeRange.endTime - stateRef.current.displayInterval;
            if (
              displayTimeRange.startTime <
              stateRef.current.dataTimeRange.startTime
            ) {
              displayTimeRange.startTime =
                stateRef.current.dataTimeRange.startTime;
            }
            refreshPlots = true;
          } else {
            dataTimeRange.endTime = newDataList.timeRange.endTime;
          }
        }
        const newChannelCount = stateRef.current.dataList.channelNames.length;
        if (currentChannelCount !== newChannelCount) {
          refreshPlots = true;
        }
        const sliderValue =
          displayTimeRange.startTime - stateRef.current.dataTimeRange.startTime;
        setState({
          ...stateRef.current,
          dataList: newDataList,
          dataTimeRange: dataTimeRange,
          displayTimeRange: displayTimeRange,
          sliderValue: sliderValue,
          refreshPlots: refreshPlots,
        });
      } else {
        const newDataList = new ChannelDataList(newData);
        let displayTimeRange = new TimeRange();
        displayTimeRange.startTime = newDataList.timeRange.startTime;
        displayTimeRange.endTime = newDataList.timeRange.endTime;
        if (newDataList.timeRange.duration > stateRef.current.displayInterval)
          if (stateRef.current.isLiveData) {
            displayTimeRange.startTime =
              displayTimeRange.endTime - stateRef.current.displayInterval;
          } else {
            displayTimeRange.endTime =
              displayTimeRange.startTime + stateRef.current.displayInterval;
          }
        const sliderValue =
          displayTimeRange.startTime - stateRef.current.dataTimeRange.startTime;
        let dataTimeRange = stateRef.current.dataTimeRange;
        if (stateRef.current.isLiveData) {
          dataTimeRange.endTime = newDataList.timeRange.endTime;
        }
        setState({
          ...stateRef.current,
          dataTimeRange: dataTimeRange,
          sliderValue: sliderValue,
          displayTimeRange: displayTimeRange,
          dataList: newDataList,
          refreshPlots: true,
        });
      }
    }
  }
}
