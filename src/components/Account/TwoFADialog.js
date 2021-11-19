import React, { useState } from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Collapse from "@material-ui/core/Collapse";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import Alert from "@material-ui/lab/Alert";
import ServerClient from "../../models/ServerClient";

export function TwoFADialog(props) {
  const [twoFactorState, setTwoFactorState] = useState({
    code: "",
    rememberDevice: false,
    errorMessage: "",
  });

  const handleCodeChange = (event) => {
    setTwoFactorState({
      ...twoFactorState,
      code: event.target.value,
    });
  };

  const handleSubmitCode = (event) => {
    validate2FACode(event);
  };

  const handleRememberDeviceChange = (event) => {
    setTwoFactorState({
      ...twoFactorState,
      rememberDevice: event.target.checked,
    });
  };

  return (
    <Dialog open={props.show} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Enter Code</DialogTitle>
      <DialogContent>
        <DialogContentText>Please check your email for code.</DialogContentText>
        <TextField
          autoFocus
          autoComplete="off"
          margin="dense"
          id="code"
          onChange={handleCodeChange}
          fullWidth
        />
        {!props.rememberMe && (
          <FormControlLabel
            control={
              <Checkbox
                value="remember"
                color="primary"
                onChange={handleRememberDeviceChange}
              />
            }
            label="Remember this device"
          />
        )}
        <Collapse in={twoFactorState.errorMessage !== ""}>
          <Alert severity="error">{twoFactorState.errorMessage}</Alert>
        </Collapse>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmitCode} color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );

  async function validate2FACode(event) {
    if (event) {
      event.preventDefault();
    }
    if (props.bypassValidation){
      props.handleSuccessful2FAValidation(twoFactorState.code);
      return;
    }
    let rememberOption = 0;
    if (props.rememberMe) {
      rememberOption = 1;
    } else if (twoFactorState.rememberDevice) {
      rememberOption = 2;
    }
    const response = await ServerClient.validate2FACode(
      twoFactorState.code,
      rememberOption
    );
    if (response.status === 200) {
      props.handleSuccessful2FAValidation(response.data);
    } else {
      setTwoFactorState({
        ...twoFactorState,
        errorMessage: response.errorMessage,
      });
    }
  }
}
