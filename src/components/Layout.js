import React from "react";
import NavMenu from "./NavMenu";

export function Layout(props) {
  return (
    <div>
      <NavMenu sessionInfo={props.sessionInfo} />
      <div>{props.children}</div>
    </div>
  );
}
