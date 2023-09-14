import signale from "signale";

const colorReset = `\x1b[0m`;
const colors = {
  black: "\u001b[30m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  magenta: "\u001b[35m",
  cyan: "\u001b[36m",
  white: "\u001b[37m",
};

/**
 * 
 * @param {typeof colors} color 
 * @param {*} content 
 * @returns 
 */
const changeColor = (color, content) => {
  return `${colors[color]}${content}${colorReset}`;
};

const methods = {
  info: {
    badge: changeColor("blue", "ℹ"),
    label: changeColor("blue", "info"),
    color: "blue",
    logLevel: "info",
  },
  note: {
    badge: changeColor("blue", "●"),
    label: changeColor("blue", "note"),
    color: "blue",
    logLevel: "info",
  },
  complete: {
    badge: changeColor("cyan", "☒"),
    label: changeColor("cyan", "complete"),
    color: "cyan",
    logLevel: "info",
  },
  await: {
    badge: changeColor("blue", "···"),
    label: changeColor("blue", "awaiting"),
    color: "blue",
    logLevel: "info",
  },
  success: {
    badge: changeColor("green", "✔"),
    label: changeColor("green", "success"),
    color: "green",
    logLevel: "info",
  },
  title: {
    badge: "🔶",
    label: "",
    color: "yellow",
    logLevel: "info",
  },
  subtitle: {
    badge: "🔷",
    label: "",
    color: "blue",
    logLevel: "info",
  },
  textOnly: {
    badge: "",
    label: "",
    color: "yellow",
    logLevel: "info",
  },
  build: {
    badge: "📦",
    color: "blue",
    label: `${colors.magenta}building${colorReset}`,
    logLevel: "info",
  },
  deployed: {
    badge: "🚀",
    color: "magenta",
    label: `${colors.magenta}deployed${colorReset}`,
    logLevel: "info",
  },
  error: {
    badge: changeColor("red", "✖"),
    label: changeColor("red", "error"),
    color: "red",
    logLevel: "info",
  },
};

const newScope = (options = {}) => {
  const logger = new signale.Signale({ ...options });
  return logger;
};

const global = new signale.Signale({ interactive: false, scope: "JAMStack", types: methods });

const messages = {
  ...global,
  init: {
    ...global.scope("JAMStack", "Init"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Init"], types: methods }),
  },
  prebuild: {
    ...global.scope("JAMStack", "Prebuild"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Prebuild"], types: methods }),
  },
  build: {
    ...global.scope("JAMStack", "Build"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Build"], types: methods }),
  },
  deploy: {
    ...global.scope("JAMStack", "Deploy"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Deploy"], types: methods }),
  },
  deployCreate: {
    ...global.scope("JAMStack", "Deploy", "Create"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Deploy", "Create"], types: methods }),
  },
  deployUpdate: {
    ...global.scope("JAMStack", "Deploy", "Update"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Deploy", "Update"], types: methods }),
  },
  deployStorage: {
    ...global.scope("JAMStack", "Deploy", "Storage"),
    interactive: newScope({ interactive: true, scope: ["JAMStack", "Deploy", "Storage"], types: methods }),
  },
};

export { messages, changeColor };
