import { Timer } from "@material-ui/icons";
import TimeRange from "./TimeRange";

const epochDuration = 30;
const maximumHistoryLength = 20;
const SleepStageChannelName = "Sleep Stage";
const RespiratoryEventsChannelName = "Respiratory Event";
const stageSettings = [
  { name: "Unknown", shortName: "U", value: -1 },
  { name: "Wake", shortName: "W", value: 0 },
  { name: "REM", shortName: "R", value: 1 },
  { name: "Stage 1", shortName: "1", value: 2 },
  { name: "Stage 2", shortName: "2", value: 3 },
  { name: "Stage 3", shortName: "3", value: 4 },
];

const respiratoryEventSettings = [
  {
    type: 1,
    name: "Obstructive Apnea",
    backgroundColor: "#FF000020",
  },
  { type: 2, name: "Mixed Apnea", backgroundColor: "#FF000060" },
  { type: 3, name: "Centra Apnea", backgroundColor: "#FF0000A0" },
  { type: 4, name: "Hypopnea", backgroundColor: "#FFFF0040" },
  { type: 5, name: "REAR", backgroundColor: "#FF800040" },
];

export default class PSGScoring {
  #stages = [];
  #respiratoryEvents = [];
  #nextRespiratoryEventID = 0;
  #history = [];
  #historyIndex = -1;
  #dataID = 0;
  isDirty = false;
  timeRange = null;
  scorerID = 0;
  constructor(scorerID, dataID, timeRange) {
    this.scorerID = scorerID;
    this.timeRange = timeRange;
    this.#dataID = dataID;
    const epochCount = Math.ceil(timeRange.duration / epochDuration);
    this.#stages = new Array(epochCount).fill(-1);
    this._updateHistory(1);
  }

  addDataChunk(dataChunk) {
    let epoch = 1;
    if (this.#historyIndex >= 0 && this.#historyIndex < this.#history.length) {
      epoch = this.#history[this.#historyIndex].epoch;
    }
    switch (dataChunk.channelName) {
      case SleepStageChannelName:
        this.#stages = dataChunk.values.data;
        this.#nextRespiratoryEventID = 0;
        this.#history = [];
        this.#historyIndex = -1;
        break;
      case RespiratoryEventsChannelName:
        for (var i = 0; i < dataChunk.times.length; i++) {
          if (dataChunk.values.data[i] > 0) {
            this.addRespiratoryEvent(
              new TimeRange(dataChunk.times.slice(i, i + 2)),
              dataChunk.values.data[i]
            );
          }
        }
        this.#history = [];
        this.#historyIndex = -1;
        break;
      default:
        return;
    }
    this._updateHistory(epoch);
    this.isDirty = false;
  }

  updateStage(epoch, stage) {
    if (epoch > 0 && epoch <= this.#stages.length) {
      this.#stages[epoch - 1] = stage;
      this._updateHistory(epoch);
    }
  }

  getStages(startEpoch, count) {
    if (startEpoch < 1) {
      if (count) {
        count = count + startEpoch - 1;
      }
      startEpoch = 1;
    }
    if (count) {
      if (count === 1) {
        return this.#stages[startEpoch - 1];
      } else {
        return this.#stages.slice(startEpoch - 1, startEpoch - 1 + count);
      }
    } else {
      return this.#stages.slice(startEpoch - 1);
    }
  }

