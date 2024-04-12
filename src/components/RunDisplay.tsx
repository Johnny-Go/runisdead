import React, { useState } from "react";

import { CategoryViewModel, RunDataViewModel, RunViewModel, SubcategoryValueViewModel, SubcategoryViewModel } from "../App";
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import TableHead from '@mui/material/TableHead';
import TableRow from "@mui/material/TableRow";
import Typography from '@mui/material/Typography';
import Paper from "@mui/material/Paper";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';

export const RunDisplay = ({ runData }: {
    runData?: RunDataViewModel;
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if(runData) {
    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - runData?.games?.length) : 0;

    return (
      <TableContainer component={Paper} style={{ maxHeight: "75vh" }}>
        <Table stickyHeader aria-label="collapsible table" >
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Game</TableCell>
              <TableCell align="right">Categories Run</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? runData.games.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : runData.games
            ).map((game) => (
              <CategoryRow 
                key={game.gameId}
                name={game.gameName}
                runs={runData.runsByGameId.get(game.gameId) ?? []}
                categories={runData.categoryLookup}
                subcategories={runData.subcategoryLookup}
              />
            ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[10, 25, { label: 'All', value: -1 }]}
                colSpan={3}
                count={runData?.games?.length ?? 0}
                rowsPerPage={rowsPerPage}
                page={page}
                slotProps={{
                  select: {
                    inputProps: {
                      'aria-label': 'rows per page',
                    },
                    native: true,
                  },
                }}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    );
  } else {
    return null;
  }
};

const CategoryRow = ({ name, runs, categories, subcategories }: {
  name: string;
  runs: RunViewModel[];
  categories: Map<string, CategoryViewModel>;
  subcategories: Map<string, SubcategoryViewModel>;
}) => {
  const [open, setOpen] = useState(false);

  // we need to get every category + sub categories combination here
  /* for example:
    No Subcategories:   MMX: Any%; 100%; etc
    One Subcategory:    GCM: Any% + Easy; Co-op + Easy; etc
    Two Subcategories:  MBA: Phase 10 + 2 Players, Arcade; Phase 15 + 2 Players, Arcade; etc
    etc
  */

  const rowDataMap = new Map<string, RowData>();
  runs.forEach((run) => {
    const category = categories.get(run.categoryId);
    const subcategoryValueList: SubcategoryValueViewModel[] = [];
    run.subcategories.forEach((subcategory) => {
      const subcategoryData = subcategories.get(subcategory.subcategoryId);
      const subcategoryValue = subcategoryData?.subcategoryValues.get(subcategory.subcategoryValueId);

      if(subcategoryValue) {
        subcategoryValueList.push(subcategoryValue);
      }
    });

    const subcategoryValueIds = subcategoryValueList?.map((s) => s.subcategoryValueId).join()
    const rowData: RowData = {
      runId: run.runId,
      place: run.place,
      time: run.times.primaryTime,
      categoryId: category?.categoryId ?? "",
      categoryName: category?.categoryName ?? "",
      subcategoryValueIds: subcategoryValueIds,
      subcategoryValueNames: subcategoryValueList?.map((s) => s.subcategoryValueName).join(", ")
    };

    //some code to filter out older runs because the /personal-bests endpoint includes old runs sometimes
    const checkId = category?.categoryId + "," + subcategoryValueList?.map((s) => s.subcategoryValueId).join();
    const checkRowData = rowDataMap.get(checkId);
    if(checkRowData) {
      if(rowData.time > checkRowData.time) {
        return;
      }
    }
    rowDataMap.set(checkId, rowData);
  });
  const sortedRowData = Array.from(rowDataMap.values()).sort((a,b) => a.categoryName.localeCompare(b.categoryName) || a.subcategoryValueNames.localeCompare(b.subcategoryValueNames));

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }} >
        <TableCell sx={{ borderBottom: "none" }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ borderBottom: "none" }} component="th" scope="row">{name}</TableCell>
        <TableCell sx={{ borderBottom: "none" }} align="right">{sortedRowData.length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Categories
              </Typography>
              <Table size="small" aria-label="runs">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Time</TableCell>
                    <TableCell align="right">Place</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRowData.map((row) => (
                    <TableRow key={`${row.runId}`}>
                      <TableCell component="th" scope="row">{`${row.categoryName}${row.subcategoryValueNames ? ": " + row.subcategoryValueNames : ""}`}</TableCell>
                      <TableCell align="right">{convertSecondsToTime(row.time)}</TableCell>
                      <TableCell align="right">{row.place}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

type RowData = {
  runId: string;
  place: number;
  time: number;
  categoryId: string;
  categoryName: string;
  subcategoryValueIds: string;
  subcategoryValueNames: string;
};

const convertSecondsToTime = (numSeconds: number): string => {
  let workingVar = (numSeconds * 1000);
  const d = Math.trunc(workingVar / 86400000);
  workingVar = workingVar % 86400000;
  const h = Math.trunc(workingVar / 3600000);
  workingVar = workingVar % 3600000;
  const m = Math.trunc(workingVar / 60000);
  workingVar = workingVar % 60000;
  const s = Math.trunc(workingVar / 1000);
  workingVar = workingVar % 1000;
  const ms = workingVar;

  return [
    d > 0 ? `${d}d` : [],
    h > 0 ? `${h}h` : (d > 0) && h === 0 ? "0h" : [],
    m > 0 ? `${m}m` : (d > 0 || h > 0) && m === 0 ? "0m" : [],
    s > 0 ? `${s}s` : (d > 0 || h > 0 || m > 0) && s === 0 ? "0s" : [],
    ms > 0 ? `${ms}ms` : [],
  ].join(" ");
};

const TablePaginationActions = ({ count, page, rowsPerPage, onPageChange }: {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (
    event: React.MouseEvent<HTMLButtonElement>,
    newPage: number,
  ) => void;
}) => {
  const theme = useTheme();

  const handleFirstPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}