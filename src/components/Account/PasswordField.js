import React, { useState } from "react";
import InputLabel from "@material-ui/core/InputLabel";
import InputAdornment from "@material-ui/core/InputAdornment";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import Input from "@material-ui/core/OutlinedInput";
import IconButton from "@material-ui/core/IconButton";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";

export function PasswordField(props) {
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  let passwordPlaceholder = "Password *";
  if (props.passwordPlaceholder){
    passwordPlaceholder = props.passwordPlaceholder + " *";
  }
  return (
    <FormControl fullWidth variant="outlined">
      <InputLabel htmlFor="outlined-adornment-password">{passwordPlaceholder}</InputLabel>
      <Input
        id="outlined-adornment-password"
        required
        error={props.error}
        type={showPassword ? "text" : "password"}
        disabled={props.disabled}
        onChange={props.handleChange}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              edge="end"
            >
              {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </InputAdornment>
        }
        labelWidth={85}
      />
      <FormHelperText id="outlined-weight-helper-text">
        {props.error && props.errorMessage}
      </FormHelperText>
    </FormControl>
  );
}
