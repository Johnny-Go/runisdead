import React, { useState } from "react";

import { HistoryRow } from "./HistoryRow";
import { CategoryDataViewModel, GameDataViewModel, RunDataViewModel, SubcategoryValueDataViewModel, SubcategoryDataViewModel } from "../../App";
import { RunRowData } from "./RunDisplayTypes";
import { styles } from "./RunDisplayStyles";

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from '@mui/material/TableHead';
import TableRow from "@mui/material/TableRow";
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export const CategoryRow = ({ userId, game, runs, categories, subcategories }: {
  userId: string;
  game: GameDataViewModel;
  runs: RunDataViewModel[];
  categories: Map<string, CategoryDataViewModel>;
  subcategories: Map<string, SubcategoryDataViewModel>;
}) => {
  const { open, setOpen, sortedRowData } = useStateForCategoryRow(runs, categories, subcategories);

  return (
    <React.Fragment>
      <TableRow sx={styles.tableRow} >
        <TableCell sx={styles.tableCell.noBottomBorder}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={styles.tableCell.noBottomBorder} align="left" component="th" scope="row">
          <a href={game.gameUrl} target="_blank">{game.gameName}</a>
        </TableCell>
        <TableCell sx={styles.tableCell.noBottomBorder} align="right">{sortedRowData.length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={styles.tableCell.noTopBottomPadding} colSpan={3}>
          <Collapse in={open} timeout="auto">
            <Box sx={styles.box}>
              <Typography variant="h6" gutterBottom component="div">
                Categories
              </Typography>
              <Table size="small" aria-label="runs">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Time</TableCell>
                    <TableCell align="right">Place</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRowData.map((row) => (
                    <HistoryRow key={`history-${row.runId}`} userId={userId} gameId={game.gameId} rowData={row} />
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

const useStateForCategoryRow = (
  runs: RunDataViewModel[],
  categories: Map<string, CategoryDataViewModel>,
  subcategories: Map<string, SubcategoryDataViewModel>,
) => {
    const [open, setOpen] = useState<boolean>(false);

    //we need to get every category + sub categories combination here
    /* for example:
      No Subcategories:   MMX: Any%; 100%; etc
      One Subcategory:    GCM: Any% + Easy; Co-op + Easy; etc
      Two Subcategories:  MBA: Phase 10 + 2 Players, Arcade; Phase 15 + 2 Players, Arcade; etc
      etc
    */
  
    const rowDataMap = new Map<string, RunRowData>();
    runs.forEach((run) => {
      const category = categories.get(run.categoryId);
      const subcategoryValueList: SubcategoryValueDataViewModel[] = [];
      run.subcategories.forEach((subcategory) => {
        const subcategoryData = subcategories.get(subcategory.subcategoryId);
        const subcategoryValue = subcategoryData?.subcategoryValues.get(subcategory.subcategoryValueId);
  
        if(subcategoryValue) {
          subcategoryValueList.push(subcategoryValue);
        }
      });
  
      const subcategoryValueIds = subcategoryValueList?.map((s) => s.subcategoryValueId).join()
      const rowData: RunRowData = {
        runId: run.runId,
        runUrl: run.runUrl,
        place: run.place,
        time: run.times.primaryTime,
        categoryId: category?.categoryId ?? "",
        categoryName: category?.categoryName ?? "",
        subcategoryValueIds: subcategoryValueIds,
        subcategoryValueNames: subcategoryValueList?.map((s) => s.subcategoryValueName).join(", ")
      };
  
      //some code to filter out older runs because the /personal-bests endpoint includes old runs sometimes
      const checkId = category?.categoryId + "," + subcategoryValueIds;
      const checkRowData = rowDataMap.get(checkId);
      if (checkRowData) {
        if (rowData.time > checkRowData.time) {
          return;
        }
      }
      rowDataMap.set(checkId, rowData);
    });
    const sortedRowData = Array.from(rowDataMap.values()).sort((a,b) => a.categoryName.localeCompare(b.categoryName) || a.subcategoryValueNames.localeCompare(b.subcategoryValueNames));

    return {
      open,
      setOpen,
      sortedRowData
    };
};