import React, { useEffect, useContext, useState } from "react";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Container from "@material-ui/core/Container";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";
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

function createDevice(name, hardwareID, firmwareVersion, assignedUser, assignedTime) {
  return { name, hardwareID, firmwareVersion, assignedUser, assignedTime };
}

export default function ManageDevice() {
  const [devices, setDevices] = useState({
    data: null,
    errorMessage: "",
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    hardwareID: "",
    email: "",
    phoneNumber: "",
    name: "",
    createUser: false,
    disableAssignButton: true,
    errorMessage: "",
  });

  const handleClose = () => {
    setAssignmentData({
      hardwareID: "",
      email: "",
      phoneNumber: "",
      name: "",
      createUser: false,
      disableAssignButton: true,
      errorMessage: "",
    });
    setOpenDialog(false);
  };

  const handleReassignment = async () => {
    const response = await ServerClient.assignDevice(assignmentData);
    if (response.status === 200) {
      handleClose();
      getDevices();
    } else {
      setAssignmentData({
        ...assignmentData,
        errorMessage: response.errorMessage,
      });
    }
  };

  const handleTextFieldOnChange = (event) => {
    let email = assignmentData.email;
    let phoneNumber = assignmentData.phoneNumber;
    let name = assignmentData.name;
    if (event.target.id === "email") {
      email = event.target.value;
    } else if (event.target.id === "phoneNumber") {
      phoneNumber = event.target.value;
    } else if (event.target.id === "name") {
      name = event.target.value;
    }
    const disableAssignButton = toDisableAssignButton(
      email,
      phoneNumber,
      name,
      assignmentData.createUser
    );
    setAssignmentData({
      ...assignmentData,
      email: email,
      phoneNumber: phoneNumber,
      name: name,
      disableAssignButton: disableAssignButton,
    });
  };

  const handleCheckboxChange = (event) => {
    const disableAssignButton = toDisableAssignButton(
      assignmentData.email,
      assignmentData.phoneNumber,
      assignmentData.name,
      event.target.checked
    );
    setAssignmentData({
      ...assignmentData,
      createUser: event.target.checked,
      disableAssignButton: disableAssignButton,
    });
  };

  function toDisableAssignButton(email, phoneNumber, name, createUser) {
    if (createUser) {
      return email === "" || phoneNumber === "" || name === "";
    } else {
      return email === "" && phoneNumber === "";
    }
  }

  function openAssignmentDialog(hardwareID) {
    setOpenDialog(true);
    setAssignmentData({
      ...assignmentData,
      hardwareID: hardwareID,
    });
  }

  async function getDevices() {
    const response = await ServerClient.getDevices();
    if (response.data) {
      const deviceData = response.data.map((device) =>
        createDevice(
          device.name,
          device.hardwareID,
          device.version,
          device.assignedUser.name,
          new Date(device.startTime * 1000).toLocaleString()
        )
      );
      setDevices({
        data: deviceData,
        errorMessage: "",
      });
    } else {
      setDevices({
        errorMessage: response.errorMessage,
        data: null,
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
              <TableCell align="center">Firmware Version</TableCell>
              <TableCell align="center">Assigned To</TableCell>
              <TableCell align="center">Since</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.data.map((device) => (
              <TableRow key={device.hardwareID}>
                <TableCell component="th" scope="row" align="center">
                  {device.name}
                </TableCell>
                <TableCell align="center">{device.hardwareID}</TableCell>
                <TableCell align="center">{device.firmwareVersion}</TableCell>
                <TableCell align="center">
                  {device.assignedUser}
                  <Tooltip title="Reassign device" placement="top-start">
                    <IconButton
                      onClick={() => openAssignmentDialog(device.hardwareID)}
                    >
                      <EditIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">{device.assignedTime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Dialog
          open={openDialog}
          onClose={handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Device Assignment</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please enter user's email or phone number. If the user has not
              registered, email, phone number, and name are required.
            </DialogContentText>
            <TextField
              autoFocus
              autoComplete="off"
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              disabled={!assignmentData.createUser && assignmentData.phoneNumber!==""}
              onChange={handleTextFieldOnChange}
              fullWidth
            />
            <TextField
              autoComplete="off"
              margin="dense"
              id="phoneNumber"
              label="Phone Number"
              type="tel"
              disabled={!assignmentData.createUser && assignmentData.email!==""}
              onChange={handleTextFieldOnChange}
              fullWidth
            />
            <TextField
              autoComplete="off"
              margin="dense"
              id="name"
              label="Name"
              type="string"
              disabled={!assignmentData.createUser}
              onChange={handleTextFieldOnChange}
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
            <Collapse in={assignmentData.errorMessage !== ""}>
              <Alert severity="error">{assignmentData.errorMessage}</Alert>
            </Collapse>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleReassignment}
              color="primary"
              disabled={assignmentData.disableAssignButton}
            >
              Assign
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
