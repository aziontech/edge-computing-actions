import * as util from "node:util";
import * as child from "node:child_process";
import { existsSync } from "node:fs";
const exec = util.promisify(child.exec);
import { writeFile, readFile as _readFile, stat } from "fs/promises";
import { logInfo } from "./logger.js";
import { messages } from "./message-log.js";
import { join } from "node:path";

/**
 * Extract and verify github url
 * @param {string} url
 * @returns {object} - repository owner and repository name
 */
const extractGitHubRepoPath = (url) => {
  if (!url) return {};
  const [_, path] = url.match(/(?:git@|https:\/\/)github.com[:/](.*).git/) || [];
  if (!path) return {};
  const [repoOwner, repoName] = path.split("/");
  return { repoOwner, repoName };
};

/**
 *
 * @param {string} path path to execute command
 * @param {string} command command execute
 * @returns {Promise}
 */
const execCommandWithPath = async (path, command) => {
  return await exec(`cd ${path} && ${command}`);
};

/**
 *
 * @param {string} path path to read file
 *
 * @returns {Promise}
 */
const readFile = async (path) => {
  return await _readFile(path, {
    encoding: "utf8",
  });
};

/**
 * writeFileJson
 * @param {string} path path to write
 * @param {*} body
 * @returns {Promise}
 */
const writeFileJSON = async (path, body) => {
  return writeFile(path, JSON.stringify(body, undefined, 2));
};

/**
 * wait
 * @param {number} ms milleseconds
 * @returns {Promise}
 */
const wait = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 *
 * @param {string} sourceCodePath
 * @param {string} pathFile
 * @param {object} content
 * @param {object} commit
 * @returns
 */
const commitAutomation = async (sourceCodePath, pathFile, content, commit) => {
  const [pathWork] = pathFile.split("/");
  await execCommandWithPath(sourceCodePath, `mkdir -p ${pathWork}`);
  await writeFileJSON(`${sourceCodePath}/${pathFile}`, content);
  if (commit) {
    await execCommandWithPath(
      sourceCodePath,
      `
      git config --global --add safe.directory ${sourceCodePath}
      git config user.name "github-actions"
      git config user.email "noreply@github.com"
      git add ${pathFile}
      git commit -m "[bot] Automated Config" || echo 'no changes commit'
      git push || echo 'no changes to push'
      `
    );
    messages.success(`Commit configuration '${pathFile}'!`);
  }
  return Promise.resolve(true);
};

/**
 * generate short id
 * @returns {string}
 */
const generateUUID = () => {
  let firstPart = (Math.random() * 46656) | 0;
  let secondPart = (Math.random() * 46656) | 0;
  firstPart = ("000" + firstPart.toString(36)).slice(-3);
  secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
};

/**
 *
 * @param {object} item
 * @returns
 */
const parseJsonFile = (item) => {
  let parsed;
  try {
    parsed = JSON.parse(item);
    return parsed;
  } catch (error) {
    throw error;
  }
};


const execSpawn = async (path, command) => {
  return new Promise((resolve, reject) => {
    const args = command.split(' ');
    const cmd = args.shift();
    let dataStr = ""

    const processCmd = child.spawn(cmd, args, { shell: true, cwd: path });
    processCmd.stdout.on('data', (data) => {
      dataStr = data.toString()
      if(dataStr.length > 0){
        logInfo(data.toString().trim());
      }
    });

    processCmd.stderr.on('data', (data) => {
      // Some tools and libraries choose to use stderr for process logging or informational messages.
      dataStr = data.toString();
      if (dataStr.toLowerCase().includes('error:')) {
        logInfo(dataStr);
      }
    });

    processCmd.on('error', (error) => {
      reject(error);
    });

    processCmd.on('close', (code) => {
      if (code === 0) {
        resolve(dataStr);
      } else {
        reject(new Error(`Command '${command}' failed with code ${code}`));
      }
    });
  })
};

/**
 *
 * @param {string} workdir
 * @param {string} key
 * @param {string} value
 * @returns
 */
const makeOutput = async (workdir, key, value) => {
  if (process.env.GITHUB_OUTPUT) {
    return execCommandWithPath(workdir, `echo "${key}=${value}" >> $GITHUB_OUTPUT`);
  }
};

/**
 *
 * @param {object} path
 * @returns
 */
const existFolder = async (path) => {
  const exist = existsSync(path);
  if(!exist){
    throw new Error(`Folder ${path} not exist`)
  }
  return Promise.resolve(exist);
};


/**
 * Remove Characters and Spaces
 * @param {string} text 
 * @returns 
 */
const removeCharactersAndSpaces = (text) => {
  let textNormalize = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[^\w\s]/gi, " ") // specials characters
    .replace(/\s+/g, "-"); // white spaces
  textNormalize = textNormalize.charAt(0) === "-" ? textNormalize.slice(1) : textNormalize; // remove first "-"
  textNormalize = textNormalize.slice(-1) === "-" ? textNormalize.slice(0, -1) : textNormalize; // remove last "-"
  return textNormalize;
};

/**
 * Check folder exists in project
 * @param {string} folder - Folder e.g node_modules
 * @returns {Promise<boolean>}
 */
async function folderExistsInProject(folder) {
  try {
    const stats = await stat(folder);
    return Promise.resolve(stats.isDirectory());
  } catch (error) {
    return Promise.resolve(false);
  }
}

export {
  extractGitHubRepoPath,
  execCommandWithPath,
  readFile,
  writeFileJSON,
  wait,
  commitAutomation,
  generateUUID,
  parseJsonFile,
  execSpawn,
  makeOutput,
  existFolder,
  removeCharactersAndSpaces,
  folderExistsInProject,
};
