import ChannelData from "./ChannelData";
import { HighPassFilter, LowPassFilter, NotchFilter } from "./Filters";
import PSGScoring from "./PSGScoring";
import StorageUtility, { PlotPropertyName } from "./StorageUtility";
import TimeRange from "./TimeRange";
import { binarySearch } from "./Utilities";

const standardChannelNames = {
  technical: "Event",
  airflow: "Nasal",
  "nose airflow": "Nasal",
  flow: "Nasal",
  "nasal/oral airflow": "Nasal",
  rate: "heartrate",
  sao2: "SPO2",
  sp02: "SPO2",
  micro: "snore",
  "pressure snore": "snore",
  "p-snore": "snore",
  sono: "snore",
  tho: "Chest",
  "effort tho": "Chest",
  rc: "Chest",
  pulser: "Pulse",
  pulserate: "Pulse",
  "ecg i": "ECG",
  ecgi: "ECG",
  ecg1: "ECG",
  "subr-subl": "ECG",
  "ecg 2-ecg 1": "ECG",
  "ecg ii": "ECGII",
  ecg2: "ECGII",
  "sub-r - v5": "ECGII",
  body: "BPos",
  "body position": "BPos",
  "fp2:fp1": "Fp2",
  f3m2: "F3",
  f3a2: "F3",
  "f3:m2": "F3",
  "f3:a2": "F3",
  "f3-a2": "F3",
  "f3-m2": "F3",
  f4m1: "F4",
  f4a1: "F4",
  "f4:m1": "F4",
  "f4:a1": "F4",
  "f4-a1": "F4",
  "f4-m1": "F4",
  "f4:f3": "F4",
  a1: "M1",
  "a1-a2": "M1",
  "m2:m1": "M2",
  a2: "M2",
  c3m2: "C3",
  c3a2: "C3",
  "c3:m2": "C3",
  "c3:a2": "C3",
  "c3-m2": "C3",
  "c3-a2": "C3",
  "c3:c4": "C3",
  "c3-a1a2": "C3",
  "c3-a1": "C3",
  c4m1: "C4",
  c4a1: "C4",
  "c4:m1": "C4",
  "c4:a1": "C4",
  "c4-a1": "C4",
  "c4-m1": "C4",
  "c4-a2": "C4",
  o1m2: "O1",
  o1a2: "O1",
  "o1:m2": "O1",
  "o1:a2": "O1",
  "o1-a2": "O1",
  "o1-m2": "O1",
  "o1-x": "O1",
  o2m1: "O2",
  o2a1: "O2",
  "o2:m1": "O2",
  "o2:a1": "O2",
  "o2-a1": "O2",
  "o2-m1": "O2",
  "o2:o1": "O2",
  "o2-x": "O2",
  e1: "LOC",
  leog: "LOC",
  "e1:m2": "LOC",
  e1m2: "LOC",
  e1m1: "LOC",
  "e1:m1": "LOC",
  "e1 - m2": "LOC",
  "loc-fpz": "LOC",
  "loc-m2": "LOC",
  "eog loc-0": "LOC",
  "eog loc-a2": "LOC",
  leye: "LOC",
  "leog-x": "LOC",
  "eog-l": "LOC",
  reog: "ROC",
  "e2:m1": "ROC",
  e2m1: "ROC",
  e2m2: "ROC",
  "e2:m2": "ROC",
  "e2 - m1": "ROC",
  "roc-fpz": "ROC",
  "roc-m1": "ROC",
  "eog roc-0": "ROC",
  "eog roc-a1": "ROC",
  reye: "ROC",
  "reog-x": "ROC",
  "eog-r": "ROC",
  e2: "ROC",
  chinemg: "Chin",
  emg1: "Chin",
  "chin1 - chin2": "Chin",
  "chin 1-chin 2": "Chin",
  "submental emg": "Chin",
  "emg chin": "Chin",
  chn1: "Chin",
  "chin emg": "Chin",
  subm: "Chin",
  china: "Chin",
  emg2: "Chin2",
  emg3: "Chin2",
  "chinemg2.chn2": "Chin2",
  chinr: "Chin2",
  "r leg": "RAT",
  leg1: "RAT",
  rleg: "RAT",
  "r-leg1": "RAT",
  "r-leg2": "RAT",
  "rat1-rat2": "RAT",
  "left leg-right leg": "RAT",
  "la1-la2": "RAT",
  "leg 1": "RAT",
  tflow: "Nasor",
  tflo: "Nasor",
  "flow patient": "Nasor",
  "nasal therm": "Nasor",
  "o/n flow": "Nasor",
  pflow: "NasalSn",
  pflo: "NasalSn",
  "flow patient2": "NasalSn",
  "nasal pressure": "NasalSn",
  "pressure flow": "NasalSn",
  ptaf: "NasalSn",
  "nasal p": "NasalSn",
  pressure: "NasalSn",
  "effort abd": "Abd",
  abdomen: "Abd",
  pleth: "PPG",
  plesmo: "PPG",
  "cpap pressure": "PAP Pres",
  "tidal vol": "PAP TV",
  "cpap leak": "PAP Leak",
  leak: "PAP Leak",
  "c-leak": "PAP Leak",
  "leak total": "PAP Leak",
  "cpap flow": "PAP Pt Flo",
  cflow: "PAP Pt Flo",
  cflo: "PAP Pt Flo",
  "flow patient3": "PAP Pt Flo",
  "l leg": "LAT",
  leg2: "LAT",
  lleg: "LAT",
  "l-leg1": "LAT",
  "l-leg2": "LAT",
  "lat1-lat2": "LAT",
  "leg 2": "LAT",
  etco2: "Oral-CO2",
  "etco2 digital": "Oral-CO2",
  "etco2 wave": "Oral-CO2",
  "tcco2 digital": "TcCO2",
  "co2 endtidal": "TcCO2",
  "xpap ipap": "ipap",
  "xpap epap": "epap",
  imp: "Impedan",
  sum: "Sum.RIPs",
  rip: "Sum.RIPs",
  a1a2: "m1m2",
  "ic1-ic2": "RIC",
};

