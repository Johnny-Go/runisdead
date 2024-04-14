export const styles = {
  tableContainer: {
    maxHeight: "75vh",
    minHeight: "10vh",
  },
  table: {
    minWidth: 650
  },
  tableRow: {
    "& > *": { borderBottom: "unset" },
    "&:last-child td, &:last-child th": { border: 0 }
  },
  tableCell: {
    noBottomBorder: {
      borderBottom: "none"
    },
    noTopBottomPadding: {
      paddingBottom: 0,
      paddingTop: 0
    }
  },
  box: {
    margin: 1
  }
};