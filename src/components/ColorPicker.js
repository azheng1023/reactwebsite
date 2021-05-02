import React, { Fragment, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { HexColorPicker } from "react-colorful";
import { Popover } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  swatch: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    border: "2px solid #fff",
    boxShadow:
      "0 0 0 1px rgba(0, 0, 0, 0.3)",
    cursor: "pointer",
  },
  popover: {
    width: "auto",
    height: "auto",
    padding: theme.spacing(0.5),
  },
  hexColorPickerStyle: {
    "& .react-colorful__pointer": {
      width: 10,
      height: 10,
    },
    "& .react-colorful__hue-pointer": {
      width: 10,
      height: 30,
      borderRadius: 0,
    },
  },
}));

export default function ColorPicker(props) {
  const [anchorEl, setAnchorEL] = useState(null);

  const handleClick = (event) => {
    setAnchorEL(event.target);
  };

  const handleClose = () => {
    setAnchorEL(null);
  };

  const classes = useStyles();
  const isOpen = Boolean(anchorEl);
  return (
    <Fragment>
      <div
        className={classes.swatch}
        style={{
          backgroundColor: props.backgroundColor,
        }}
        onClick={handleClick}
      />
      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        onClose={handleClose}
      >
        <div className={classes.popover}>
          <HexColorPicker
          className={classes.hexColorPickerStyle}
            color={props.backgroundColor}
            onChange={props.handleColorChange}
          />
        </div>
      </Popover>
    </Fragment>
  );
}
