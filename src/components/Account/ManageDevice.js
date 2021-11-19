import React, { useEffect, useHistory, useState } from "react";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Container from "@material-ui/core/Container";
import IconButton from "@material-ui/core/IconButton";
import AddIcon from "@material-ui/icons/Add";
import ClearIcon from "@material-ui/icons/Clear";
import RemoveIcon from "@material-ui/icons/Remove";
import Tooltip from "@material-ui/core/Tooltip";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Collapse from "@material-ui/core/Collapse";
import Alert from "@material-ui/lab/Alert";
import ServerClient from "../../models/ServerClient";
import { MessagedProgress } from "../MessagedProgress";
import { ButtonGroup } from "@material-ui/core";
import { Edit } from "@material-ui/icons";

function createDevice(
  deviceID,
  name,
  hardwareID,
  version,
  assignedUser,
  assignedTime
) {
  return {
    deviceID,
    name,
    hardwareID,
    version,
    assignedUser,
    isChecked: false,
    assignedTime,
  };
}

export default function ManageDevice() {
  const [devices, setDevices] = useState({
    data: null,
    errorMessage: "",
    totalChecked: 0,
  });
  const [assignmentData, setAssignmentData] = useState({
    email: "",
    phoneNumber: "",
    name: "",
    createUser: false,
    studyName: "",
    studyDescription: "",
    studyInfo: "",
    effectiveTime: 0,
    disableAssignButton: true,
    errorMessage: "",
    openDialog: false,
  });

  const [newDeviceData, setNewDeviceData] = useState({
    edit: false,
    hardwareID: "",
    name: "",
    version: "",
    disableAddNewDeviceButton: true,
    errorMessage: "",
    openDialog: false,
  });

  const handleAssignDevices = async () => {
    const deviceIDs = [];
    devices.data.forEach((device) => {
      if (device.isChecked) {
        deviceIDs.push(device.deviceID);
      }
    });
    const data = {
      deviceIDs: deviceIDs,
      user: {
        name: assignmentData.name,
        email: assignmentData.email,
        phone: assignmentData.phoneNumber,
      },
      study: {
        name: assignmentData.studyName,
        description: assignmentData.studyDescription,
        otherInfo: assignmentData.studyInfo,
        effectiveDate: Date.now() / 1000 + 3600 * assignmentData.effectiveTime,
      },
    };
    const response = await ServerClient.assignDevices(data);
    if (response.status === 200) {
      handleDeviceAssignmentClose();
      getDevices();
    } else {
      setAssignmentData({
        ...assignmentData,
        errorMessage: response.errorMessage,
      });
    }
  };

  const handleDeviceAssignmentTextFieldOnChange = (event) => {
    let email = assignmentData.email;
    let phoneNumber = assignmentData.phoneNumber;
    let name = assignmentData.name;
    let studyName = assignmentData.studyName;
    let studyDescription = assignmentData.studyDescription;
    let studyInfo = assignmentData.studyInfo;
    if (event.target.id === "email") {
      email = event.target.value;
    } else if (event.target.id === "phoneNumber") {
      phoneNumber = event.target.value;
    } else if (event.target.id === "name") {
      name = event.target.value;
    } else if (event.target.id === "studyName") {
      studyName = event.target.value;
    } else if (event.target.id === "studyDescription") {
      studyDescription = event.target.value;
    } else if (event.target.id === "studyInfo") {
      studyInfo = event.target.value;
    }
    const disableAssignButton = toDisableAssignButton(
      email,
      phoneNumber,
      name,
      studyName,
      assignmentData.createUser
    );
    setAssignmentData({
      ...assignmentData,
      email: email,
      phoneNumber: phoneNumber,
      name: name,
      studyName: studyName,
      studyDescription: studyDescription,
      studyInfo: studyInfo,
      disableAssignButton: disableAssignButton,
    });
  };

  const handleCheckboxChange = (event) => {
    const disableAssignButton = toDisableAssignButton(
      assignmentData.email,
      assignmentData.phoneNumber,
      assignmentData.name,
      assignmentData.studyName,
      event.target.checked
    );
    setAssignmentData({
      ...assignmentData,
      createUser: event.target.checked,
      disableAssignButton: disableAssignButton,
    });
  };

  const handleAssignmentCheck = (index) => (event) => {
    devices.data[index].isChecked = event.target.checked;
    const totalChecked = devices.totalChecked + (event.target.checked ? 1 : -1);
    console.log(totalChecked);
    setDevices({
      ...devices,
      totalChecked: totalChecked,
    });
  };

  const handleClearAssignment = async (index) => {
    const response = await ServerClient.clearDeviceAssignment(
      devices.data[index].hardwareID
    );
    if (response.status === 200) {
      devices.data[index].assignedUser = "NOT ASSIGNED";
      devices.data[index].assignedTime = undefined;
      setDevices({
        ...devices,
        totalChecked: devices.totalChecked,
        errorMessage: "",
      });
    } else {
      setDevices({
        ...devices,
        errorMessage: response.errorMessage,
      });
    }
  };

  const handleOpenAssignmentDialog = (event) => {
    setAssignmentData({
      ...assignmentData,
      openDialog: true,
    });
  };

  const handleDeviceAssignmentClose = () => {
    setAssignmentData({
      email: "",
      phoneNumber: "",
      name: "",
      studyName: "",
      studyDescription: "",
      studyInfo: "",
      effectiveTime: 0,
      createUser: false,
      disableAssignButton: true,
      errorMessage: "",
      openDialog: false,
    });
  };

  const handleAddNewDevice = async () => {
    const response = await ServerClient.addDevice(newDeviceData);
    if (response.status === 200) {
      handleAddNewDeviceDialogClose();
      getDevices();
    } else {
      setNewDeviceData({
        ...newDeviceData,
        errorMessage: response.errorMessage,
      });
    }
  };

  const handleNewDeviceTextFieldOnChange = (event) => {
    let hardwareID = newDeviceData.hardwareID;
    let version = newDeviceData.version;
    let name = newDeviceData.name;
    if (event.target.id === "hardwareID") {
      hardwareID = event.target.value;
    } else if (event.target.id === "version") {
      version = event.target.value;
    } else if (event.target.id === "hardwareName") {
      name = event.target.value;
    }
    setNewDeviceData({
      ...newDeviceData,
      hardwareID: hardwareID,
      version: version,
      name: name,
      disableAddNewDeviceButton: !(hardwareID && version && name),
    });
  };

  const handleEditDevice = (index) => {
    setNewDeviceData({
      ...newDeviceData,
      edit: true,
      openDialog: true,
      hardwareID: devices.data[index].hardwareID,
    });      
  }

  const handleAddNewDeviceDialog = (event) => {
    setNewDeviceData({
      ...newDeviceData,
      openDialog: true,
    });
  };

  const handleAddNewDeviceDialogClose = () => {
    setNewDeviceData({
      edit: false,
      hardwareID: "",
      name: "",
      version: "",
      disableAddNewDeviceButton: true,
      errorMessage: "",
      openDialog: false,
    });
  };

  const handleEffectiveTimeChange = (changeInHours) => (event) => {
    const newEffectiveTime = assignmentData.effectiveTime + changeInHours;
    setAssignmentData({
      ...assignmentData,
      effectiveTime: newEffectiveTime,
    });
  };

  function toDisableAssignButton(
    email,
    phoneNumber,
    name,
    studyName,
    createUser
  ) {
    if (createUser) {
      return (
        email === "" || phoneNumber === "" || name === "" || studyName === ""
      );
    } else {
      return (email === "" && phoneNumber === "") || studyName === "";
    }
  }

  async function getDevices() {
    const response = await ServerClient.getDevices();
    if (response.status === 200 && response.data) {
      const deviceData = response.data.map((device) => {
        if (device.assignedUser) {
          return createDevice(
            device.deviceID,
            device.name,
            device.hardwareID,
            device.version,
            device.assignedUser.name + " (" + device.assignedStudy.name + ")",
            new Date(device.startTime * 1000).toLocaleString()
          );
        } else {
          return createDevice(
            device.deviceID,
            device.name,
            device.hardwareID,
            device.version,
            "NOT ASSIGNED"
          );
        }
      });
      setDevices({
        data: deviceData,
        errorMessage: "",
        totalChecked: 0,
      });
    } else {
      setDevices({
        errorMessage: response.errorMessage,
        data: null,
        totalChecked: 0,
      });
    }
  }

  useEffect(() => {
    getDevices();
  }, []);

  if (devices.data) {
    return (
      <Container fixed>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="center">Name</TableCell>
              <TableCell align="center">Hardware ID</TableCell>
              <TableCell align="center">Assigned To (Study)</TableCell>
              <TableCell align="center">Since</TableCell>
              <TableCell align="center">Reassign</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.data.map((device, index) => (
              <TableRow key={device.hardwareID}>
                <TableCell component="th" scope="row" align="center">
                  {device.name}                  
                    <Tooltip title="Edit device" placement="top-start">
                      <IconButton onClick={() => handleEditDevice(index)}>
                        <Edit color="primary" />
                      </IconButton>
                    </Tooltip>                  
                </TableCell>
                <TableCell align="center">{device.hardwareID}</TableCell>
                <TableCell align="center">
                  {device.assignedUser}
                  {device.assignedTime && (
                    <Tooltip title="Unassign device" placement="top-start">
                      <IconButton onClick={() => handleClearAssignment(index)}>
                        <ClearIcon color="secondary" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="center">{device.assignedTime}</TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={device.isChecked}
                    onChange={handleAssignmentCheck(index)}
                    color="primary"
                  ></Checkbox>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <IconButton
          color="primary"
          size="medium"
          onClick={handleAddNewDeviceDialog}
        >
          <AddIcon />
        </IconButton>
        <Button
          disabled={devices.totalChecked < 1}
          style={{ float: "right" }}
          color="primary"
          onClick={handleOpenAssignmentDialog}
        >
          Assign Selected Devices and Create Study
        </Button>
        <Dialog
          open={newDeviceData.openDialog}
          onClose={handleAddNewDeviceDialogClose}
        >
          <DialogTitle id="new-device-dialog-title">Add New Device</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {newDeviceData.edit
                ? "Please edit name and firmware."
                : "Please enter device hardware ID, name, and firmware version."}
            </DialogContentText>
            <TextField
              autoFocus
              autoComplete="off"
              margin="dense"
              id="hardwareID"
              label="Hardware ID"
              type="string"
              value={newDeviceData.hardwareID}
              disabled={newDeviceData.edit}
              onChange={handleNewDeviceTextFieldOnChange}
              fullWidth
            />
            <TextField
              autoComplete="off"
              margin="dense"
              id="hardwareName"
              label="Name"
              type="string"
              value={newDeviceData.name}
              onChange={handleNewDeviceTextFieldOnChange}
              fullWidth
            />
            <TextField
              autoComplete="off"
              margin="dense"
              id="version"
              label="Firmware Version"
              type="string"
              value={newDeviceData.version}
              onChange={handleNewDeviceTextFieldOnChange}
              fullWidth
            />
            <Collapse in={newDeviceData.errorMessage !== ""}>
              <Alert severity="error">{newDeviceData.errorMessage}</Alert>
            </Collapse>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddNewDeviceDialogClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleAddNewDevice}
              color="primary"
              disabled={newDeviceData.disableAddNewDeviceButton}
            >
              {newDeviceData.edit ? "Save" : "Add Device"}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={assignmentData.openDialog}
          onClose={handleDeviceAssignmentClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">
            Assign Selected Devices/Create Study
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please enter user's email or phone number and study information.
              If the user is not registered, email, phone number, and name are
              required.
            </DialogContentText>
            <TextField
              autoFocus
              autoComplete="off"
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              disabled={
                !assignmentData.createUser && assignmentData.phoneNumber !== ""
              }
              onChange={handleDeviceAssignmentTextFieldOnChange}
              fullWidth
            />
            <TextField
              autoComplete="off"
              margin="dense"
              id="phoneNumber"
              label="Phone Number"
              type="tel"
              disabled={
                !assignmentData.createUser && assignmentData.email !== ""
              }
              onChange={handleDeviceAssignmentTextFieldOnChange}
              fullWidth
            />
            <TextField
              autoComplete="off"
              margin="dense"
              id="name"
              label="Name"
              type="string"
              disabled={!assignmentData.createUser}
              onChange={handleDeviceAssignmentTextFieldOnChange}
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  value="remember"
                  color="primary"
                  onChange={handleCheckboxChange}
                />
              }
              label="Create user if not existing on the server."
            />
            <TextField
              style={{ marginTop: 20 }}
              autoComplete="off"
              margin="dense"
              id="studyName"
              label="Study Name"
              type="string"
              onChange={handleDeviceAssignmentTextFieldOnChange}
              fullWidth
            />
            <TextField
              autoComplete="off"
              margin="dense"
              id="studyDescription"
              label="Study Description"
              type="string"
              onChange={handleDeviceAssignmentTextFieldOnChange}
              fullWidth
            />
            <TextField
              autoComplete="off"
              margin="dense"
              id="studyInfo"
              label="Additional Study Info"
              type="string"
              onChange={handleDeviceAssignmentTextFieldOnChange}
              fullWidth
            />
            <TextField
              style={{ marginTop: 20 }}
              autoComplete="off"
              margin="dense"
              id="effectiveTime"
              label="Effective Time"
              type="string"
              disabled
              value={
                assignmentData.effectiveTime
                  ? new Date(
                      Date.now() + 3600000 * assignmentData.effectiveTime
                    ).toLocaleString()
                  : "Now"
              }
              onChange={handleDeviceAssignmentTextFieldOnChange}
            />
            <ButtonGroup style={{ marginTop: 30 }}>
              <Button
                startIcon={<RemoveIcon />}
                onClick={handleEffectiveTimeChange(-24)}
              >
                D
              </Button>
              <Button
                startIcon={<RemoveIcon />}
                onClick={handleEffectiveTimeChange(-1)}
              >
                H
              </Button>
              <Button
                startIcon={<AddIcon />}
                onClick={handleEffectiveTimeChange(1)}
              >
                H
              </Button>
              <Button
                startIcon={<AddIcon />}
                onClick={handleEffectiveTimeChange(24)}
              >
                D
              </Button>
            </ButtonGroup>
            <Collapse in={assignmentData.errorMessage !== ""}>
              <Alert severity="error">{assignmentData.errorMessage}</Alert>
            </Collapse>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeviceAssignmentClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleAssignDevices}
              color="primary"
              disabled={assignmentData.disableAssignButton}
            >
              Assign/Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  } else if (devices.errorMessage !== "") {
    return (
      <MessagedProgress message={devices.errorMessage} hideProgress={true} />
    );
  } else {
    return <MessagedProgress />;
  }
}
