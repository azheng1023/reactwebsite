import React, { Component } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import StorageUtility, { PlotPropertyName } from "../../models/StorageUtility";
import { MessagedProgress } from "../MessagedProgress";
import Plot from "./Plot";
import { Watermark } from "./Watermark";
import PSGScoring from "../../models/PSGScoring";

const getItemStyle = (isDragging, draggableStyle) => ({
  // change background colour if dragging
  background: isDragging ? "#DCEDC8" : "transparent",
  // styles we need to apply on draggables
  ...draggableStyle,
});

class Plots extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dropEnded: false,
    };
    this.draggableChannel = "";
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.refreshPlots;
  }

  handleRefreshPlot = (channelName) => {
    this.props.handleRefreshPlots(channelName);
  };

  handleDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    StorageUtility.switchChannelOrder(
      this.visibleOrderedChannels[result.source.index],
      this.visibleOrderedChannels[result.destination.index]
    );
    this.setState({
      dropEnded: true,
    });
  };

  handleEnableDrag = (channelName) => {
    this.draggableChannel = channelName;
    this.setState({
      dropEnded: true,
    });
  };

  getData(dataList, channelName) {
    const data = dataList.find((data) => data.channelName === channelName);
    return data.data;
  }

  getWatermark(watermarkTypes) {
    const numberOfEpochs = Math.round(
      this.props.displayTimeRange.duration / 30
    );
    let watermarks = [];
    if (numberOfEpochs <= 10) {
      for (let i = 0; i < numberOfEpochs; i++) {
        let watermark = "";
        if (watermarkTypes.includes("Epoch")) {
          watermark = this.props.startEpochNumber + i;
        }
        if (this.props.scores && 
          (watermarkTypes.includes("Stage") || this.props.enablePSGScoring)) {
          const sleepStage = PSGScoring.getStageLabel(
            this.props.scores.getStages(this.props.startEpochNumber + i, 1)
          );
          if (watermark) {
            watermark += " / " + sleepStage;
          } else {
            watermark = sleepStage;
          }
        }
        watermarks.push(watermark);
      }
    }
    return watermarks;
  }

  render() {
    console.log("plots called");
    const { dataList, plotProperties, displayTimeRange, channelNames } =
      this.props;
    const totalPlotHeight = window.innerHeight - 115;
    this.visibleOrderedChannels =
      StorageUtility.getVisibleOrderedChannels(channelNames);
    if (dataList.length === 0) {
      return (
        <div
          style={{
            backgroundColor: plotProperties.backgroundColor,
            height: totalPlotHeight,
          }}
        >
          <MessagedProgress
            message="No channel is selected to plot. Please select channels to plot."
            hideProgress={true}
          />
        </div>
      );
    } else {
      const watermarkMarginLeft = plotProperties[
        PlotPropertyName.showChannelLabel
      ]
        ? 75
        : 0;
      const plotHeight = totalPlotHeight / dataList.length;
      if (this.props.enablePSGScoring) {
        return (
          <div style={{ backgroundColor: plotProperties.backgroundColor }}>
            <Watermark
              marginLeft={watermarkMarginLeft}
              height={totalPlotHeight}
              marks={this.getWatermark(plotProperties.watermark)}
            ></Watermark>
            {this.visibleOrderedChannels.map((channelName) => (
              <Plot
                id={channelName}
                key={channelName}
                channelName={channelName}
                height={plotHeight}
                data={this.getData(dataList, channelName)}
                channelProperties={plotProperties.channels[channelName]}
                channelLabelFontSize={plotProperties.channelLabelFontSize}
                showGrid={plotProperties[PlotPropertyName.showGrid]}
                showChannelLabel={
                  plotProperties[PlotPropertyName.showChannelLabel]
                }
                displayTimeRange={displayTimeRange}
                channelNames={channelNames}
                handleRefreshPlot={this.handleRefreshPlot}
                handleEnableDrag={this.handleEnableDrag}
                enablePSGScoring={this.props.enablePSGScoring}
                scores={
                  plotProperties[PlotPropertyName.respiratoryChannel] ===
                  channelName
                    ? this.props.scores
                    : null
                }
              />
            ))}
          </div>
        );
      } else {
        return (
          <div style={{ backgroundColor: plotProperties.backgroundColor }}>
            <Watermark
              marginLeft={watermarkMarginLeft}
              height={totalPlotHeight}
              marks={this.getWatermark(plotProperties.watermark)}
            ></Watermark>
            <DragDropContext onDragEnd={this.handleDragEnd}>
              <Droppable droppableId="droppable">
                {(provided, snapshot) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {this.visibleOrderedChannels.map((channelName) => (
                      <Draggable
                        key={channelName}
                        draggableId={channelName}
                        isDragDisabled={this.draggableChannel !== channelName}
                        index={this.visibleOrderedChannels.indexOf(channelName)}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={getItemStyle(
                              snapshot.isDragging,
                              provided.draggableProps.style
                            )}
                          >
                            <Plot
                              id={channelName}
                              key={channelName}
                              channelName={channelName}
                              height={plotHeight}
                              width={this.props.width}
                              data={this.getData(dataList, channelName)}
                              channelProperties={
                                plotProperties.channels[channelName]
                              }
                              showGrid={
                                plotProperties[PlotPropertyName.showGrid]
                              }
                              showChannelLabel={
                                plotProperties[
                                  PlotPropertyName.showChannelLabel
                                ]
                              }
                              showChannelScale={plotProperties[PlotPropertyName.showChannelScale]}
                              channelLabelFontSize={plotProperties.channelLabelFontSize}
                              displayTimeRange={displayTimeRange}
                              channelNames={channelNames}
                              handleRefreshPlot={this.handleRefreshPlot}
                              handleEnableDrag={this.handleEnableDrag}
                              enablePSGScoring={this.props.enablePSGScoring}
                              scores={
                                plotProperties[
                                  PlotPropertyName.respiratoryChannel
                                ] === channelName
                                  ? this.props.scores
                                  : null
                              }
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        );
      }
    }
  }
}

export default Plots;
