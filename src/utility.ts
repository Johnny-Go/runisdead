export const convertSecondsToTime = (numSeconds: number): string => {
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

export const capitalizeFirstLetter = (word: string): string => {
  return word.charAt(0).toUpperCase() + word.slice(1);
};