import { CategoryRow } from "./CategoryRow";
import { PersonalBestDataViewModel } from "../../App";
import { styles } from "./RunDisplayStyles";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from '@mui/material/TableHead';
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import CircularProgress from '@mui/material/CircularProgress';

export const RunDisplay = ({ userId, runData, loading }: {
  userId: string;
  runData?: PersonalBestDataViewModel;
  loading: boolean;
}) => {
  return (
    <TableContainer component={Paper} sx={styles.tableContainer}>
      <Table stickyHeader size="small" aria-label="collapsible table" sx={styles.table}>
        <TableHead>
          <TableRow>
            <TableCell align="center" colSpan={3}>Total Games Run: {runData?.games?.length ?? "none"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell />
            <TableCell align="left">Game</TableCell>
            <TableCell align="right">Categories Run</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            (loading)
            ? <TableRow sx={styles.tableRow}>
                <TableCell align="center" colSpan={3}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            : (runData && runData.games.length > 0)
              ?
                runData.games.map((game) => (
                  <CategoryRow 
                    key={`${userId}-${game.gameId}`}
                    userId={userId}
                    game={game}
                    runs={runData.runsByGameId.get(game.gameId) ?? []}
                    categories={runData.categoryLookup}
                    subcategories={runData.subcategoryLookup}
                  />
              ))
              :
                <TableRow sx={styles.tableRow}>
                  <TableCell align="center" colSpan={3}>No data to display</TableCell>
                </TableRow>
          }
        </TableBody>
      </Table>
    </TableContainer>
  );
};