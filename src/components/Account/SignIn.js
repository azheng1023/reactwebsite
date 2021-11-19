import React, { useState, useContext, useEffect } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import { UserContext } from "../UserContext";
import StorageUtility from "../../models/StorageUtility";
import ServerClient from "../../models/ServerClient";
import { MessagedProgress } from "../MessagedProgress";
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
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export function SignIn() {
  const classes = useStyles();
  const { setSessionInfo } = useContext(UserContext);
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
    rememberMe: false,
    tryAgain: false,
    errorMessage: "",
    persistedLoginDone: false,
  });
  const [twoFactorState, setTwoFactorState] = useState({
    show: false,
    errorMessage: "",
  });

  const history = useHistory();

  const handleClose = () => {
    setTwoFactorState({
      show: false,
      errorMessage: "",
    });
    setLoginInfo({
      ...loginInfo,
      errorMessage: "",
    });
  };

  useEffect(() => {
    const logIn = async () => {
      const persistedLogin = StorageUtility.getLogin();
      if (persistedLogin) {
        await connectToServer(null, persistedLogin);
      }
      setLoginInfo({
        ...loginInfo,
        persistedLoginDone: true,
      });
    };
    logIn();
  }, []);

  if (loginInfo.persistedLoginDone) {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <form className={classes.form} noValidate>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              onChange={(event) =>
                setLoginInfo({
                  ...loginInfo,
                  email: event.target.value,
                })
              }
            />
            <PasswordField
              handleChange={(event) =>
                setLoginInfo({
                  ...loginInfo,
                  password: event.target.value,
                })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  value="remember"
                  color="primary"
                  onChange={(event) =>
                    setLoginInfo({
                      ...loginInfo,
                      rememberMe: event.target.checked,
                    })
                  }
                />
              }
              label="Remember me"
            />
            <h4
              style={{
                color: "red",
                display: loginInfo.tryAgain ? "block" : "none",
              }}
            >
              {loginInfo.errorMessage}
            </h4>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              onClick={connectToServer}
            >
              Sign In
            </Button>
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2" onClick={handleForgetPassword}>
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link
                  component={RouterLink}
                  to={window.$websiteAlias + "signup"}
                  variant="body2"
                >
                  Don't have an account? Sign Up
                </Link>
              </Grid>
            </Grid>
          </form>
          <TwoFADialog
            show={twoFactorState.show}
            handleClose={handleClose}
            handleSuccessful2FAValidation={handleSuccessful2FAValidation}
            rememberMe={loginInfo.rememberMe}
          />
        </div>
      </Container>
    );
  } else {
    return <MessagedProgress message="Logging in" />;
  }

  async function handleForgetPassword(event) {
    if (event) {
      event.preventDefault();
    }
    if (loginInfo.email === "") {
      setLoginInfo({
        ...loginInfo,
        tryAgain: true,
        errorMessage: "Please enter email address",
      });
    } else {
      const response = await ServerClient.forgetPassword(loginInfo.email);
      if (response.status === 200) {
        setTwoFactorState({
          ...twoFactorState,
          show: true,
        });
        setLoginInfo({
          ...loginInfo,
          tryAgain: false,
          errorMessage: "",
        });
      } else {
        setLoginInfo({
          ...loginInfo,
          tryAgain: true,
          errorMessage: response.errorMessage,
        });
      }
    }
  }

  async function connectToServer(event, login) {
    if (event) {
      event.preventDefault();
    }
    const email = login ? login.email : loginInfo.email;
    const password = login ? login.password : loginInfo.password;
    const response = await ServerClient.signIn(
      email,
      password,
      loginInfo.rememberMe
    );
    if (response.status === 200) {
      if (response.data.twoFARequired) {
        setTwoFactorState({
          ...twoFactorState,
          show: true,
        });
      } else {
        if (event) {
          if (loginInfo.rememberMe) {
            StorageUtility.saveLogin({ email: "", password: "" });
          } else {
            StorageUtility.saveLogin(null);
          }
        }
        handleSuccessful2FAValidation(response.data);
      }
    } else {
      setLoginInfo({
        ...loginInfo,
        tryAgain: true,
        errorMessage: response.errorMessage,
      });
    }
  }

  function handleSuccessful2FAValidation(userInfo) {
    setSessionInfo({
      isLoggedIn: true,
      userID: userInfo.userID,
      userName: userInfo.name,
      email: userInfo.email,
      phoneNumber: userInfo.phoneNumber,
      isAdministrator: userInfo.isAdministrator,
      isScorer: userInfo.isScorer,
      pageTitle: "Study Summary",
      dataIDs: [0],
    });
    history.push(window.$websiteAlias + "studySummaryTable");
  }
}
