const colours = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
    crimson: "\x1b[38m",
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    gray: "\x1b[100m",
    crimson: "\x1b[48m",
  },
};

/**
 * log color ANSI codes
 * @param {typeof colours.fg | undefined} fgColor
 * @param {typeof colours.bg | undefined} bgColor
 * @param {string} message
 * @param {string} emoji
 */
const logColor = (fgColor, bgColor, message, emoji) => {
  const fg = colours.fg[fgColor] || '';
  const bg = colours.bg[bgColor] || '';
  if(emoji){
    console.log(`${emoji}  ${fg}${bg}--- %s ---${colours.reset}`, message);
    return
  }
  console.log(`${fg}${bg} %s ${colours.reset}`, message);
};

/**
 * default process log
 * @param {string} message
 * @returns {void}
 */
const logConsole = (message) => {
  console.log(`........... ${message}`);
};

/**
 * 
 * @param {string} message 
 */
const logInfo = (message) => {
  console.info(`ℹ  info       ${message}`);
};

/**
 * 
 * @param {string} message 
 */
const logSuccess = (message) => {
  console.info(`✔  success    ${message}`);
};

/**
 * 
 * @param {string} message 
 */
const logFailure = (message) => {
  console.error(`✖  fatal     ${message}`);
  process.exit(1);
};

export {
  logColor,
  logConsole,
  logInfo,
  logSuccess,
  logFailure
};
