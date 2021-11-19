import React, { useState } from "react";
import {
  Button,
  Container,
  Grid,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Collapse,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  FormLabel,
  FormControl,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { Search, Add, Clear, Edit } from "@material-ui/icons";
import ServerClient from "../../models/ServerClient";

export default function ManageUser() {
  const [state, setState] = useState({
    users: [],
    newUser: {},
    newRole: 0,
    searchText: "",
    editUserIndex: -1,
    hasChanges: false,
    editRole: false,
    addUser: false,
    disableOK: true,
    errorMessage: "",
  });

  const handleSearchText = (event) => {
    setState({
      ...state,
      searchText: event.target.value,
    });
  };

  const handleSearchKeyPress = (event) =>{
    if (event.key === "Enter" && state.searchText !== ""){
      handleSearch(null);
    }
  }

  const handleSearch = async (event) => {
    const patterns = /^[0-9-]+$/i;
    let searchKey = "name";
    if (state.searchText.includes("@")) {
      searchKey = "email";
    } else if (patterns.test(state.searchText)) {
      searchKey = "phoneNumber";
    }
    const response = await ServerClient.getUsers({
      [searchKey]: state.searchText,
    });
    if (response.status === 200) {
      state.users = [];
      if (response.data.length === 0) {
        setState({
          ...state,
          newRole: 0,
          editUserIndex: -1,
          hasChanges: false,
          editRole: false,
          addUser: false,
          disableOK: true,
          errorMessage: "no user found",
        });
      } else {
        response.data.forEach((user) => {
          const role =
            (user.isAgent ? 1 : 0) +
            (user.isScorer ? 2 : 0) +
            (user.isAdministrator ? 4 : 0);
          state.users.push({
            id: user.userID,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: role,
            oldRole: role,
            isDeleted: false,
            isNew: false,
            isChanged: false,
          });
        });
        setState({
          ...state,
          newRole: 0,
          editUserIndex: -1,
          hasChanges: false,
          editRole: false,
          addUser: false,
          disableOK: true,
          errorMessage: "",
        });
      }
    } else {
      setState({
        ...state,
        errorMessage: response.errorMessage,
      });
    }
  };

  const handleDeleteUser = (index) => {
    if (state.users[index].isNew) {
      state.users.splice(index, 1);
    } else {
      state.users[index].isDeleted = true;
    }
    setState({
      ...state,
      hasChanges: true,
    });
  };

  const handleEditRole = (index) => {
    state.newRole = state.users[index].role;
    setState({
      ...state,
      editRole: true,
      disableOK: false,
      editUserIndex: index,
    });
  };

  const handleCancel = (event) => {
    state.users = state.users.filter((user) => !user.isNew);
    state.users.forEach((user) => {
      user.isDeleted = false;
      user.isChanged = false;
      user.role = user.oldRole;
    });
    setState({
      ...state,
      hasChanges: false,
      errorMessage: "",
    });
  };

  const handleSave = async (event) => {
    const changedUsers = [];
    state.users.forEach((user) => {
      const changedUser = {
        userInfo: {
          userID: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          isAgent: user.role & 1 ? true : false,
          isScorer: user.role & 2 ? true : false,
          isAdministrator: user.role & 4 ? true : false,
        },
        code: -1,
      };
      if (user.isDeleted) {
        console.log(user.name + " is deleted");
        changedUser.code = 2;
      } else if (user.isNew) {
        console.log(user.name + " is new");
        changedUser.code = 0;
      } else if (user.isChanged) {
        console.log(user.name + " is changed");
        changedUser.code = 1;
      }
      if (changedUser.code !== -1) {
        changedUsers.push(changedUser);
      }
    });
    if (changedUsers.length > 0) {
      const response = await ServerClient.editUsers(changedUsers);
      if (response.status !== 200) {
        setState({
          ...state,
          errorMessage: response.errorMessage,
        });
        return;
      }
    }
    setState({
      ...state,
      hasChanges: false,
      errorMessage: "",
    });
  };

  const handleAddUserDialogClose = (event) => {
    setState({
      ...state,
      addUser: false,
      editRole: false,
    });
  };

  const handleAddUserTextFieldOnChange = (event) => {
    switch (event.target.id) {
      case "name":
        state.newUser.name = event.target.value;
        break;
      case "email":
        state.newUser.email = event.target.value;
        break;
      case "phoneNumber":
        state.newUser.phoneNumber = event.target.value;
        break;
      default:
        break;
    }
    const enableOK =
      state.newUser.name && state.newUser.email && state.newUser.phoneNumber;
    setState({
      ...state,
      disableOK: !enableOK,
    });
  };

  const handleRoleCheckbox = (role) => (event) => {
    let newRole = state.newRole;
    if (event.target.checked) {
      newRole += role;
    } else {
      newRole -= role;
    }
    setState({
      ...state,
      newRole: newRole,
    });
  };

  const handleOpenAddUserDialog = (event) => {
    setState({
      ...state,
      newUser: {
        name: "",
        email: "",
        phoneNumber: "",
        role: 0,
        isDeleted: false,
        isNew: true,
      },
      newRole: 0,
      addUser: true,
      editUserIndex: -1,
      errorMessage: "",
    });
  };

  const handleAddUserOK = (event) => {
    if (state.addUser) {
      state.newUser.role = state.newRole;
      state.users.push(state.newUser);
    } else {
      state.users[state.editUserIndex].role = state.newRole;
      state.users[state.editUserIndex].isChanged = true;
    }
    setState({
      ...state,
      newUser: {},
      addUser: false,
      editRole: false,
      hasChanges: true,
      editUserIndex: -1,
    });
  };

  return (
    <Container fixed>
      <Grid container>
        <TextField
          style={{ width: 300 }}
          autoFocus
          autoComplete="off"
          margin="dense"
          id="searchKeyword"
          label="Search for User"
          type="string"
          placeholder="Enter user name, email, or phone number"
          value={state.searchText}
          onChange={handleSearchText}
          onKeyPress={handleSearchKeyPress}
        />
        <IconButton
          size="large"
          disabled={state.searchText === ""}
          onClick={handleSearch}
        >
          <Search fontSize="inherit" />
        </IconButton>
      </Grid>
      <Divider />
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell align="center">Name</TableCell>
            <TableCell align="center">Email</TableCell>
            <TableCell align="center">Phone</TableCell>
            <TableCell align="center">Role</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {state.users.map(
            (user, index) =>
              !user.isDeleted && (
                <TableRow key={user.userID}>
                  <TableCell component="th" scope="row" align="center">
                    {user.name}
                    <IconButton onClick={() => handleDeleteUser(index)}>
                      <Clear color="secondary" />
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">{user.email}</TableCell>
                  <TableCell align="center">{user.phoneNumber}</TableCell>
                  <TableCell align="center">
                    {getRole(user.role)}
                    <IconButton onClick={() => handleEditRole(index)}>
                      <Edit color="primary" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
          )}
        </TableBody>
      </Table>
      <Collapse in={state.errorMessage !== ""}>
        <Alert severity="error">{state.errorMessage}</Alert>
      </Collapse>
      <Divider />
      <IconButton
        color="primary"
        size="medium"
        onClick={handleOpenAddUserDialog}
      >
        <Add />
      </IconButton>
      <Button
        style={{ float: "right" }}
        color="primary"
        disabled={!state.hasChanges}
        onClick={handleSave}
      >
        Save
      </Button>
      <Button
        style={{ float: "right" }}
        color="primary"
        disabled={!state.hasChanges}
        onClick={handleCancel}
      >
        Cancel
      </Button>
      <Dialog
        open={state.addUser || state.editRole}
        onClose={handleAddUserDialogClose}
      >
        <DialogTitle id="new-device-dialog-title">
          {state.addUser ? "Add New User" : "Edit Role"}
        </DialogTitle>
        <DialogContent>
          <TextField
            disabled={state.editRole}
            autoFocus
            autoComplete="off"
            margin="dense"
            id="name"
            label="Name"
            type="string"
            value={
              state.editUserIndex < 0
                ? state.newUser.name
                : state.users[state.editUserIndex].name
            }
            onChange={handleAddUserTextFieldOnChange}
            fullWidth
          />
          <TextField
            disabled={state.editRole}
            autoComplete="off"
            margin="dense"
            id="email"
            label="Email"
            type="string"
            value={
              state.editUserIndex < 0
                ? state.newUser.email
                : state.users[state.editUserIndex].email
            }
            onChange={handleAddUserTextFieldOnChange}
            fullWidth
          />
          <TextField
            disabled={state.editRole}
            autoComplete="off"
            margin="dense"
            id="phoneNumber"
            label="Phone"
            type="string"
            value={
              state.editUserIndex < 0
                ? state.newUser.phoneNumber
                : state.users[state.editUserIndex].phoneNumber
            }
            onChange={handleAddUserTextFieldOnChange}
            fullWidth
          />
          <FormControl>
            <FormLabel style={{ marginTop: 20 }}>Role</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox disabled checked />}
                label="User"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.newRole & 1}
                    onChange={handleRoleCheckbox(1)}
                  />
                }
                label="Agent"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.newRole & 2}
                    onChange={handleRoleCheckbox(2)}
                  />
                }
                label="Scorer"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.newRole & 4}
                    onChange={handleRoleCheckbox(4)}
                  />
                }
                label="Administrator"
              />
            </FormGroup>
          </FormControl>
          <Collapse in={state.errorMessage !== ""}>
            <Alert severity="error">{state.errorMessage}</Alert>
          </Collapse>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddUserDialogClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleAddUserOK}
            color="primary"
            disabled={state.disableOK}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );

  function getRole(role) {
    let roleString = "User";
    if ((role & 1) === 1) {
      roleString += ", Agent";
    }
    if ((role & 2) === 2) {
      roleString += ", Scorer";
    }
    if ((role & 4) === 4) {
      roleString += ", Administrator";
    }
    return roleString;
  }
}
