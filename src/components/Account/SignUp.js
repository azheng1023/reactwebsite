import React, { useState, useContext } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Collapse from "@material-ui/core/Collapse";
import Alert from "@material-ui/lab/Alert";
import ServerClient from "../../models/ServerClient";
import { UserContext } from "../UserContext";
import { TwoFADialog } from "./TwoFADialog";
import { PasswordField } from "./PasswordField";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export function SignUp() {
  const classes = useStyles();

  const { setSessionInfo } = useContext(UserContext);
  const [twoFactorState, setTwoFactorState] = useState({
    show: false,
    errorMessage: "",
  });

  const history = useHistory();

  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    invalidName: true,
    invalidEmail: true,
    invalidPhoneNumber: true,
    invalidPassword: true,
    errorMessage: "",
  });

  const handleClose = () => {
    setTwoFactorState({
      show: false,
      errorMessage: "",
    });
  };

  const handleInput = (inputName) => (event) => {
    const inputValue = event.target.value;
    let invalidInputName = "";
    let invalidInputValue = false;
    switch (inputName) {
      case "name":
        invalidInputName = "invalidName";
        invalidInputValue = inputValue === "";
        break;
      case "email":
        invalidInputName = "invalidEmail";
        const re = /\S+@\S+\.\S+/;
        invalidInputValue = !re.test(inputValue);
        break;
      case "phoneNumber":
        invalidInputName = "invalidPhoneNumber";
        const digits = inputValue.replace(/[^0-9]/g, "");
        invalidInputValue = digits.length < 10;
        break;
      case "password":
        invalidInputName = "invalidPassword";
        invalidInputValue = inputValue.length < 8;
        break;
      default:
        break;
    }
    setUserInfo({
      ...userInfo,
      [inputName]: inputValue,
      [invalidInputName]: invalidInputValue,
    });
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <form className={classes.form} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                error={userInfo.invalidName}
                autoComplete="fname"
                name="name"
                variant="outlined"
                required
                fullWidth
                id="name"
                label="Name"
                value={userInfo.name}
                autoFocus
                onChange={handleInput("name")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                error={userInfo.invalidEmail}
                variant="outlined"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                onChange={handleInput("email")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                error={userInfo.invalidPhoneNumber}
                variant="outlined"
                required
                fullWidth
                id="phoneNumber"
                label="Phone Number"
                name="phoneNumber"
                autoComplete="tel"
                onChange={handleInput("phoneNumber")}
              />
            </Grid>
            <Grid item xs={12}>
              <PasswordField
                error={userInfo.invalidPassword}
                errorMessage="Must be at least 8 characters"
                handleChange={handleInput("password")}
              />
            </Grid>
          </Grid>
          <Collapse in={userInfo.errorMessage !== ""}>
            <Alert severity="error">{userInfo.errorMessage}</Alert>
          </Collapse>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={
              userInfo.invalidName ||
              userInfo.invalidEmail ||
              userInfo.invalidPhoneNumber ||
              userInfo.invalidPassword
            }
            className={classes.submit}
            onClick={handleSignup}
          >
            Sign Up
          </Button>
          <Grid container justify="flex-end">
            <Grid item>
              <Link
                component={RouterLink}
                to={window.$websiteAlias + "signin"}
                variant="body2"
              >
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </form>
        <TwoFADialog
          show={twoFactorState.show}
          handleClose={handleClose}
          handleSuccessful2FAValidation={handleSuccessful2FAValidation}
          rememberMe={false}
        />
      </div>
    </Container>
  );

  function validateInput(inputName, inputValue) {}

  async function handleSignup(event) {
    if (event) {
      event.preventDefault();
    }
    try {
      const response = await ServerClient.signUp(userInfo);
      if (response.status === 200) {
        if (response.data.twoFARequired) {
          setTwoFactorState({
            ...twoFactorState,
            show: true,
          });
        } else {
          handleSuccessful2FAValidation(response.data);
        }
      } else {
        setUserInfo({
          ...userInfo,
          errorMessage: response.errorMessage,
        });
      }
    } catch (e) {
      setUserInfo({
        ...userInfo,
        errorMessage: e.message,
      });
    }
  }

  function handleSuccessful2FAValidation(userInfo) {
    setSessionInfo({
      isLoggedIn: true,
      userName: userInfo.name,
      isAdministrator: userInfo.isAdministrator,
      pageTitle: "Study Summary",
      dataIDs: [0],
    });
    history.push(window.$websiteAlias + "studySummaryTable");
  }
}
