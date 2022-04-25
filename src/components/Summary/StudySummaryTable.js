import React, { useContext, useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
} from "@material-ui/data-grid";
import {
  Container,
  Snackbar,
  IconButton,
  CircularProgress,
  Button,
  Modal,
  Checkbox,
  Divider,
  Typography,
} from "@material-ui/core";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import CloseIcon from "@material-ui/icons/Close";
import { ExpandLess, ExpandMore } from "@material-ui/icons";
import ChannelDataList from "../../models/ChannelDataList";
import { UserContext } from "../UserContext";
import { MessagedProgress } from "../MessagedProgress";
import ServerClient from "../../models/ServerClient";
import TimeRange from "../../models/TimeRange";
import { debounce } from "../../models/Utilities";
import StorageUtility from "../../models/StorageUtility";
import { CreateStudy } from "./CreateStudy";
import { AssignPermissions } from "./AssignPermissions";

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
    field: "isExpanded",
    headerName: " ",
    width: 25,
    type: "boolean",
    hide: false,
    filterable: false,
    sortable: false,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "name",
    headerName: "Name",
    flex: 0.1,
    type: "string",
    align: "center",
    headerAlign: "center",
  },
  {
    field: "studyName",
    headerName: "Study",
    flex: 0.1,
    type: "string",
    renderCell: (params) => (params.row.isStudy ? (params.value ? params.value : "NOT SPECIFIED") : ""),
    align: "center",
    headerAlign: "center",
    editable: true,
  },
  {
    field: "startTime",
    headerName: "Start Time",
    flex: 0.2,
    type: "number",
    valueFormatter: (params) => new Date(params.value * 1000).toLocaleString(),
    align: "center",
    headerAlign: "center",
    filterable: false,
  },
  {
    field: "endTime",
    headerName: "End Time",
    flex: 0.2,
    type: "number",
    renderCell: (params) => new Date(params.value * 1000).toLocaleString(),
    hide: true,
    align: "center",
    headerAlign: "center",
    filterable: false,
  },
  {
    field: "duration",
    headerName: "Duration (d hh:mm:ss)",
    flex: 0.2,
    type: "string",
    align: "center",
    headerAlign: "center",
    filterable: false,
  },
  {
    field: "isLiveData",
    headerName: "Live Data",
    flex: 0.1,
    type: "boolean",
    hide: true,
    align: "center",
    headerAlign: "center",
    filterable: false,
  },
  {
    field: "isSelected",
    headerName: "Select",
    flex: 0.05,
    type: "boolean",
    sortable: false,
    hide: false,
    align: "center",
    headerAlign: "center",
    filterable: true,
  },
  {
    field: "isHidden",
    headerName: "Is Hidden",
    flex: 0.05,
    type: "boolean",
    sortable: false,
    hide: true,
    align: "center",
    headerAlign: "center",
    filterable: true,
    editable: false,
  },
];

