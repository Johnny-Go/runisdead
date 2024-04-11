import React from "react";

import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import { RunDataViewModel } from "../App";

const Row = ({ name }: {
  name: string;
}) => {
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell component="th" scope="row">
          {name}
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export const RunDisplay = ({ runData }: {
    runData?: RunDataViewModel;
}) => {
  if(runData) {
    return (
      <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableBody>
            {runData.games.map((game) => (
              <Row key={game.gameId} name={game.gameName} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  } else {
    return null;
  }
};