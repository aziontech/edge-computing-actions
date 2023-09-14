import { request } from "node:https";

/**
 * create headers for requests
 * @param {string} token azion personal token
 * @param {string} ghToken token github
 * @returns
 */
const makeHeaders = (ghToken) => {
  return {
    Accept: "application/vnd.github+json",
    "User-agent": "Awesome-App",
    Authorization: `Bearer ${ghToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
};

/**
 * request client https
 * @param {string} baseurl base url
 * @param {string} path path api
 * @param {string} method method request
 * @param {object} input input body
 * @param {string} ghToken github personal token
 * @returns
 */
const requestApi = async (baseurl, path, method, input, ghToken) => {
  const options = {
    method: method,
    hostname: baseurl,
    path: path,
    headers: makeHeaders(ghToken),
  };
  let p = new Promise((resolve, reject) => {
    const req = request(options, (res) => {
      res.setEncoding("utf8");
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        try {
          if (res?.statusCode < 200 || res?.statusCode >= 300) {
            return reject(new Error(responseBody));
          }
          if (responseBody) {
            const results = JSON.parse(responseBody);
            return resolve({ results, status: res.statusCode });
          }
          resolve({ results: responseBody, status: res.statusCode });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (input) {
      const postData = JSON.stringify(input);
      req.write(postData);
    }
    req.end();
  });

  return p;
};


/**
 * createNewRepo repo github
 * @param {string} baseurl base url
 * @param {object} input input body
 * @param {string} ghToken github personal token
 * @returns
 */
const createNewRepo = async (baseurl, input, ghToken) => {
  const postData = {
    owner: input?.owner,
    name: input.name,
    description: input?.description,
    private: input?.private || true
  };
  return requestApi(baseurl, `/user/repos`, "POST", postData, ghToken);
};

/**
 * 
 * @param {string} baseurl 
 * @param {object} input 
 * @param {string} ghToken 
 * @returns 
 */
const pathRepo = async (baseurl, input, ghToken) => {
  const postData = {
    description: input?.description,
    homepage: input?.homepage
  };
  return requestApi(baseurl, `/repos/${input?.owner}/${input?.repoName}`, "PATCH", postData, ghToken);
};

/**
 * generate repo by template github
 * @param {string} baseurl base url
 * @param {object} input input body
 * @param {string} ghToken github personal token
 * @returns
 */
const generateRepoByTemplate = async (baseurl, input, ghToken) => {
  const postData = {
    owner: input?.owner,
    name: input?.name,
    description: input?.description,
    include_all_branches: false,
    private: input?.private
  };
  return requestApi(baseurl, `/repos/${input.repoTemplate}/generate`, "POST", postData, ghToken);
};

export {
  generateRepoByTemplate,
  createNewRepo,
  pathRepo
};
