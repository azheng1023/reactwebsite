import React, { Fragment, useState } from "react";
import ResizableRect from "react-resizable-rotatable-draggable";
import "./ResizeableContent.css";

const minimumWidth = 10;
const ResizableContent = (props) => {
  const [state, setState] = useState({
    top: props.top,
    height: props.height,
    left: props.left,
    width: props.width,
    originalLeft: props.width,
    originalWidth: props.width,
  });

  const adjustedLeft = Math.max(state.left, props.minimumLeft);
  const adjustedRight = Math.min(props.maximumWidth, state.left + state.width);
  const contentStyle = {
    top: state.top,
    left: adjustedLeft,
    width: Math.max(adjustedRight - adjustedLeft, minimumWidth),
    height: state.height,
    position: "absolute",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: props.backgroundColor,
  };

  let zoomable = "";
  if (props.enableEdit) {
    if (state.left > props.minimumLeft) {
      zoomable += "w,";
    }
    if (state.left + state.width < props.maximumWidth) {
      zoomable += "e";
    }
  }

  const handleResize = (style, isShiftKey, type) => {
    console.log(style);
    if (type === "r") {
      setState({
        ...state,
        width: style.width + style.left - state.left,
      });
    } else if (type === "l") {
      setState({
        ...state,
        left: style.left,
        width: state.width + state.left - style.left,
      });
    } else {
      return;
    }
    props.handleEventChange(props.eventIndex, state.left, state.width);
    console.log("event resized");
  };

  const handleDrag = (deltaX, deltaY) => {
    const newLeft = state.left + deltaX;
    setState({
      ...state,
      left: newLeft,
    });
    props.handleEventChange(props.eventIndex, newLeft, state.width);
  };

  return (
    <Fragment>
      <div style={contentStyle}>{props.children}</div>
      <ResizableRect
        left={contentStyle.left}
        minWidth={minimumWidth}
        width={contentStyle.width}
        minHeight={10}
        height={contentStyle.height}
        onDrag={props.enableEdit ? handleDrag : null}
        onResize={handleResize}
        zoomable={zoomable}
      />
    </Fragment>
  );
};

export default ResizableContent;
