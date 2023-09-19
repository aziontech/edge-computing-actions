import * as apiAzion from "../services/azion-api.js";
import { commitAutomation, execSpawn, folderExistsInProject, generateUUID, parseJsonFile, readFile } from "../util/common.js";
import * as dotenv from "dotenv";
import { messages } from "../util/message-log.js";

/**
 *
 * @param {string} url
 * @param {string} token
 * @param {*} modules
 * @param {Object} sourceCode
 * @param {string} sourceCode.path
 * @param {string} sourceCode.configPath
 * @param {string} sourceCode.functionPath
 * @param {string} sourceCode.functionArgsPath
 * @param {string} sourceCode.versionBuildPath
 * @param {string} sourceCode.buildPreset
 * @param {string} sourceCode.buildMode
 * @param {object} sourceCode.info
 * @param {string} sourceCode.buildStaticFolder
 * @param {string} VULCAN_COMMAND
 * @returns {Promise}
 */
const publishOrUpdate = async (url, token, modules, sourceCode, VULCAN_COMMAND) => {
  let result = {};

  const functionCode = await readFile(sourceCode.functionPath);
  let functionArgs = await readFile(sourceCode.functionArgsPath);
  functionArgs = parseJsonFile(functionArgs);

  const azionConfig = await verifyConfig(sourceCode.path, sourceCode.configPath);

  if (!azionConfig) {
    messages.deployCreate.await("create edge application");
    const { results: resultEdgeApplication } = await publishEdgeApplication(
      url,
      token,
      sourceCode.info,
      functionCode,
      functionArgs,
      modules
    );
    result = resultEdgeApplication;

    messages.deployCreate.success("create edge application");
  } else {
    // update
    messages.deployUpdate.await("update edge application");
    result = await updateEdgeApplication(url, token, functionCode, functionArgs, azionConfig);
    messages.deployUpdate.success("create edge application");

    if (azionConfig?.domain?.url) {
      const domain = azionConfig.domain.url;
      messages.deployUpdate.await(`purge domain`);
      await apiAzion
        .purge(url, "url", { urls: [`${domain}`, `${domain}/`] }, null, token)
        .catch((err) => messages.deploy.info("problem to purge domain url"));
      messages.deployUpdate.success(`purge domain`);
    }
  }

  // sync storage
  const staticExists = await folderExistsInProject(sourceCode?.buildStaticFolder);
  if (staticExists) {
    const AZION_ENV_VALUE = "production";
    messages.deployUpdate.await("storage files");
    await execSpawn(sourceCode.path, `AZION_ENV=${AZION_ENV_VALUE} DEBUG=true ${VULCAN_COMMAND} auth --token ${token}`);
    await execSpawn(sourceCode.path, `AZION_ENV=${AZION_ENV_VALUE} DEBUG=true ${VULCAN_COMMAND} storage sync`);
    messages.deployUpdate.success("storage files");
  }

  // change config
  dotenv.config({ path: sourceCode.versionBuildPath });
  result["version-id"] = process.env.VERSION_ID;
  result.type = sourceCode?.buildPreset;
  result.mode = sourceCode?.buildMode;

  // commit azion config
  messages.deploy.await("commit config");
  await commitAutomation(sourceCode.path, sourceCode.configPath, result, true);
  messages.deploy.success("commit config");

  return Promise.resolve(result);
};

/**
 *
 * @param {string} url
 * @param {string} token
 * @param {object} config
 * @param {string} functionPath
 * @param {string} functionArgs
 * @param {object} modules { acceleration: true }
 * @returns
 */
