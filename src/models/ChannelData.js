import DataChunk from "./DataChunk";
export default class ChannelData {
  channelName;
  #dataChunks; // List of data chunks ordered by time
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
            if (this.#dataChunks[i].timeRange.endTime < times[0]) {
              this.#dataChunks.splice(i + 1, 0, new DataChunk(times, values));
            } else {
              console.log(
                "Dupilcated data?",
                this.#dataChunks[i].timeRange.startTime,
                this.#dataChunks[i].timeRange.endTime,
                times[0],
                times[1]
              );
            }
          }
          return;
        }
      }
      if (!this.#dataChunks[0].add(times, values)) {
        this.#dataChunks.splice(0, 0, new DataChunk(times, values));
      }
    }
  }

  get comments(){
    let comments = [];
    for (let i = 0; i < this.#dataChunks.length; i++) {
      comments = comments.concat(this.#dataChunks[i].comments);
    }
    comments.map(comment => comment.channel = this.channelName);
    return comments;
  }

  get plotRange(){
    for (let i = 0; i < this.#dataChunks.length; i++) {
      const plotRange = this.#dataChunks[i].plotRange;
      if (plotRange){
        return plotRange;
      }
    }
    return null;
  }

  getData(timeRange) {
    let data = [];
    for (let i = 0; i < this.#dataChunks.length; i++) {
      const chunkTimeRange = this.#dataChunks[i].timeRange;
      if (timeRange.intersects(chunkTimeRange)) {
        const chunkData = this.#dataChunks[i].getData(timeRange);
        data.push(chunkData);
      }
    }
    return data;
  }
}
