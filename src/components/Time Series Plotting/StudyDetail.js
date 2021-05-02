import React, { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import FastForwardIcon from "@material-ui/icons/FastForward";
import FastRewindIcon from "@material-ui/icons/FastRewind";
import FullscreenIcon from "@material-ui/icons/Fullscreen";
import { MessagedProgress } from "../MessagedProgress";
import Plots from "./Plots";
import ChannelDataList from "../../models/ChannelDataList";
import TimeRange from "../../models/TimeRange";
import { XAxis } from "./XAxis";
import { TimeNavigation } from "./TimeNavigation";
import ServerClient from "../../models/ServerClient";
import PropertyMenu from "./PropertyMenu";
import StorageUtility, { PlotPropertyName } from "../../models/StorageUtility";

export function StudyDetail() {
  const history = useHistory();
  const studyInfo = history.location.state;

  const [state, setState] = useState({
    dataTimeRange: new TimeRange([
      studyInfo.startTime,
      studyInfo.endTime ? studyInfo.endTime : Date.now() / 1000,
    ]),
    displayTimeRange: null,
    displayInterval: StorageUtility.getPlotProperty(
      PlotPropertyName.displayInterval
    ),
    sliderValue: 0,
    resizeCount: 0,
    dataList: null,
    errorMessage: "",
    refreshPlots: true,
    hasFetchedAllData: false,
    isLiveData: studyInfo.isLiveData,
    openMenu: false,
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
    console.log("Handling slider change: " + newValue);
    if (newValue === state.sliderValue) {
      return;
    }
    if (
      state.dataList &&
      state.dataList.timeRange.duration > state.displayInterval
    ) {
      let sliderValue = Math.min(
        Math.max(
          newValue,
          state.dataList.timeRange.startTime - state.dataTimeRange.startTime
        ),
        state.dataList.timeRange.endTime -
          state.dataTimeRange.startTime -
          state.displayInterval
      );
      let displayTimeRange = new TimeRange([
        state.dataTimeRange.startTime + sliderValue,
        state.dataTimeRange.startTime + sliderValue + state.displayInterval,
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
      const timeout = Math.min(2000, 1000 / stateRef.current.playingSpeed);
      handleSliderChange(
        null,
        stateRef.current.sliderValue + stateRef.current.playingSpeed
      );
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
      event.target.checked,
    );
    setState({
      ...stateRef.current,
      refreshPlots: true,
    });
  };

  const handleChannelOrderChange = (channel1Name, channel2Name) => {
    StorageUtility.switchChannelOrder(channel1Name, channel2Name);
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

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "ArrowLeft") {
        console.log("Move left");
      } else if (e.key === "ArrowRight") {
        console.log("Move right");
      }
    });
    window.addEventListener("resize", (e) => {
      console.log("studyDetails Resize called:");
      if (window.$resizeTimer) {
        console.log("Clear timer");
        clearTimeout(window.$resizeTimer);
      }
      window.$resizeTimer = setTimeout(function () {
        console.log("Resize done");
        setState({
          ...stateRef.current,
          resizeCount: state.resizeCount + 1,
          refreshPlots: true,
        });
      }, 250);
    });
    fetchData(true);
  }, []);

  const fullScreenHandle = useFullScreenHandle();

  if (state.dataList) {
    const plotProperties = StorageUtility.getPlotProperties();
    let displayDataList = {};
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
          <Plots
            dataList={displayDataList}
            refreshPlots={state.refreshPlots}
            plotProperties={plotProperties}
          />
          <XAxis
            disabled={fullScreenHandle.active}
            displayTimeRange={state.displayTimeRange}
            displayInterval={state.displayInterval}
            dataTimeRange={state.dataTimeRange}
            handleIntervalChange={handleIntervalChange}
          />
          <div style={{ display: "inline-block" }}>
            <IconButton
              disabled={fullScreenHandle.active}
              style={{ marginTop: -25 }}
              onClick={handleMenuClick}
            >
              <MenuIcon />
            </IconButton>
            <IconButton
              style={{ marginTop: -25 }}
              onClick={
                fullScreenHandle.active
                  ? fullScreenHandle.exit
                  : fullScreenHandle.enter
              }
            >
              <FullscreenIcon />
            </IconButton>
            <IconButton
              style={{ marginTop: -25 }}
              onClick={handleFastRewind}
              disabled={
                stateRef.current.playingSpeed > 0 &&
                stateRef.current.playingSpeed <
                  0.001 * stateRef.current.displayInterval
              }
            >
              <FastRewindIcon />
            </IconButton>
            <IconButton style={{ marginTop: -25 }} onClick={handlePlayPause}>
              {state.playingSpeed > 0 ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton
              style={{ marginTop: -25 }}
              onClick={handleFastForward}
              disabled={
                stateRef.current.playingSpeed > 0 &&
                stateRef.current.displayInterval <
                  2 * stateRef.current.playingSpeed
              }
            >
              <FastForwardIcon />
            </IconButton>
            <PropertyMenu
              openMenu={state.openMenu}
              plotProperties={plotProperties}
              channels={state.dataList.channels}
              handleMenuClose={handleMenuClose}
              handleChannelCheckboxChange={handleChannelCheckboxChange}
              handleColorChange={handleBackgroundColorChange}
              handlePreferenceChange={handlePreferenceChange}
              handleChannelOrderChange={handleChannelOrderChange}
              handleShowGridChange={handleShowGridChange}
            />
          </div>
          <div
            style={{ width: window.innerWidth - 260, display: "inline-block" }}
          >
            <TimeNavigation
              dataTimeRange={state.dataTimeRange}
              displayInterval={state.displayInterval}
              sliderValue={state.sliderValue}
              sliderMax={sliderMax}
              handleSliderChange={handleSliderChange}
              progressBarValue={progressBarValue}
              isLiveData={state.isLiveData}
            />
          </div>
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
    let query = { DataID: studyInfo.studyID };
    if (isFirst) {
      query = { DataID: studyInfo.studyID, RetrievalPreference: 4 };
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

  function updateData(newData) {
    if (newData && newData.length > 0) {
      if (stateRef.current.dataList) {
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
