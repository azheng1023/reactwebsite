export default class TimeRange {
  constructor(times) {
    if (times && times.length > 0) {
      this.isSet = true;
      this.startTime = times[0];
      this.endTime = times[times.length - 1];
    } else {
      this.isSet = false;
    }
  }

  merge(times) {
    if (times.length < 2) {
      throw new Error("Invalid times");
    } else if (this.isSet) {
      if (times[0] < this.startTime) {
        this.startTime = times[0];
      }
      if (times[times.length - 1] > this.endTime) {
        this.endTime = times[times.length - 1];
      }
    } else {
      this.startTime = times[0];
      this.endTime = times[times.length - 1];
    }
  }

  get duration() {
    return this.endTime - this.startTime;
  }

  getDurationHHMMSS() {
    return TimeRange.getDurationHHMMSS(this.duration);
  }

  static getDurationHHMMSS(durationInSeconds) {
    const sec = Math.round(durationInSeconds) % 60;
    const min = Math.floor(durationInSeconds / 60) % 60;
    const hour = Math.floor(durationInSeconds / 3600) % 24;
    const day = Math.floor(durationInSeconds / 86400);
    if (day > 0) {
      return (
        day +
        " " +
        hour.toString().padStart(2, "0") +
        ":" +
        min.toString().padStart(2, "0") +
        ":" +
        sec.toString().padStart(2, "0")
      );
    } else {
      return (
        hour.toString().padStart(2, "0") +
        ":" +
        min.toString().padStart(2, "0") +
        ":" +
        sec.toString().padStart(2, "0")
      );
    }
  }
}