export function StudySummaryTable() {
  const { sessionInfo, setSessionInfo } = useContext(UserContext);
  const [resizeCount, setResizeCount] = useState(0);
  const [studyInfo, setStudyInfo] = useState({
    summaries: [],
    isLoading: true,
    isReadingFiles: false,
    errorMessage: "",
    snackBarMessage: "",
    selectedIDs: [],
    openPermissionDialog: false,
    openStudyDialog: false,
    refresh: false,
  });
  const divStyle = {
    margin: 20,
    height: window.innerHeight - 80,
    width: "100%",
  };
  const history = useHistory();
  const studyInfoRef = useRef({});
  studyInfoRef.current = studyInfo;

  function getSelectedRows() {
    const selectDataDetails = {
      name: "",
      studyName: "",
      studyDescription: "",
      studyInfo: "",
      studyCount: 0,
      dataIDs: [],
      deviceIDs: [],
      startTime: 0,
      endTime: 0,
      isLiveData: false,
      dataList: null,
    };
    studyInfoRef.current.selectedIDs.forEach((id) => {
      const row = studyInfoRef.current.summaries[id];
      // TODO: What if there are multiple users?
      for (var i = id - 1; i >= 0; i--) {
        if (studyInfoRef.current.summaries[i].isStudy) {
          selectDataDetails.name = studyInfoRef.current.summaries[i].name;
          if (studyInfoRef.current.summaries[i].studyName) {
            selectDataDetails.studyName =
              studyInfoRef.current.summaries[i].studyName;
              selectDataDetails.studyDescription =
              studyInfoRef.current.summaries[i].studyDescription;
              selectDataDetails.studyInfo =
              studyInfoRef.current.summaries[i].studyInfo;
            selectDataDetails.studyCount++;
          }
          break;
        }
      }
      selectDataDetails.dataIDs = selectDataDetails.dataIDs.concat(row.dataIDs);
      selectDataDetails.deviceIDs = selectDataDetails.deviceIDs.concat(
        row.deviceIDs
      );
      if (
        selectDataDetails.startTime === 0 ||
        selectDataDetails.startTime > row.startTime
      ) {
        selectDataDetails.startTime = row.startTime;
      }
      if (selectDataDetails.endTime < row.endTime) {
        selectDataDetails.endTime = row.endTime;
      }
      if (row.isLiveData) {
        selectDataDetails.isLiveData = true;
      }
    });
    return selectDataDetails;
  }

  function CustomGridToolbar() {
    return (
      <GridToolbarContainer>
        <GridToolbarExport />
        <label htmlFor="btn-upload">
          <input
            id="btn-upload"
            name="btn-upload"
            style={{ display: "none" }}
            type="file"
            onChange={selectFiles}
            onClick={(event) => {
              event.target.value = "";
            }}
            multiple
          />
          <Button
            component="span"
            color="primary"
            startIcon={<FolderOpenIcon />}
          >
            Open EDF File
          </Button>
        </label>
        {studyInfo.isReadingFiles && <CircularProgress size={20} />}
        <Divider orientation="vertical" variant="middle" flexItem />
        <Typography variant="button">
          Selected Items ({studyInfo.selectedIDs.length}):
        </Typography>
        <Button
          color="primary"
          disabled={studyInfo.selectedIDs.length === 0}
          onClick={handleShowStudyDetail}
        >
          View Waveform
        </Button>
        <Button
          color="primary"
          disabled={studyInfo.selectedIDs.length === 0}
          onClick={handlePermissions}
        >
          View/Assign Permissions
        </Button>
        <Button
          color="primary"
          disabled={studyInfo.selectedIDs.length === 0}
          href={
            window.$restAPIURL + "download?dataIDs=" + getSelectedRows().dataIDs
          }
        >
          Download EDFs
        </Button>
      </GridToolbarContainer>
    );
  }

  if (studyInfo.summaries.length === 0) {
    columns[1].renderCell = (params) =>
      params.row.isStudy ? (
        params.value ? (
          <IconButton onClick={handleExpandOrCollapse(params)}>
            <ExpandLess />
          </IconButton>
        ) : (
          <IconButton onClick={handleExpandOrCollapse(params)}>
            <ExpandMore />
          </IconButton>
        )
      ) : (
        ""
      );

    columns[8].renderCell = (params) => (
      <Checkbox
        checked={params.value}
        color="primary"
        onChange={() => handleCheckboxChange(params)}
      />
    );

    const handleCheckboxChange = (params) => {
      params.row.isSelected = !params.row.isSelected;
      let indices = [];
      if (params.row.isStudy) {
        for (var i = 1; i <= params.row.childrenCount; i++) {
          const currentSelection =
            studyInfoRef.current.summaries[params.id + i].isSelected;
          if (currentSelection !== params.row.isSelected) {
            studyInfoRef.current.summaries[params.id + i].isSelected =
              params.row.isSelected;
            indices.push(studyInfoRef.current.summaries[params.id + i].id);
          }
        }
      } else {
        indices.push(params.row.id);
      }
      let newSelectedIDs = studyInfoRef.current.selectedIDs;
      if (params.row.isSelected) {
        newSelectedIDs = newSelectedIDs.concat(indices);
      } else {
        indices.forEach((dataID) => {
          const index = newSelectedIDs.indexOf(dataID);
          if (index >= 0) {
            newSelectedIDs.splice(index, 1);
          }
        });
      }
      setStudyInfo({
        ...studyInfoRef.current,
        selectedIDs: newSelectedIDs,
        refresh: true,
      });
    };
  }

  function ExpandOrCollapseStudy(params) {
    const row = params.row;
    if (row.isStudy) {
      row.isExpanded = !row.isExpanded;
      for (var i = 1; i <= row.childrenCount; i++) {
        studyInfoRef.current.summaries[row.id + i].isHidden = !row.isExpanded;
      }
      setStudyInfo({
        ...studyInfoRef.current,
        refresh: true,
      });
      return;
    }
  }

  const handleExpandOrCollapse = (params) => (event) => {
    ExpandOrCollapseStudy(params);
  };

  const handlePermissions = (event) => {
    setStudyInfo({
      ...studyInfoRef.current,
      openPermissionDialog: true,
    });
  };

  const handleCreateStudyClose = (event) => {
    setStudyInfo({
      ...studyInfoRef.current,
      openStudyDialog: false,
    });
  };

  const handleAssignPermissionClose = (event) => {
    setStudyInfo({
      ...studyInfo,
      openPermissionDialog: false,
    });
  };

  const handleSnackbarClose = (event) => {
    setStudyInfo({
      ...studyInfo,
      snackBarMessage: "",
    });
  };

  const selectFiles = (event) => {
    console.log(event.target.files);
    if (
      event.target.files.length > 0 &&
      event.target.files[0].name.toLowerCase().endsWith(".edf")
    ) {
      setStudyInfo({
        ...studyInfo,
        isReadingFiles: true,
      });
      const file = event.target.files[0];
      const reader = new FileReader();
      const recordsToRead = 100;
      let sampleCounts = [];
      let channelValues = [];
      let bufferSize = 256;
      let segmentID = 0;
      let currentPosition = 0;
      let numberOfSignals = 0;
      let startTime, endTime;
      let numberOfRecords = 0;
      let actualNumberOfRecords = 0;
      let patientName = "";
      console.log("Start: " + Date.now());
      reader.onload = function (e) {
        switch (segmentID) {
          case 0:
            const headerBytes = new Uint8Array(e.target.result);
            const header = String.fromCharCode.apply(null, headerBytes);
            const patientInfoArray = header.substring(8, 88).trim().split(" ");
            if (patientInfoArray.length > 3) {
              patientName = patientInfoArray[3];
            }
            startTime = getUTCSeconds(
              header.substring(168, 176),
              header.substring(176, 184)
            );
            numberOfRecords = parseInt(header.substring(236, 244).trim());
            const recordDurationSec = parseInt(
              header.substring(244, 252).trim()
            );
            endTime = startTime + numberOfRecords * recordDurationSec;
            console.log(startTime + " - " + endTime);
            numberOfSignals = parseInt(header.substring(252, 256).trim());
            bufferSize = numberOfSignals * 256;
            segmentID = 1;
            break;
          case 1:
            const signalBytes = new Uint8Array(e.target.result);
            const signalHeaders = String.fromCharCode.apply(null, signalBytes);
            console.log(signalHeaders);
            let totalNumberOfSamplesPerRecord = 0;
            for (var i = 0; i < numberOfSignals; i++) {
              // Channel Name
              let startPosition = 16 * i;
              const channelName = signalHeaders
                .substring(startPosition, startPosition + 16)
                .trim();
              // Channel Physical/Digital Maximum and Minimum
              startPosition = numberOfSignals * 104 + 8 * i;
              const physicalMinimum = parseFloat(
                signalHeaders.substring(startPosition, startPosition + 8).trim()
              );
              const physicalMaximum = parseFloat(
                signalHeaders
                  .substring(
                    startPosition + 8 * numberOfSignals,
                    startPosition + 8 * numberOfSignals + 8
                  )
                  .trim()
              );
              const digitalMinimum = parseFloat(
                signalHeaders
                  .substring(
                    startPosition + 16 * numberOfSignals,
                    startPosition + 16 * numberOfSignals + 8
                  )
                  .trim()
              );
              const digitalMaximum = parseFloat(
                signalHeaders
                  .substring(
                    startPosition + 24 * numberOfSignals,
                    startPosition + 24 * numberOfSignals + 8
                  )
                  .trim()
              );
              const scalingFactor =
                (physicalMaximum - physicalMinimum) /
                (digitalMaximum - digitalMinimum);
              const zero = digitalMinimum - physicalMinimum / scalingFactor;
              // Channel Sample Count
              startPosition = numberOfSignals * 216 + 8 * i;
              const sampleCount = parseInt(
                signalHeaders.substring(startPosition, startPosition + 8).trim()
              );
              channelValues[i] = {
                channelName: channelName,
                zero: zero,
                scalingFactor: scalingFactor,
                sampleCount: sampleCount,
                values: [],
              };
              sampleCounts.push(sampleCount);
              totalNumberOfSamplesPerRecord += sampleCount;
            }
            bufferSize = totalNumberOfSamplesPerRecord * 2 * recordsToRead;
            segmentID = 2;
            break;
          case 2:
            const values = new Int16Array(e.target.result);
            let startSampleCount = 0;
            while (values.length > startSampleCount) {
              for (var k = 0; k < numberOfSignals; k++) {
                for (var l = 0; l < channelValues[k].sampleCount; l++) {
                  channelValues[k].values.push(values[startSampleCount + l]);
                }
                startSampleCount += channelValues[k].sampleCount;
              }
              actualNumberOfRecords++;
            }
            break;
          default:
            break;
        }
        currentPosition += e.target.result.byteLength;
        if (bufferSize > 0) {
          if (currentPosition < file.size) {
            reader.readAsArrayBuffer(
              file.slice(currentPosition, currentPosition + bufferSize)
            );
          } else {
            if (actualNumberOfRecords !== numberOfRecords) {
              console.log("Record count mistmatching...");
              // TODO: Warning?
            }
            console.log("Done: " + Date.now());
            setStudyInfo({
              ...studyInfo,
              isReadingFiles: false,
            });
            const dataList = getDataList(startTime, endTime, channelValues);
            history.push(window.$websiteAlias + "studyDetail", {
              startTime: startTime,
              endTime: endTime,
              isLiveData: false,
              dataList: dataList,
            });
            setSessionInfo({
              ...sessionInfo,
              pageTitle:
                "Time series data for " + patientName + " (" + file.name + ")",
              dataIDs: [],
            });
          }
        } else {
          setStudyInfo({
            ...studyInfo,
            snackBarMessage: "Unable to read the file.",
            isReadingFiles: false,
          });
        }
      };
      reader.readAsArrayBuffer(file.slice(0, bufferSize));
    } else {
      setStudyInfo({
        ...studyInfo,
        snackBarMessage: "Invalid file: Only EDF format is supported.",
      });
    }
  };

  const handleDoubleClick = (params) => {
    const row = params.row;
    if (row.isStudy) {
      ExpandOrCollapseStudy(params);
      return;
    }
    let name = " ";
    for (var i = 1; i <= row.id; i++) {
      if (studyInfoRef.current.summaries[row.id - i].isStudy) {
        name = studyInfoRef.current.summaries[row.id - i].name;
        break;
      }
    }
    showStudyDetailPage({
      name: name,
      dataIDs: row.dataIDs,
      deviceIDs: row.deviceIDs,
      startTime: row.startTime,
      endTime: row.endTime,
      isLiveData: row.isLiveData,
      dataList: null,
    });
  };

  const handleShowStudyDetail = (event) => {
    showStudyDetailPage(getSelectedRows());
  };

  function showStudyDetailPage(studyDetails) {
    history.push(window.$websiteAlias + "studyDetail", studyDetails);
    setSessionInfo({
      ...sessionInfo,
      pageTitle: "Waveform data for " + studyDetails.name,
      dataIDs: studyDetails.dataIDs,
    });
  }

  const debounceResizeHandler = debounce(() => {
    setResizeCount(Math.random() * 10000);
  }, 250);

  useEffect(() => {
    console.log("fetching summary");
    fetchStudySummaries();
    setSessionInfo({
      ...sessionInfo,
      pageTitle: "Study Summary",
      dataIDs: [0],
    });
    window.addEventListener("resize", debounceResizeHandler);
    return () => {
      window.removeEventListener("resize", debounceResizeHandler);
    };
  }, []);

  if (studyInfo.isLoading) {
    return <MessagedProgress message="Loading studies..." />;
  } else if (studyInfo.errorMessage !== "") {
    return (
      <MessagedProgress message={studyInfo.errorMessage} hideProgress={true} />
    );
  } else if (studyInfo.summaries.length === 0) {
    return <MessagedProgress message="No studies" hideProgress={true} />;
  } else {
    return (
      <Container>
        <Snackbar
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          open={studyInfo.snackBarMessage}
          autoHideDuration={10000}
          onClose={handleSnackbarClose}
          message={studyInfo.snackBarMessage}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />
        <div style={divStyle}>
          <DataGrid
            components={{
              Toolbar: CustomGridToolbar,
            }}
            disableColumnMenu
            autoPageSize
            filterModel={{
              items: [
                {
                  columnField: "isHidden",
                  operatorValue: "is",
                  value: "false",
                },
              ],
            }}
            onRowDoubleClick={handleDoubleClick}
            hideFooterSelectedRowCount={true}
            rows={studyInfo.summaries}
            columns={columns}
            isCellEditable={(params) =>
              params.row.isStudy && !params.row.studyName
            }
          />
        </div>
        <Modal
          open={studyInfo.openPermissionDialog}
          onClose={handleAssignPermissionClose}
        >
          <AssignPermissions
            handleCancel={handleAssignPermissionClose}
            dataIDs={getSelectedRows().dataIDs}
          />
        </Modal>
        <CreateStudy
          openStudyDialog={studyInfo.openStudyDialog}
          handleCreateStudyClose={handleCreateStudyClose}
          selectedStudies={getSelectedRows()}
        />
      </Container>
    );
  }

  async function fetchStudySummaries() {
    if (!studyInfo.isLoading) {
      return;
    }
    console.log("calling server");
    const response = await ServerClient.getStudySummary();
    if (response.status === 200) {
      let rows = [];
      response.data.forEach((studySummary) => {
        const newRow = {
          id: rows.length,
          studyName: studySummary.name,
          studyDescription: studySummary.description,
          studyInfo: studySummary.otherInfo,
          userID: studySummary.user.userID,
          dataIDs: [],
          deviceIDs: [],
          name: studySummary.user.name,
          startTime: studySummary.startTime,
          endTime: studySummary.endTime,
          device: "",
          isLiveData: false,
          permissions: studySummary.studyID,
          isStudy: true,
          childrenCount: studySummary.dataList.length,
          isExpanded: false,
          isSelected: false,
          isHidden: false,
        };
        rows.push(newRow);
        if (studySummary.dataList.length > 0) {
          const childrenRows = getRows(studySummary.dataList, rows.length);
          newRow.childrenCount = childrenRows.length;
          let isLiveData = false;
          childrenRows.forEach((childRow) =>{
            if (childRow.isLiveData){
              isLiveData = true;
            }
          });
          newRow.isLiveData = isLiveData;
          rows = rows.concat(childrenRows);
        }
        setDuration(newRow);
      });
      setStudyInfo({
        summaries: rows,
        loading: false,
        isReadingFiles: false,
        errorMessage: "",
        snackBarMessage: "",
        selectedIDs: [],
        refresh: false,
      });
    } else if (response.status === 401) {
      history.push(window.$websiteAlias + "signin");
      setSessionInfo({
        userName: "",
        isLoggedIn: false,
        pageTitle: "",
        dataIDs: [0],
      });
    } else {
      setStudyInfo({
        summaries: [],
        loading: false,
        isReadingFiles: false,
        snackBarMessage: "",
        errorMessage:
          "Unable to retrieve studies: (" +
          response.status +
          "): " +
          response.errorMessage,
        selectedIDs: [],
        refresh: false,
      });
    }
  }

  function getRows(dataList, startID) {
    let rows = [];
    dataList.forEach((data) => {
      const newRow = {
        id: startID + rows.length,
        dataIDs: [data.dataID],
        deviceIDs: [data.device.deviceID],
        startTime: data.startTime,
        endTime: data.endTime,
        isLiveData: data.isLive,
        isStudy: false,
        isSelected: false,
        isHidden: true,
      };
      let push = true;
      for (var i = 0; i < rows.length; i++) {
        if (newRow.userID === rows[i].userID) {
          let newRowEndTime = newRow.endTime;
          if (newRow.isLiveData) {
            newRowEndTime = Infinity;
          } else if (newRow.endTime === 0) {
            newRowEndTime = newRow.startTime;
          }
          let rowEndTime = rows[i].endTime;
          if (rows[i].isLiveData) {
            rowEndTime = Infinity;
          } else if (rows[i].endTime === 0) {
            rowEndTime = rows[i].startTime;
          }
          if (
            newRow.startTime === rows[i].startTime ||
            (newRow.startTime < rowEndTime && newRowEndTime > rows[i].startTime)
          ) {
            push = false;
            rows[i].dataIDs.push(data.dataID);
            rows[i].deviceIDs.push(data.device.deviceID);
            if (rows[i].endTime !== 0 && rows[i].endTime < newRow.endTime) {
              rows[i].endTime = newRow.endTime;
            }
            if (rows[i].startTime > newRow.startTime) {
              rows[i].startTime = newRow.startTime;
            }
            break;
          }
        }
      }
      if (push) {
        rows.push(newRow);
      }
    });
    rows.forEach((row) => {
      setDuration(row);
    });
    return rows;
  }

  function setDuration(newRow) {
    if (newRow.isLiveData) {
      newRow.duration = "In Progress";
    } else if (newRow.endTime === 0) {
      newRow.duration = "Unknown";
    } else {
      newRow.duration = TimeRange.getDurationHHMMSS(
        newRow.endTime - newRow.startTime
      );
    }
  }

  function getUTCSeconds(date, time) {
    const day = parseInt(date.substring(0, 2));
    const month = parseInt(date.substring(3, 5));
    let year = parseInt(date.substring(6, 8));
    const hour = parseInt(time.substring(0, 2));
    const minute = parseInt(time.substring(3, 5));
    const second = parseInt(time.substring(6, 8));
    if (year > 69) {
      year = 1900 + year;
    } else {
      year = 2000 + year;
    }
    return (
      new Date(year, month - 1, day, hour, minute, second).getTime() / 1000
    );
  }

  function getDataList(startTime, endTime, channelValues) {
    const dataList = [];
    let channelNames = [];
    channelValues.forEach((channelValue) => {
      let channelName = channelValue.channelName;
      for (var i = 1; i < 20; i++) {
        if (i !== 1) {
          channelName = channelValue.channelName + "_" + i;
        }
        if (!channelNames.includes(channelName.toLowerCase())) {
          channelNames.push(channelName.toLowerCase());
          break;
        }
      }
      dataList.push({
        channelName: channelName,
        dataID: 0,
        times: [startTime, endTime],
        values: {
          zero: channelValue.zero,
          scalingFactor: channelValue.scalingFactor,
          dataType: 7,
          data: channelValue.values,
        },
      });
    });
    return new ChannelDataList(dataList);
  }
}
