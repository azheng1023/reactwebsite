import ChannelData from "./ChannelData";
import StorageUtility from "./StorageUtility";
import TimeRange from "./TimeRange";

export default class ChannelDataList {
  #channelDataList;
  timeRange; // TODO: Do not expose that
  constructor(dataList) {
    this.#channelDataList = {};
    this.timeRange = null;
    if (dataList) {
      this.add(dataList);
    }
  }

  add(dataList) {
    for (var i = 0; i < dataList.length; i++) {
      const channelName = dataList[i].channelName;
      if (dataList[i].times.length === 1) {
        if (dataList[i].values.length !== 1) {
          throw new Error(
            "Invalid data format (times.length = 1 while values.length != 1."
          );
        }
        dataList[i].times.push(dataList[i].times[0]);
      }
      if (
        dataList[i].times.length === 2 &&
        dataList[i].times[1] < dataList[i].times[0]
      ) {
        dataList[i].times[1] =
          dataList[i].times[0] +
          (dataList[i].values.data.length - 1) * dataList[i].times[1];
      }
      this.updateTimeRange(dataList[i].times);
      if (this.#channelDataList[channelName]) {
        this.#channelDataList[channelName].add(
          dataList[i].times,
          dataList[i].values
        );
      } else {
        this.#channelDataList[channelName] = new ChannelData(
          channelName,
          dataList[i].times,
          dataList[i].values
        );
      }
    }
  }

  get channels(){
    return Object.keys(this.#channelDataList);
  }

  getData(timeRange, pixelCount) {
    const orderedVisibleChannelNames = StorageUtility.getVisibleOrderedChannels(this.channels);
    let requestedDataList = [];
    orderedVisibleChannelNames.forEach((channelName)=>{
      const timeValues = this.#channelDataList[channelName].getData(
        timeRange,
        pixelCount
      );
      requestedDataList.push({
        channelName: channelName,
        times: timeValues.times,
        values: timeValues.values,
        plotRange: timeValues.plotRange,
      });
    });
    return requestedDataList;
  }

  updateTimeRange(times) {
    if (this.timeRange) {
      this.timeRange.merge(times);
    } else {
      this.timeRange = new TimeRange(times);
    }
  }
}
