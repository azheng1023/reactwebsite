import DataChunk from "./DataChunk";
import StorageUtility, { PlotPropertyName } from "../models/StorageUtility";

export default class ChannelData {
  channelName;
  #dataChunks;
  constructor(channelName, times, values) {
    this.channelName = channelName;
    this.#dataChunks = [];
    this.add(times, values);
  }

  add(times, values) {
    if (this.#dataChunks.length === 0) {
      this.#dataChunks.push(new DataChunk(times, values));
    } else {
      // Find which datachunk to merge
      for (var i = this.#dataChunks.length - 1; i >= 0; i--) {
        if (this.#dataChunks[i].timeRange.startTime <= times[0]) {
          if (!this.#dataChunks[i].add(times, values)) {
            //this.#dataChunks.splice(i + 1, 0, new DataChunk(times, values));
          }
          return;
        }
      }
      if (!this.#dataChunks[0].add(times, values)) {
        this.#dataChunks.splice(0, 0, new DataChunk(times, values));
      }
    }
  }

  getData(timeRange, pixelCount) {
    // TODO: Deal with multiple chunks
    const data = this.#dataChunks[0].getData(timeRange, pixelCount);
    const savedPlotRange = StorageUtility.getChannelProperty(this.channelName, PlotPropertyName.range);
    if (savedPlotRange === null || savedPlotRange.length !== 2){
      StorageUtility.updateChannelProperty(this.channelName, PlotPropertyName.range, data.plotRange);
    }
    return data;
  }
}
