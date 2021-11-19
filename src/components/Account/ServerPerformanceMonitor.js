import React, { useEffect, useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Container from "@material-ui/core/Container";
import {
  Dialog,
  DialogContent,
  IconButton,
  Collapse,
  Grid,
  Box,
} from "@material-ui/core";
import { MoreHoriz, Undo } from "@material-ui/icons";
import { Line, LineChart, XAxis, YAxis, Label, ReferenceArea } from "recharts";
import ServerClient from "../../models/ServerClient";
import StorageUtility from "../../models/StorageUtility";
import { UserContext } from "../UserContext";

const counterNames = [
  "Up Since",
  "Login Count",
  "Call Count",
  "Error Count",
  "Events Received Rate",
  "Events Sent Rate",
];

function createData(counterID, value, moreIcon) {
  return { counterID, value, moreIcon };
}

export default function ServerPerformanceMonitor() {
  const [data, setData] = useState([]);
  const [details, setDetails] = useState({
    plotData: [
      { x: 100, y: 10 },
      { x: 120, y: 1 },
      { x: 150, y: 120 },
      { x: 200, y: 20 },
    ],
    label: "",
    selectedCoordinates: null,
    disableReturnToOriginalPlotRange: true,
    originalPlotRange: {},
    currentPlotRange: {},
  });
  const history = useHistory();
  const { sessionInfo, setSessionInfo } = useContext(UserContext);
  const yAxisWidth = 80;

  useEffect(() => {
    async function fetchPerformanceData() {
      const response = await ServerClient.getPerformanceStats();
      if (response.status === 200) {
        const rows = [
          createData(
            0,
            new Date(
              Date.now() - response.data.elaspedTimeSeconds * 1000
            ).toLocaleString()
          ),
          createData(1, response.data.userCount, true),
          createData(2, response.data.callCount, true),
          createData(3, response.data.exceptionCount, true),
          createData(4, response.data.eventsInPerSecond.toFixed(2), true),
          createData(5, response.data.eventsOutPerSecond.toFixed(2), true),
        ];
        setData(rows);
      } else if (response.status === 401) {
        StorageUtility.saveLogin("");
        history.push(window.$websiteAlias + "signin");
        setSessionInfo({
          userName: "",
          isLoggedIn: false,
          pageTitle: "",
          dataIDs: [0],
        });
      } else {
      }
    }
    fetchPerformanceData();
  }, []);

  const handleMoreClick = async (counterID) => {
    const response = await ServerClient.getCounterHistory(counterID);
    if (response.status === 200) {
      const plotData = [];
      let minX = response.data.times[0];
      let maxX = minX;
      let minY = response.data.values.data[0];
      let maxY = minY;
      for (var i = 0; i < response.data.times.length; i++) {
        const x = response.data.times[i];
        const y = response.data.values.data[i];
        maxX = x;
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        plotData.push({ x: x, y: y });
      }
      setDetails({
        ...details,
        plotData: plotData,
        originalPlotRange: {
          minX: Math.floor(minX),
          maxX: Math.ceil(maxX),
          minY: Math.floor(minY),
          maxY: Math.ceil(maxY),
        },
        currentPlotRange: {
          minX: Math.floor(minX),
          maxX: Math.ceil(maxX),
          minY: Math.floor(minY),
          maxY: Math.ceil(maxY),
        },
        label: counterNames[counterID],
      });
    }
  };

  const closeDetailPane = (event) => {
    setDetails({
      ...details,
      label: "",
    });
  };

  const dateFormatter = (value) => {
    return new Date(value * 1000).toLocaleString();
  };

  const handleMouseDown = (event) => {
    if (event) {
      setDetails({
        ...details,
        selectedCoordinates: {
          x1: event.chartX,
          y1: event.chartY,
          x2: event.chartX,
          y2: event.chartY,
        },
      });
    }
  };

  const handleMouseMove = (event) => {
    if (details.selectedCoordinates && event) {
      const newBoxDimension = {
        x1: details.selectedCoordinates.x1,
        y1: details.selectedCoordinates.y1,
        x2: event.chartX,
        y2: event.chartY,
      };
      setDetails({
        ...details,
        selectedCoordinates: newBoxDimension,
      });
    }
  };

  const handleMouseUp = (event) => {
    const selectedCoordinates = getSelectedCoordinates();
    if (selectedCoordinates) {
      if (selectedCoordinates.x2 - selectedCoordinates.x1 > 1) {
        setDetails({
          ...details,
          selectedCoordinates: null,
          disableReturnToOriginalPlotRange: false,
          currentPlotRange: {
            minX: Math.floor(selectedCoordinates.x1),
            maxX: Math.ceil(selectedCoordinates.x2),
            minY: Math.floor(selectedCoordinates.y2),
            maxY: Math.ceil(selectedCoordinates.y1),
          },
        });
        console.log(
          Math.ceil(selectedCoordinates.x2) - Math.floor(selectedCoordinates.x1)
        );
      } else {
        setDetails({
          ...details,
          selectedCoordinates: null,
        });
      }
    }
  };

  const handleUndoAll = (event) => {
    setDetails({
      ...details,
      currentPlotRange: details.originalPlotRange,
      disableReturnToOriginalPlotRange: true,
    });
  };

  const width = window.innerWidth - 100;
  const height = window.innerHeight * 0.5;
  let referenceAreaCoordinates = getSelectedCoordinates();

  return (
    <Container fixed>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell align="center">Name</TableCell>
            <TableCell align="center">Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.counterID}>
              <TableCell component="th" scope="row" align="center">
                {counterNames[row.counterID]}
              </TableCell>
              <TableCell align="center">
                {row.value}
                {row.moreIcon && (
                  <IconButton onClick={() => handleMoreClick(row.counterID)}>
                    <MoreHoriz />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog maxWidth="xl" open={details.label} onClose={closeDetailPane}>
        <DialogContent width={width} height={height}>
          <LineChart
            width={width}
            height={height}
            data={details.plotData}
            margin={{
              left: 0,
              right: 5,
              top: 5,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <XAxis
              dataKey="x"
              type="number"
              allowDataOverflow
              domain={[
                details.currentPlotRange.minX,
                details.currentPlotRange.maxX,
              ]}
              tickCount={3}
              tickFormatter={dateFormatter}
            />
            <YAxis
              width={yAxisWidth}
              allowDataOverflow
              domain={[
                details.currentPlotRange.minY,
                details.currentPlotRange.maxY,
              ]}
            >
              <Label value={details.label} angle={-90} />
            </YAxis>
            <Line
              dataKey="y"
              type="number"
              dot={false}
              isAnimationActive={false}
            />
            {referenceAreaCoordinates && (
              <ReferenceArea
                x1={referenceAreaCoordinates.x1}
                y1={referenceAreaCoordinates.y1}
                x2={referenceAreaCoordinates.x2}
                y2={referenceAreaCoordinates.y2}
              />
            )}
          </LineChart>
          <IconButton
            style={{ float: "right", marginTop: -height - 20 }}
            onClick={handleUndoAll}
            disabled={details.disableReturnToOriginalPlotRange}
          >
            <Undo />
          </IconButton>
        </DialogContent>
      </Dialog>
    </Container>
  );

  function getSelectedCoordinates() {
    if (details.selectedCoordinates) {
      const xOffset = yAxisWidth;
      const yOffset = 0;
      const fractionX =
        (details.currentPlotRange.maxX - details.currentPlotRange.minX) /
        (width - xOffset);
      const fractionY =
        (details.currentPlotRange.maxY - details.currentPlotRange.minY) /
        (height - 30 - yOffset);
      const x1 = Math.min(
        details.selectedCoordinates.x1,
        details.selectedCoordinates.x2
      );
      const y1 = Math.min(
        details.selectedCoordinates.y1,
        details.selectedCoordinates.y2
      );
      const x2 = Math.max(
        details.selectedCoordinates.x1,
        details.selectedCoordinates.x2
      );
      const y2 = Math.max(
        details.selectedCoordinates.y1,
        details.selectedCoordinates.y2
      );
      return {
        x1: details.currentPlotRange.minX + (x1 - xOffset) * fractionX,
        y1: details.currentPlotRange.maxY - (y1 - yOffset) * fractionY,
        x2: details.currentPlotRange.minX + (x2 - xOffset) * fractionX,
        y2: details.currentPlotRange.maxY - (y2 - yOffset) * fractionY,
      };
    } else {
      return null;
    }
  }
}
