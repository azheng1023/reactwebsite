import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Collapse,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import ServerClient from "../../models/ServerClient";

export function CreateStudy(props) {
  const [studyData, setStudyData] = useState({
    studyName: "",
    studyDescription: "",
    studyInfo: "",
    errorMessage: "",
  });

  const handleCreateStudyClose = (event) => {
    setStudyData({
      ...studyData,
      errorMessage: "",
    });
    props.handleCreateStudyClose(event);
  };

  const handleCreateStudy = async (event) => {
    const dataList = [];
    props.selectedStudies.dataIDs.forEach((dataID) => {
      dataList.push({
        dataID: dataID,
      });
    });
    const response = await ServerClient.createStudy({
      name: studyData.studyName,
      description: studyData.studyDescription,
      otherInfo: studyData.studyInfo,
      dataList: dataList,
    });
    if (response.status === 200) {
      setStudyData({
        ...studyData,
        errorMessage: "",
      });
      props.handleCreateStudyClose(event);
    } else {
      setStudyData({
        ...studyData,
        errorMessage: response.errorMessage,
      });
    }
  };

  const handleDeviceAssignmentTextFieldOnChange = (event) => {
    let studyName = studyData.studyName;
    let studyDescription = studyData.studyDescription;
    let studyInfo = studyData.studyInfo;
    if (event.target.id === "studyName") {
      studyName = event.target.value;
    } else if (event.target.id === "studyDescription") {
      studyDescription = event.target.value;
    } else if (event.target.id === "studyInfo") {
      studyInfo = event.target.value;
    }
    setStudyData({
      ...studyData,
      studyName: studyName,
      studyDescription: studyDescription,
      studyInfo: studyInfo,
    });
  };

  let errorMessage = studyData.errorMessage;
  if (props.selectedStudies.studyCount > 1){
    errorMessage = "Cannot combine configured studies."
  }
  return (
    <Dialog open={props.openStudyDialog} onClose={props.handleCreateStudyClose}>
      <DialogTitle id="form-dialog-title">Create Study</DialogTitle>
      <DialogContent>
        <TextField
          style={{ marginTop: 20 }}
          autoComplete="off"
          margin="dense"
          id="studyName"
          label="Study Name"
          type="string"
          disabled={props.selectedStudies.studyCount > 0}
          defaultValue={props.selectedStudies.studyName}
          onChange={handleDeviceAssignmentTextFieldOnChange}
          fullWidth
        />
        <TextField
          autoComplete="off"
          margin="dense"
          id="studyDescription"
          label="Study Description"
          type="string"
          disabled={props.selectedStudies.studyCount > 0}
          defaultValue={props.selectedStudies.studyDescription}
          onChange={handleDeviceAssignmentTextFieldOnChange}
          fullWidth
        />
        <TextField
          autoComplete="off"
          margin="dense"
          id="studyInfo"
          label="Additional Study Info"
          type="string"
          disabled={props.selectedStudies.studyCount > 0}
          defaultValue={props.selectedStudies.studyInfo}
          onChange={handleDeviceAssignmentTextFieldOnChange}
          fullWidth
        />
      </DialogContent>
      <Collapse in={errorMessage !== ""}>
        <Alert severity="error">{errorMessage}</Alert>
      </Collapse>
      <DialogActions>
        <Button onClick={handleCreateStudyClose} color="primary">
          Close
        </Button>
        <Button
          disabled={props.selectedStudies.studyCount > 1}
          onClick={handleCreateStudy}
          color="primary"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
