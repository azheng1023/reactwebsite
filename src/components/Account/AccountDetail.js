import React, { useContext, useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import { UserContext } from "../UserContext";
import { PasswordField } from "./PasswordField";
import ServerClient from "../../models/ServerClient";

export default function AccountDetail() {
  const { sessionInfo, setSessionInfo } = useContext(UserContext);

  const [userInfo, setUserInfo] = useState({
    userID: sessionInfo.userID,
    name: sessionInfo.userName,
    email: sessionInfo.email,
    phoneNumber: sessionInfo.phoneNumber,
    password: "",
    oldPassword: "",
    twoFARequired: false,
    message: "",
    hasError: false,
    edit: false,
    showCurrentPassword: false,
  });

  const handleInput = (inputName) => (event) => {
    let showCurrentPassword = false;
    switch (inputName) {
      case "password":
        showCurrentPassword = event.target.value !== "";
        break;
      case "email":
        showCurrentPassword = event.target.value !== sessionInfo.email;
        break;
      default:
        if (userInfo.email !== sessionInfo.email || userInfo.password) {
          showCurrentPassword = true;
        }
    }
    setUserInfo({
      ...userInfo,
      [inputName]: event.target.value,
      showCurrentPassword: showCurrentPassword,
    });
  };

  const handleEditOrSave = (event) => {
    if (userInfo.edit) {
      editUserInfo();
    } else {
      setUserInfo({
        ...userInfo,
        hasError: false,
        message: "",
        edit: true,
      });
    }
  };

  const handleCancel = () => {
    setUserInfo({
      userID: sessionInfo.userID,
      name: sessionInfo.userName,
      email: sessionInfo.email,
      phoneNumber: sessionInfo.phoneNumber,
      password: "",
      oldPassword: "",
      twoFARequired: false,
      message: "",
      hasError: false,
      edit: false,
      showCurrentPassword: false,
    });
  };

  return (
    <Container component="main" maxWidth="xs" style={{ marginTop: "100pt" }}>
      <CssBaseline />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            autoComplete="fname"
            name="name"
            variant="outlined"
            fullWidth
            id="name"
            label="Name"
            disabled={!userInfo.edit}
            value={userInfo.name}
            autoFocus
            onChange={handleInput("name")}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            variant="outlined"
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            disabled={!userInfo.edit}
            value={userInfo.email}
            onChange={handleInput("email")}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            variant="outlined"
            fullWidth
            id="phoneNumber"
            label="Phone Number"
            name="phoneNumber"
            autoComplete="tel"
            disabled={!userInfo.edit}
            value={userInfo.phoneNumber}
            onChange={handleInput("phoneNumber")}
          />
        </Grid>
        <Grid item xs={12}>
          <PasswordField
            disabled={!userInfo.edit}
            handleChange={handleInput("password")}
          />
        </Grid>
        {userInfo.showCurrentPassword && (
          <Grid item xs={12}>
            <PasswordField
              passwordPlaceholder="Current Password"
              disabled={!userInfo.edit}
              handleChange={handleInput("oldPassword")}
            />
          </Grid>
        )}
      </Grid>
      <h4
        style={{
          color: userInfo.hasError ? "red" : "gray",
          display: userInfo.message ? "block" : "none",
        }}
      >
        {userInfo.message}
      </h4>
      <Button
        color="primary"
        style={{ float: "right"}}
        onClick={handleEditOrSave}
      >
        {userInfo.edit ? "Save" : "Edit"}
      </Button>
      <Button
        color="primary"
        style={{ float: "right" }}
        disabled={!userInfo.edit}
        onClick={handleCancel}
      >
        Cancel
      </Button>
    </Container>
  );

  async function editUserInfo() {
    let changed = false;
    if (
      userInfo.name !== sessionInfo.userName ||
      userInfo.email !== sessionInfo.email ||
      userInfo.phoneNumber !== sessionInfo.phoneNumber ||
      userInfo.password
    ) {
      changed = true;
    }
    if (!changed) {
      setUserInfo({
        ...userInfo,
        hasError: false,
        edit: false,
        showCurrentPassword: false,
      });
      return;
    }
    const response = await ServerClient.editUser({
      userInfo: userInfo,
      oldPassword: userInfo.oldPassword,
    });
    if (response.status === 200) {
      setUserInfo({
        ...userInfo,
        hasError: false,
        message: "Information updated",
        edit: false,
        showCurrentPassword: false,
      });
      setSessionInfo({
        ...sessionInfo,
        userName: userInfo.name,
        email: userInfo.email,
        phoneNumber: userInfo.phoneNumber,
      });
    } else {
      setUserInfo({
        ...userInfo,
        hasError: true,
        message: response.errorMessage,
      });
    }
  }
}