export default class ChannelDataList {
  #channelDataList;
  #scores = [];
  #scoreIndex = -1;
  #comments = null;
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
      if (dataList[i].times.length === 1) {
        if (dataList[i].values.data.length !== 1) {
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
      if (dataList[i].sentByUserID && dataList[i].sentByUserID !== 0) {
        this.initializeNewScore(
          dataList[i].sentByUserID,
          dataList[i].dataID,
          this.timeRange
        );
        this.PSGScores.addDataChunk(dataList[i]);
      } else {
        const channelName = this._getStandardChannelName(
          dataList[i].channelName
        );
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
    this.#comments = null;
  }

  get channelNames() {
    return Object.keys(this.#channelDataList);
  }

  get PSGScores() {
    if (this.#scoreIndex >= 0) {
      return this.#scores[this.#scoreIndex];
    } else {
      return null;
    }
  }

  get comments() {
    if (this.#comments === null) {
      this.#comments = [];
      for (const [key, value] of Object.entries(this.#channelDataList)) {
        this.#comments = this.#comments.concat(value.comments);
      }
      if (this.#comments && this.#comments.length > 0) {
        this.#comments.sort((c1, c2) => (c1.time > c2.time ? 1 : -1));
        for (let i = 0; i < this.#comments.length; i++){
          this.#comments[i].id = i;
        }
      }
    }
    return this.#comments;
  }

  setPSGScoreIndex(index) {
    if (index >= 0 && index < this.#scores.length) {
      this.#scoreIndex = index;
    }
  }

  initializeNewScore(scorerID, dataID, timeRange) {
    for (var i = 0; i < this.#scores.length; i++) {
      if (this.#scores[i].scorerID === scorerID) {
        this.#scoreIndex = i;
        return;
      }
    }
    this.#scores.push(new PSGScoring(scorerID, dataID, timeRange));
    this.#scoreIndex = this.#scores.length - 1;
  }

  getData(timeRange, pixelCount) {
    console.log("ChannelDataList getData called: ", Date.now());
    const orderedVisibleChannelNames = StorageUtility.getVisibleOrderedChannels(
      this.channelNames
    );
    const plotProperties = StorageUtility.getPlotProperties();
    //
    // Steps:
    //   1. Get all the required channels with additional time to append to the start
    //   2. Expand time range
    //   3. Get raw data for the expaned time range
    //   4. Channel referencing
    //   5. Filtering
    //   6. Shrink to original time range
    //   7. Get plot data
    //
    const additionalTimesToAppend = this._getTimeToExpand(
      orderedVisibleChannelNames,
      plotProperties
    );
    let allRequiredRawDataList = {};
    for (const [key, value] of Object.entries(additionalTimesToAppend)) {
      const newTimeRange = new TimeRange([
        timeRange.startTime - value,
        timeRange.endTime,
      ]);
      const data = this.#channelDataList[key].getData(newTimeRange);
      allRequiredRawDataList[key] = data;
    }
    let requestedDataList = [];
    orderedVisibleChannelNames.forEach((channelName) => {
      const channelProperties = plotProperties.channels[channelName];
      const referencedData = this._getReferencedData(
        channelName,
        channelProperties,
        allRequiredRawDataList
      );
      const filteredData = this._getFilteredData(
        referencedData,
        channelProperties
      );
      const dataWithOriginalTimeRange = this._getDataWith(
        filteredData,
        timeRange.startTime,
        0
      );
      const deltaTimePerPixel = timeRange.duration / pixelCount;
      dataWithOriginalTimeRange.forEach((dataChunk) => {
        const plotData = this._getPlotData(dataChunk, deltaTimePerPixel);
        dataChunk.times = plotData.times;
        dataChunk.values = plotData.values;
      });
      requestedDataList.push({
        channelName: channelName,
        data: dataWithOriginalTimeRange,
      });
    });
    console.log("ChannelDataList getData finished: ", Date.now());
    return requestedDataList;
  }

  _getTimeToExpand(orderedVisibleChannelNames, plotProperties) {
    const additionalTimesToAppend = {};
    orderedVisibleChannelNames.forEach((channelName) => {
      const channelProperties = plotProperties.channels[channelName];
      let additionalSecondsToAppend = 0;
      if (channelProperties[PlotPropertyName.notchFilter] !== "None") {
        additionalSecondsToAppend = 1.5;
      }
      if (!isNaN(channelProperties[PlotPropertyName.lowFrequencyFilter])) {
        additionalSecondsToAppend = Math.max(
          additionalSecondsToAppend,
          0.6 / channelProperties[PlotPropertyName.lowFrequencyFilter]
        );
      }
      if (!isNaN(channelProperties[PlotPropertyName.highFrequencyFilter])) {
        additionalSecondsToAppend = Math.max(
          additionalSecondsToAppend,
          7.5 / channelProperties[PlotPropertyName.highFrequencyFilter]
        );
      }
      if (
        !additionalTimesToAppend[channelName] ||
        additionalTimesToAppend[channelName] < additionalSecondsToAppend
      ) {
        additionalTimesToAppend[channelName] = additionalSecondsToAppend;
      }
      channelProperties[PlotPropertyName.referenceChannels].forEach(
        (referenceChannel) => {
          if (
            !additionalTimesToAppend[referenceChannel] ||
            additionalTimesToAppend[referenceChannel] <
              additionalSecondsToAppend
          ) {
            additionalTimesToAppend[referenceChannel] =
              additionalSecondsToAppend;
          }
        }
      );
    });
    return additionalTimesToAppend;
  }

  _getReferencedData(channelName, channelProperties, rawDataList) {
    const referenceChannelDataList = [];
    const channelData = rawDataList[channelName];
    if (channelData.length === 0) {
      return channelData;
    }
    const channelDataStartTime = channelData[0].times[0];
    channelProperties[PlotPropertyName.referenceChannels].forEach(
      (referenceChannel) => {
        const referenceChannelData = this._getDataWith(
          rawDataList[referenceChannel],
          channelDataStartTime
        );
        let isValid = true;
        if (channelData.length !== referenceChannelData.length) {
          isValid = false;
        } else {
          for (let i = 0; i < channelData.length; i++) {
            if (
              channelData[i].times.length !==
              referenceChannelData[i].times.length
            ) {
              isValid = false;
              break;
            }
          }
        }
        if (isValid) {
          referenceChannelDataList.push(referenceChannelData);
        }
      }
    );
    if (referenceChannelDataList.length !== 0) {
      const factor = 1.0 / referenceChannelDataList.length;
      referenceChannelDataList.forEach((referenceChannelData) => {
        for (let i = 0; i < channelData.length; i++) {
          for (let j = 0; j < channelData[i].values.length; j++) {
            channelData[i].values[j] -=
              factor * referenceChannelData[i].values[j];
          }
        }
      });
    }
    return channelData;
  }

  _getFilteredData(data, channelProperties) {
    const filters = [];
    let samplingTime = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i].samplingTime !== 0) {
        samplingTime = data[i].samplingTime;
        break;
      }
    }
    if (channelProperties[PlotPropertyName.notchFilter] === "50 Hz") {
      filters.push(new NotchFilter(50, samplingTime));
    } else if (channelProperties[PlotPropertyName.notchFilter] === "60 Hz") {
      filters.push(new NotchFilter(60, samplingTime));
    }
    if (
      channelProperties[PlotPropertyName.lowFrequencyFilter] &&
      !isNaN(channelProperties[PlotPropertyName.lowFrequencyFilter])
    ) {
      filters.push(
        new HighPassFilter(
          channelProperties[PlotPropertyName.lowFrequencyFilter],
          samplingTime
        )
      );
    }
    if (
      channelProperties[PlotPropertyName.highFrequencyFilter] &&
      !isNaN(channelProperties[PlotPropertyName.highFrequencyFilter])
    ) {
      filters.push(
        new LowPassFilter(
          channelProperties[PlotPropertyName.highFrequencyFilter],
          samplingTime
        )
      );
    }
    if (filters.length > 0) {
      data.forEach((dataChunk) => {
        if (dataChunk.isEvenlySpaced && !dataChunk.hasStringValues) {
          filters.forEach((filter) => {
            filter.reset();
          });
          const filteredValues = [];
          dataChunk.values.forEach((value) => {
            let filteredValue = value;
            filters.forEach((filter) => {
              filteredValue = filter.filter(filteredValue);
            });
            filteredValues.push(filteredValue);
          });
          dataChunk.values = filteredValues;
        }
      });
    }
    return data;
  }

  _getDataWith(data, specifiedStartTime, option = 1) {
    const dataWithSpecifiedStartTime = [];
    data.forEach((dataChunk) => {
      if (dataChunk.times[0] >= specifiedStartTime) {
        dataWithSpecifiedStartTime.push(dataChunk);
      } else {
        const startIndex = binarySearch(
          dataChunk.times,
          specifiedStartTime,
          option
        );
        if (startIndex >= 0) {
          const shrinkedDataChunk = {
            times: dataChunk.times.slice(startIndex),
            values: dataChunk.values.slice(startIndex),
            plotRange: dataChunk.plotRange,
            isEvenlySpaced: dataChunk.isEvenlySpaced,
            hasStringValues: dataChunk.hasStringValues,
          };
          dataWithSpecifiedStartTime.push(shrinkedDataChunk);
        }
      }
    });
    return dataWithSpecifiedStartTime;
  }

  _getPlotData(dataChunk, deltaTimePerPixel) {
    const times = dataChunk.times;
    const values = dataChunk.values;
    let plotTimes = [];
    let plotValues = [];
    if (times.length <= 2) {
      plotTimes = times;
      plotValues = values;
    } else {
      // always include the first event
      plotTimes.push(times[0]);
      plotValues.push(values[0]);
      // Only add min and max values
      for (let i = 1; i < times.length - 1; i++) {
        const time = times[i];
        let minValueIndex = i;
        let maxValueIndex = i;
        let minValue = values[i];
        let maxValue = values[i];
        while (times[i + 1] < time + deltaTimePerPixel) {
          if (values[i + 1] > maxValue) {
            maxValue = values[i + 1];
            maxValueIndex = i + 1;
          } else if (values[i + 1] < minValue) {
            minValue = values[i + 1];
            minValueIndex = i + 1;
          }
          i++;
        }
        if (minValueIndex === maxValueIndex) {
          plotTimes.push(time);
          plotValues.push(minValue);
        } else if (minValueIndex < maxValueIndex) {
          plotTimes.push(times[minValueIndex]);
          plotValues.push(minValue);
          plotTimes.push(times[maxValueIndex]);
          plotValues.push(maxValue);
        } else {
          plotTimes.push(times[maxValueIndex]);
          plotValues.push(maxValue);
          plotTimes.push(times[minValueIndex]);
          plotValues.push(minValue);
        }
      }
      // always include the last event
      plotTimes.push(times[times.length - 1]);
      plotValues.push(values[times.length - 1]);
    }
    return {
      times: plotTimes,
      values: plotValues,
    };
  }

  updateTimeRange(times) {
    if (this.timeRange) {
      this.timeRange.merge(times);
    } else {
      this.timeRange = new TimeRange(times);
    }
  }

  _getStandardChannelName(channelName) {
    let lowerCaseName = channelName.toLowerCase().trim();
    if (lowerCaseName.startsWith("eeg")) {
      lowerCaseName = lowerCaseName.substring(3, lowerCaseName.length).trim();
    }
    const underscoreIndex = lowerCaseName.indexOf("_");
    let underscoreValue = "";
    if (underscoreIndex > 0) {
      underscoreValue = lowerCaseName.substring(
        underscoreIndex,
        lowerCaseName.length
      );
      lowerCaseName = lowerCaseName.substring(0, underscoreIndex);
    }
    let standardName = standardChannelNames[lowerCaseName];
    if (standardName) {
      if (underscoreIndex > 0) {
        return standardName + underscoreValue;
      } else {
        return standardName;
      }
    } else {
      return channelName;
    }
  }
}
