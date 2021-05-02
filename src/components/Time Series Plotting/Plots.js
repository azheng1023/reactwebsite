import { Typography } from "@material-ui/core";
import React, { Component } from "react";
import { PlotPropertyName } from "../../models/StorageUtility";
import { MessagedProgress } from "../MessagedProgress";
import { Plot } from "./Plot";

class Plots extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.refreshPlots;
  }

  handleFilterChange = () => {
    console.log("handleFilterChange");
  };

  render() {
    console.log("plots called");
    const { dataList, plotProperties } = this.props;
    const totalPlotHeight = window.innerHeight - 115;
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
      const plotHeight = totalPlotHeight / dataList.length;
      return (
        <div style={{ backgroundColor: plotProperties.backgroundColor }}>
          {plotProperties.watermark !== "none" && (
            <div
              style={{
                position: "absolute",
                opacity: 0.15,
                width: "100%",
                marginTop: totalPlotHeight / 2 - 60,
                textAlign: "center",
                zIndex: 1000,
              }}
            >
              <Typography variant="h1">Watermark</Typography>
            </div>
          )}
          {dataList.map(
            (data) =>
              plotProperties.channels[data.channelName].visible && (
                <Plot
                  id={data.channelName}
                  key={data.channelName}
                  channelName={data.channelName}
                  height={plotHeight}
                  data={data.values}
                  channelProperties={plotProperties.channels[data.channelName]}
                  showGrid={plotProperties[PlotPropertyName.showGrid]}
                  handleFilterChange={this.handleFilterChange}
                />
              )
          )}
        </div>
      );
    }
  }
}

export default Plots;
