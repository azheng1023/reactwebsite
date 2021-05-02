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
  const history = useHistory();

  useEffect(() => {
    const persistedLogin = StorageUtility.getLogin();
    if (persistedLogin && persistedLogin.email && persistedLogin.password) {
      connectToServer(null, persistedLogin);
    }
    setLoginInfo({
      ...loginInfo,
      persistedLoginDone: true,
    });
  }, []);

  if (loginInfo.persistedLoginDone){

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
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            onChange={(event) =>
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
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link
                component={RouterLink}
                to={window.$websiteAlias + "signup"}
                variant="body2"
              >
                "Don't have an account? Sign Up"
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
    </Container>
  );}
  else{
    return <MessagedProgress message="Logging in"/>
  }

  async function connectToServer(event, login) {
    if (event) {
      event.preventDefault();
    }
    const email = login ? login.email : loginInfo.email;
    const password = login ? login.password : loginInfo.password;
    const response = await ServerClient.signIn(email, password);
    if (response.status === 200) {
      setSessionInfo({
        isLoggedIn: true,
        userName: response.data.name,
        isAdministrator: response.data.isAdministrator,
        pageTitle: "Study Summary",
        studyID: 0,
      });
      if (event) {
        if (loginInfo.rememberMe) {
          StorageUtility.saveLogin({ email: email, password: password });
        } else {
          StorageUtility.saveLogin(null);
        }
      }
      history.push(window.$websiteAlias + "studySummaryTable");
    } else {
      setLoginInfo({
        ...loginInfo,
        tryAgain: true,
        errorMessage: response.errorMessage,
      });
    }
  }
}
