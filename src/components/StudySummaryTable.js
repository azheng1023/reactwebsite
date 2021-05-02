import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { DataGrid } from "@material-ui/data-grid";
import Container from "@material-ui/core/Container";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { UserContext } from "./UserContext";
import { MessagedProgress } from "./MessagedProgress";
import ServerClient from "../models/ServerClient";
import TimeRange from "../models/TimeRange";

const useStyles = makeStyles({
  centerStyle: {
    "& .MuiDataGrid-colCellTitle": {
      display: "block",
      textAlign: "center",
      width: "100%",
    },
    "& .MuiDataGrid-cell": {
      display: "block",
      position: "relative",
      textAlign: "center",
    },
  },
});

const columns = [
  { field: "id", headerName: "ID", flex: 0.1, type: "number", hide: true },
  { field: "name", headerName: "Name", flex: 0.2, type: "string" },
  {
    field: "startTime",
    headerName: "Start Time",
    flex: 0.2,
    type: "number",
    valueFormatter: (params) => new Date(params.value * 1000).toLocaleString(),
  },
  {
    field: "endTime",
    headerName: "End Time",
    flex: 0.2,
    type: "number",
    renderCell: (params) => new Date(params.value * 1000).toLocaleString(),
    hide: true,
  },
  {
    field: "duration",
    headerName: "Duration (d hh:mm:ss)",
    flex: 0.2,
    type: "string",
  },
  {
    field: "isLiveData",
    headerName: "Live Data",
    flex: 0.1,
    type: "boolean",
    hide: true,
  },
];

export function StudySummaryTable() {
  const { sessionInfo, setSessionInfo } = useContext(UserContext);
  const rowHeight = 52;
  const [rowsPerPage, setRowsPerPage] = useState(getRowsPerPage());
  const [studyInfo, setStudyInfo] = useState({
    summaries: [],
    isLoading: true,
    errorMessage: "",
  });
  const divStyle = {
    margin: 20,
    height: window.innerHeight - 80,
    width: "100%",
  };
  const history = useHistory();

  const handleDoubleClick = (param) => {
    history.push(window.$websiteAlias + "studyDetail", {
      studyID: param.id,
      startTime: param.row.startTime,
      endTime: param.row.endTime,
      isLiveData: param.row.isLiveData,
    });
    setSessionInfo({
      ...sessionInfo,
      pageTitle: "Time series data for " + param.row.name,
      studyID: param.id,
    });
  };

  function getRowsPerPage() {
    return Math.floor((window.innerHeight - 90) / rowHeight - 2);
  }

  async function fetchStudySummaries() {
    if (!studyInfo.isLoading) {
      return;
    }
    console.log("calling server");
    const response = await ServerClient.getStudySummary();
    if (response.status === 200) {
      setStudyInfo({
        summaries: response.data,
        loading: false,
        errorMessage: "",
      });
      window.addEventListener("resize", handleResize);
    } else if (response.status === 401){
      history.push(window.$websiteAlias + "signin");
      setSessionInfo({
        userName: "",
        isLoggedIn: false,
        pageTitle: "",
        studyID: 0,
      });
    } else {
      setStudyInfo({
        summaries: [],
        loading: false,
        errorMessage:
          "Unable to retrieve studies: (" +
          response.status +
          "): " +
          response.errorMessage,
      });
    }
  }

  function handleResize() {
    setRowsPerPage(getRowsPerPage());
  }

  function getDuration(summaryData) {
    if (summaryData.isLive) {
      return "In Progress";
    } else if (summaryData.endTime === 0) {
      return "Unknown";
    } else {
      return TimeRange.getDurationHHMMSS(summaryData.endTime - summaryData.startTime);
    }
  }

  useEffect(() => {
    console.log("fetching summary");
    fetchStudySummaries();
    setSessionInfo({
      ...sessionInfo,
      pageTitle: "Study Summary",
      studyID: 0,
    });
  }, []);

  const classes = useStyles();
  if (studyInfo.isLoading) {
    return <MessagedProgress message="Loading studies..." />;
  } else if (studyInfo.errorMessage !== "") {
    return <MessagedProgress message={studyInfo.errorMessage} hideProgress={true} />;
  } else {
    const rows = studyInfo.summaries.map((studySummary) => ({
      id: studySummary.data.dataID,
      name: studySummary.user.name,
      startTime: studySummary.data.startTime,
      endTime: studySummary.data.endTime,
      duration: getDuration(studySummary.data),
      isLiveData: studySummary.data.isLive,
    }));
    return (
      <Container>
        <div style={divStyle}>
          <DataGrid
            className={classes.centerStyle}
            // disableColumnMenu
            onRowDoubleClick={handleDoubleClick}
            hideFooterSelectedRowCount={true}
            pageSize={rowsPerPage}
            rowHeight={rowHeight}
            sortModel={[
              {
                field: "startTime",
                sort: "desc",
              },
            ]}
            rows={rows}
            columns={columns}
          />
        </div>
      </Container>
    );
  }
}