const publishEdgeApplication = async (url, token, config, functionCode, functionArgs, modules) => {
  const uniqueApplicationName = `${config?.application.name}-${generateUUID()}`;

  messages.deployCreate.interactive.await("[%d/6] - starting create edge application", 1);
  const inputCreateApplication = { name: uniqueApplicationName };
  const resultCreateEdgeApplication = await apiAzion.createEdgeApplication(url, inputCreateApplication, null, token);
  const { results: resultEdgeApplication } = resultCreateEdgeApplication || {};

  const inputPathApplication = { edge_functions: true, application_acceleration: modules.acceleration };
  await apiAzion.patchEdgeApplication(url, resultEdgeApplication?.id, inputPathApplication, null, token);
  messages.deployCreate.interactive.success("[%d/6] - edge application", 2);

  //   create function
  messages.deployCreate.interactive.await("[%d/6] - starting create edge function", 3);
  const inputFunction = { name: uniqueApplicationName, code: functionCode, args: functionArgs };
  const resultCreateFunction = await apiAzion.createFunction(url, inputFunction, null, token).catch(async (err) => {
    messages.deployCreate.interactive.error("[%d/6] - rollback edge application", 4);
    await apiAzion.deleteEdgeApplication(url, resultEdgeApplication?.id, null, token);
    messages.deployCreate.interactive.success("[%d/6] - rollback edge application", 4);
    throw err;
  });

  const { results: resultFunction } = resultCreateFunction || {};

  const inputEdgeAppInstance = {
    name: config?.application.name,
    functionId: resultFunction?.id,
    args: functionArgs,
  };
  const resultEdgeAppInstance = await apiAzion.createInstanceEdgeApplication(
    url,
    resultEdgeApplication?.id,
    inputEdgeAppInstance,
    null,
    token
  );

  const { results: resultInstance } = resultEdgeAppInstance || {};

  //   update rule engine
  const inputRuleEngine = { instanceFunctionId: resultInstance?.id };
  await apiAzion.updateRuleEngineFunction(url, resultEdgeApplication?.id, inputRuleEngine, null, token);

  messages.deployCreate.interactive.success("[%d/6] - create edge function", 4);

  // create domain

  messages.deployCreate.interactive.await("[%d/6] - create edge domain", 5);
  const inputDomain = { name: uniqueApplicationName, edgeApplicationId: resultEdgeApplication?.id };
  const createResultDomain = await apiAzion.createDomain(url, inputDomain, null, token);
  messages.deployCreate.interactive.success("[%d/6] - create edge domain", 6);

  const { results: resultDomain } = createResultDomain || {};

  const results = {
    name: uniqueApplicationName,
    env: process?.env?._ENVIRONMENT || "production",
    application: {
      id: resultEdgeApplication?.id,
      name: resultEdgeApplication?.name,
    },
    domain: {
      id: resultDomain?.id,
      name: resultDomain?.name,
      url: resultDomain?.domain_name,
    },
    function: {
      id: resultFunction?.id,
      name: resultFunction?.name,
    },
  };
  return Promise.resolve({ results });
};

const updateEdgeApplication = async (url, token, functionCode, functionArgs, azionConfig) => {
  if (!azionConfig?.application?.id) {
    throw new Error("config (azion.json) invalid");
  }

  messages.deployUpdate.interactive.await("[%d/4] - update edge function", 1);
  const bodyFunction = { id: azionConfig?.function?.id, code: functionCode, args: functionArgs };
  await apiAzion.patchFunction(url, bodyFunction, null, token);
  messages.deployUpdate.interactive.success("[%d/4] - update edge function", 2);

  // update args function
  messages.deployUpdate.interactive.await("[%d/4] - update edge function args", 3);
  const { results: resInstance } = await apiAzion.getInstanceEdgeApplication(url, azionConfig?.application?.id, null, token);
  const instanceFunction = resInstance.find((item) => item.edge_function_id === azionConfig?.function?.id);
  const inputInstanceUpdate = { functionId: azionConfig?.function?.id, args: functionArgs };
  await apiAzion
    .patchInstanceEdgeApplication(url, azionConfig?.application?.id, instanceFunction?.id, inputInstanceUpdate, null, token)
    .catch((err) => messages.deployUpdate.interactive.info("[%d/4] - problem to update args", 3));
  messages.deployUpdate.interactive.success("[%d/4] - update edge function", 4);

  return Promise.resolve(azionConfig);
};

/**
 *
 * @param {string} sourceCodePath
 * @param {string} configPath
 * @returns
 */
const verifyConfig = async (sourceCodePath, configPath) => {
  let config = await readFile(`${sourceCodePath}/${configPath}`).catch((err) => {
    // file not exist
    messages.info("config azion not exist, create new edge application");
  });
  if (config) {
    config = parseJsonFile(config);
  }
  if (!config?.application?.id || config?.application?.id === 0) {
    // config exist, but application id not exit or equal 0
    return undefined;
  }
  return config;
};

export { publishOrUpdate };
