import { createPersonalToken } from "../services/iam-api.js";
import { generateUUID } from "../util/common.js";
import { logColor, logInfo, logSuccess } from "../util/logger.js";

const authAzion = async (apiBase, cookie, repoOwner) => {
  logColor("white", "gray", "Azion Authorization", "🚦");
  let _azionPersonalToken;
  if (cookie?.value) {
    logInfo("init create azion token!");
    const inputPersonalToken = { name: `${repoOwner}-${generateUUID()}` };
    const { results: resultsPersonalToken } = await createPersonalToken(apiBase, inputPersonalToken, {
      name: cookie?.name,
      value: cookie?.value,
    });
    _azionPersonalToken = resultsPersonalToken;
    logSuccess("Azion token created done!");
  } else {
    throw new Error("please session cookie is required");
  }
  return Promise.resolve(_azionPersonalToken);
};

export { authAzion };
