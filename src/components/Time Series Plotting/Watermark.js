import React from "react";
import { ButtonGroup, Button } from "@material-ui/core";

export function Watermark(props){
  return (
    <div
    style={{
      position: "absolute",
      opacity: 0.5,
      width: window.innerWidth - props.marginLeft,
      marginTop: props.height * 0.5 - 60,
      marginLeft: props.marginLeft,
      textAlign: "center",
    }}
  >
    <ButtonGroup disabled fullWidth>
      {props.marks.map((item) => (
        <Button style={{ fontFamily: "Helvetica", fontSize: "63px" }}>{item}</Button>
      ))}
    </ButtonGroup>
  </div>
  );
}