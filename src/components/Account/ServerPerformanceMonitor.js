import React, { useEffect, useState } from "react";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Container from "@material-ui/core/Container";
import ServerClient from "../../models/ServerClient";

function createData(name, value) {
  return { name, value };
}

export default function ServerPerformanceMonitor() {
  const [data, setData] = useState([]);
  useEffect(() => {
    async function fetchPerformanceData() {
      const response = await ServerClient.fetchPerformanceStats();
      const rows = [
        createData(
          "Up Since",
          new Date(
            Date.now() - response.data.elaspedTimeSeconds * 1000
          ).toLocaleString()
        ),
        createData("Login Count", response.data.userCount),
        createData("Call Count", response.data.callCount),
        createData("Error Count", response.data.exceptionCount),
        createData("Data In Rate", response.data.eventsInPerSecond.toFixed(2)),
        createData("Data Out Rate", response.data.eventsOutPerSecond.toFixed(2)),
      ];
      setData(rows);
    }
    fetchPerformanceData();
  }, []);
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
            <TableRow key={row.name}>
              <TableCell component="th" scope="row" align="center">
                {row.name}
              </TableCell>
              <TableCell align="center">{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}