  addRespiratoryEvent(timeRange, type) {
    let insertIndex = 0;
    for (var i = 0; i < this.#respiratoryEvents.length; i++) {
      if (
        timeRange.startTime < this.#respiratoryEvents[i].timeRange.startTime
      ) {
        if (
          timeRange.endTime > this.#respiratoryEvents[i].timeRange.startTime
        ) {
          return;
        }
        break;
      }
      insertIndex = i + 1;
    }
    this.#respiratoryEvents.splice(insertIndex, 0, {
      timeRange: timeRange,
      type: type,
      ID: this.#nextRespiratoryEventID,
    });
    this.#nextRespiratoryEventID++;
    this._updateHistory(
      Math.ceil(
        (timeRange.startTime - this.timeRange.startTime) / epochDuration
      )
    );
  }

  getRespiratoryEvents(timeRange) {
    let events = [];
    for (var i = 0; i < this.#respiratoryEvents.length; i++) {
      const rawEvent = this.#respiratoryEvents[i];
      if (timeRange.intersects(rawEvent.timeRange)) {
        rawEvent.index = i;
        events.push(rawEvent);
      } else if (rawEvent.timeRange.startTime > timeRange.endTime) {
        break;
      }
    }
    return events;
  }

  updateRespiratoryEvent(index, newTimeRange, newType) {
    if (index >= 0 && index < this.#respiratoryEvents.length) {
      if (newTimeRange) {
        if (
          index > 0 &&
          newTimeRange.startTime <
            this.#respiratoryEvents[index - 1].timeRange.endTime
        ) {
          return;
        }
        if (
          index + 1 < this.#respiratoryEvents.length &&
          newTimeRange.endTime >
            this.#respiratoryEvents[index + 1].timeRange.startTime
        ) {
          return;
        }
        this.#respiratoryEvents[index].timeRange = newTimeRange;
      }
      if (newType !== undefined) {
        this.#respiratoryEvents[index].type = newType;
      }
      this.isDirty = true;
    }
  }

  deleteRespiratoryEvent(index) {
    if (index >= 0 && index < this.#respiratoryEvents.length) {
      const timeRange = this.#respiratoryEvents[index].timeRange;
      this.#respiratoryEvents.splice(index, 1);
      this._updateHistory(
        Math.ceil(
          (timeRange.startTime - this.timeRange.startTime) / epochDuration
        )
      );
    }
  }

  clearAllEvents() {
    this.#respiratoryEvents = [];
    this.#stages = new Array(this.#stages.length).fill(-1);
    this._updateHistory(1);
  }

  get canUndo() {
    return this.#historyIndex > 0;
  }

  get canRedo() {
    return this.#historyIndex + 1 < this.#history.length;
  }

  undo() {
    if (this.#historyIndex > 0) {
      this.#historyIndex--;
      this.#stages = [...this.#history[this.#historyIndex].stages];
      this.#respiratoryEvents = [
        ...this.#history[this.#historyIndex].respiratoryEvents,
      ];
      this.isDirty = true;
      return this.#history[this.#historyIndex + 1].epoch;
    }
  }

  redo() {
    if (this.#historyIndex + 1 < this.#history.length) {
      this.#historyIndex++;
      this.#stages = [...this.#history[this.#historyIndex].stages];
      this.#respiratoryEvents = [
        ...this.#history[this.#historyIndex].respiratoryEvents,
      ];
      this.isDirty = true;
      return this.#history[this.#historyIndex].epoch;
    }
  }

  getDataChunks() {
    const dataChunks = [];
    const stages = {
      dataID: this.#dataID,
      channelName: SleepStageChannelName,
      times: [this.timeRange.startTime, epochDuration],
      values: {
        dataType: 3,
        data: this.#stages,
      },
    };
    dataChunks.push(stages);
    const resEventTimes = [this.timeRange.startTime];
    const resEventValues = [0];
    this.#respiratoryEvents.forEach((event) => {
      resEventTimes.push(event.timeRange.startTime);
      resEventTimes.push(event.timeRange.endTime);
      resEventValues.push(event.type);
      resEventValues.push(0);
    });
    resEventTimes.push(this.timeRange.endTime);
    resEventValues.push(0);
    const respiratoryEvents = {
      dataID: this.#dataID,
      channelName: RespiratoryEventsChannelName,
      times: resEventTimes,
      values: {
        dataType: 3,
        data: resEventValues,
      },
    };
    dataChunks.push(respiratoryEvents);
    return dataChunks;
  }

  getSummary() {
    let summary = { "?RECORDING": "" };
    summary["Recording Start Time"] = new Date(
      1000 * this.timeRange.startTime
    ).toLocaleString();
    summary["Recording End Time"] = new Date(
      1000 * this.timeRange.endTime
    ).toLocaleString();
    summary["Total Recording Time"] = TimeRange.getDurationHHMMSS(
      this.timeRange.duration
    );
    summary["Lights Off Time"] = new Date(
      1000 * this.timeRange.startTime
    ).toLocaleString();
    summary["Lights On Time"] = new Date(
      1000 * this.timeRange.endTime
    ).toLocaleString();
    summary["Total Lights Off Time"] = TimeRange.getDurationHHMMSS(
      this.timeRange.duration
    );
    summary["?STAGE"] = "";
    let othersCount = 0;
    let wakeCount = 0;
    let REMCount = 0;
    let N1Count = 0;
    let N2Count = 0;
    let N3Count = 0;
    let REMOnset = -1;
    let sleepOnset = -1;
    for (let i = 0; i < this.#stages.length; i++) {
      const stage = this.#stages[i];
      switch (stage) {
        case 0:
          wakeCount++;
          break;
        case 1:
          if (REMOnset === -1) {
            REMOnset = i;
            if (sleepOnset === -1) {
              sleepOnset = i;
            }
          }
          REMCount++;
          break;
        case 2:
          if (sleepOnset === -1) {
            sleepOnset = i;
          }
          N1Count++;
          break;
        case 3:
          if (sleepOnset === -1) {
            sleepOnset = i;
          }
          N2Count++;
          break;
        case 4:
          if (sleepOnset === -1) {
            sleepOnset = i;
          }
          N3Count++;
          break;
        case -1:
        default:
          othersCount++;
          break;
      }
    }
    summary["Total Sleep Time"] = TimeRange.getDurationHHMMSS(
      (this.#stages.length - wakeCount - othersCount) * epochDuration
    );
    summary["Sleep Efficiency"] =
      (
        (100.0 * (this.#stages.length - wakeCount - othersCount)) /
        this.#stages.length
      ).toFixed(1) + "%";
    summary["Sleep Onset Latency"] = TimeRange.getDurationHHMMSS(
      sleepOnset * epochDuration
    );
    summary["REM Onset Latency"] = TimeRange.getDurationHHMMSS(
      REMOnset * epochDuration
    );
    summary["Total Wake (Time/%)"] =
      TimeRange.getDurationHHMMSS(wakeCount * epochDuration) +
      "/" +
      ((100.0 * wakeCount) / this.#stages.length).toFixed(1) +
      "%";
    summary["Total REM (Time/%)"] =
      TimeRange.getDurationHHMMSS(REMCount * epochDuration) +
      "/" +
      ((100.0 * REMCount) / this.#stages.length).toFixed(1) +
      "%";
    summary["Total N1 (Time/%)"] =
      TimeRange.getDurationHHMMSS(N1Count * epochDuration) +
      "/" +
      ((100.0 * N1Count) / this.#stages.length).toFixed(1) +
      "%";
    summary["Total N2 (Time/%)"] =
      TimeRange.getDurationHHMMSS(N2Count * epochDuration) +
      "/" +
      ((100.0 * N2Count) / this.#stages.length).toFixed(1) +
      "%";
    summary["Total N3 (Time/%)"] =
      TimeRange.getDurationHHMMSS(N3Count * epochDuration) +
      "/" +
      ((100.0 * N3Count) / this.#stages.length).toFixed(1) +
      "%";
    summary["?RESPIRATORY"] = "";
    let obstructiveApneaCount = 0;
    let mixedApneaCount = 0;
    let centralApneaCount = 0;
    let hypopneaCount = 0;
    let RERACount = 0;
    let obstructiveApneaTime = 0;
    let mixedApneaTime = 0;
    let centralApneaTime = 0;
    let hypopneaTime = 0;
    let RERATime = 0;
    this.#respiratoryEvents.forEach((event) => {
      switch (event.type) {
        case 1:
          obstructiveApneaCount++;
          obstructiveApneaTime += event.timeRange.duration;
          break;
        case 2:
          mixedApneaCount++;
          mixedApneaTime += event.timeRange.duration;
          break;
        case 3:
          centralApneaCount++;
          centralApneaTime += event.timeRange.duration;
          break;
        case 4:
          hypopneaCount++;
          hypopneaTime += event.timeRange.duration;
          break;
        case 5:
          RERACount++;
          RERATime += event.timeRange.duration;
          break;
        default:
          break;
      }
    });
    summary["AHI"] = (
      ((obstructiveApneaCount +
        mixedApneaCount +
        centralApneaCount +
        hypopneaCount) /
        this.timeRange.duration) *
      3600
    ).toFixed(1);
    summary["RDI"] = (
      ((obstructiveApneaCount +
        mixedApneaCount +
        centralApneaCount +
        hypopneaCount +
        RERACount) /
        this.timeRange.duration) *
      3600
    ).toFixed(1);
    summary["Obstructive Apnea Count/Time"] =
      obstructiveApneaCount +
      "/" +
      TimeRange.getDurationHHMMSS(obstructiveApneaTime);
    summary["Mixed Apnea Count/Time"] =
      mixedApneaCount +
      "/" +
      TimeRange.getDurationHHMMSS(mixedApneaTime);
    summary["Central Apnea Count/Time"] =
      centralApneaCount +
      "/" +
      TimeRange.getDurationHHMMSS(centralApneaTime);
    summary["Hypopnea Count/Time"] =
      hypopneaCount +
      "/" +
      TimeRange.getDurationHHMMSS(hypopneaTime);
    summary["RERA Count/Time"] =
      RERACount +
      "/" +
      TimeRange.getDurationHHMMSS(RERATime);
    return summary;
  }

  _updateHistory(epoch, updateEventIndex) {
    if (
      this.#history.length > this.#historyIndex + 1 &&
      this.#historyIndex >= 0
    ) {
      this.#history.splice(this.#historyIndex + 1);
    }
    this.#history.push({
      epoch: epoch,
      stages: [...this.#stages],
      respiratoryEvents: this.#respiratoryEvents.slice(),
    });
    this.#historyIndex++;
    if (this.#history.length > maximumHistoryLength) {
      this.#history.pop();
      this.#historyIndex--;
    }
    this.isDirty = true;
  }

  static getStageLabel(stage) {
    const stageSetting = stageSettings.filter((setting) => {
      return setting.value === stage;
    });
    if (stageSetting && stageSetting.length > 0) {
      return stageSetting[0].shortName;
    } else {
      return "U";
    }
  }

  static getStageFromLabel(stageLabel) {
    const stageSetting = stageSettings.filter((setting) => {
      return setting.shortName === stageLabel;
    });
    if (stageSetting && stageSetting.length > 0) {
      return stageSetting[0].value;
    } else {
      return -1;
    }
  }

  static getRespiratoryEventSettings() {
    return respiratoryEventSettings;
  }

  static getRespiratoryEvent(type) {
    return respiratoryEventSettings[type - 1];
  }
}
