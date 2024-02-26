import { readFileSync, readdirSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { remark } from "remark";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * This linter checks that each of the HTTP API server endpoints is documented properly.
 * This will check:
 *   1. That all endpoints have a "@doc-tag:" comment in the httpServer.ts file
 *   2. Make sure that all endpoints have a corresponding section in the HTTP API docs
 *   3. Make sure that all parameters for every endpoint are documented in the HTTP API docs
 *      under the corresponding section
 *   4. Make sure that all parameters that are documented are specified in the @docs-tag comment
 *      for that endpoint in the httpServer.ts file
 */
export function httpapidocs() {
  function extractUniqueEndpoints(fileContent) {
    const endpointSet = new Set();
    const regex = /\"\/v\d+\/([a-zA-Z0-9_]+)([a-zA-Z0-9_\/:]*)\"/g;
    let match;

    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    while ((match = regex.exec(fileContent)) !== null) {
      endpointSet.add(match[1]);
    }

    return [...endpointSet];
  }

  function findMissingEndpointsInDocs(endpoints, allDocsContent) {
    const docsContent = allDocsContent.join("\n");
    const missingEndpoints = endpoints.filter((endpoint) => !docsContent.includes(`## ${endpoint}`));

    return missingEndpoints;
  }

  function extractDocTags(fileContent) {
    const endpointMap = {};
    const regex = /\/\/ @doc-tag:? \/([a-zA-Z0-9_]+)\??([^ \n]*)/;
    const lines = fileContent.split("\n");

    lines.forEach((line, index) => {
      const match = line.match(regex);
      if (match) {
        const endpoint = match[1];
        const queryParams = match[2]
          .split("&")
          .filter(Boolean)
          .map((param) => param.split("=")[0]);

        if (!endpointMap[endpoint]) {
          endpointMap[endpoint] = { params: new Set(), lineNumbers: [] };
        }

        queryParams.forEach((param) => endpointMap[endpoint].params.add(param));
        endpointMap[endpoint].lineNumbers.push(index + 1);
      }
    });

    // Convert sets to arrays for the final result
    for (const endpoint in endpointMap) {
      endpointMap[endpoint].params = [...endpointMap[endpoint].params];
    }

    return endpointMap;
  }

  function findMissingDocTags(endpointMap, endpoints) {
    const missingDocTags = [];

    for (const endpoint of endpoints) {
      if (!endpointMap[endpoint]) {
        missingDocTags.push(endpoint);
      }
    }

    return missingDocTags;
  }

  function parseMarkdown(markdownContent) {
    const processor = remark().use(remarkParse).use(remarkGfm);
    const tree = processor.parse(markdownContent);

    return tree;
  }

  function getParametersForEndpoint(endpoint, trees) {
    // Get the markdown documented parameters for a given endpoint
    for (const { fileName, tree } of trees) {
      let foundEndpoint = false;
      for (const node of tree.children) {
        if (node.type === "heading" && node.children[0].value === endpoint) {
          foundEndpoint = true;
          continue;
        }

        if (foundEndpoint && node.type === "table") {
          const parameters = node.children
            .slice(1)
            .map((row) => row.children[0].children[0]?.value)
            .filter((p) => p !== undefined);
          const line = `${fileName}:${node.position.start.line}`;
          return { parameters, line};
        }
      }
    }

    return { parameters: [], line: '' };
  }

  function checkParametersInDocs(docTags, trees) {
    // For each endpoint, check if the parameters in the doc tags are present in the docs
    let anyError = false;
    for (const endpoint in docTags) {
      const { parameters, line } = getParametersForEndpoint(endpoint, trees);

      for (const param of docTags[endpoint].params) {
        if (!parameters.includes(param)) {
          anyError = true;
          console.error(
            `Parameter "${param}" specified in the @doc-tag (on httpServer.ts: line ${docTags[
              endpoint
            ].lineNumbers.join(
              ", ",
            )}) is missing documentation in the parameters table (on ${line}) for endpoint "${endpoint}"`,
          );
        }
      }

      // Check the other way. No excess params
      for (const param of parameters) {
        if (!docTags[endpoint].params.includes(param)) {
          anyError = true;
          console.error(
            `Parameter "${param}" is documented in the parameters table (on ${line}) for endpoint "${endpoint}" but is not specified in the @doc-tag (on httpServer.ts: line ${docTags[
              endpoint
            ].lineNumbers.join(", ")})`,
          );
        }
      }
    }

    return anyError;
  }

  function extractRPCProtoMethods() {
    const filePath = resolve(__dirname, "../../../protobufs/schemas/rpc.proto");
    let lineNumber = 0;

    try {
      const data = readFileSync(filePath, "utf8");
      const lines = data.split("\n");
      const methodNames = [];
      let httpApiName = null;

      let insideHubService = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine === "service HubService {") {
          insideHubService = true;
          continue;
        }

        if (insideHubService && trimmedLine === "}") {
          break;
        }

        if (insideHubService) {
          // Check for @http-api comment
          const httpApiMatch = trimmedLine.match(/@http-api:\s*(\w+|none)/);
          if (httpApiMatch) {
            httpApiName = httpApiMatch[1];
          }

          // Check for rpc method
          const rpcMatch = trimmedLine.match(/rpc (\w+)\(/);
          if (rpcMatch) {
            // Skip this rpc method if @http-api is "none"
            if (httpApiName === "none") {
              httpApiName = null;
              continue;
            }

            let name = httpApiName || rpcMatch[1];

            // Use the standard naming convention if @http-api is not specified
            if (!httpApiName && name.startsWith("Get")) {
              name = name.substring(3);
            }

            const camelCaseName = name.charAt(0).toLowerCase() + name.slice(1);

            methodNames.push({ methodName: camelCaseName, lineNumber });
            httpApiName = null; // Reset for next rpc method
          }
        }
        lineNumber++;
      }

      return methodNames;
    } catch (err) {
      console.error("Error reading the file:", err);
      return [];
    }
  }

  function findMissingRpcProtoInHttpApi(rpcMethodNames, endpoints) {
    const missingRpcMethods = [];
    for (const rpcMethod of rpcMethodNames) {
      const { methodName, lineNumber } = rpcMethod;
      if (!endpoints.includes(methodName)) {
        console.error(
          `RPC method "${methodName}" (on rpc.proto: line ${lineNumber}) is missing from the HTTP API in httpserver.ts`,
        );
        missingRpcMethods.push(methodName);
      }
    }

    return missingRpcMethods;
  }

  const apiFilePath = join(__dirname, "../src/rpc/httpServer.ts");
  const contents = readFileSync(apiFilePath, "utf-8");

  const endpoints = extractUniqueEndpoints(contents);
  const docTags = extractDocTags(contents);

  const docsFolderPath = join(__dirname, "../www/docs/docs/httpapi/");
  const fileNames = readdirSync(docsFolderPath);

  const trees = [];
  const allDocsContent = [];

  fileNames.forEach((fileName) => {
    const docFilePath = join(docsFolderPath, fileName);
    const docsContent = readFileSync(docFilePath, "utf-8");
    const tree = parseMarkdown(docsContent);
    trees.push({ fileName, tree });
    allDocsContent.push(docsContent);
  });
  // console.log(getParametersForEndpoint("castsByParent", tree));

  // First, get all endPoints that are not documented in the docs
  const missingEndpoints = findMissingEndpointsInDocs(endpoints, allDocsContent);

  // Make sure the same passes for doc-tags as well, ensuring doc-tags and endpoints are 1-1
  const missingDocTagEndpoints = findMissingEndpointsInDocs(Object.keys(docTags), allDocsContent);

  // Next, get all endpoints that are documented but are missing doc tags
  const missingDocTags = findMissingDocTags(docTags, endpoints);

  // Get a list of all the RPC methods in the proto file
  const protoMethodNames = extractRPCProtoMethods();
  const missingRpcMethods = findMissingRpcProtoInHttpApi(protoMethodNames, endpoints);

  // console.log(docTags);
  // Last, check for parameters
  let anyError = false;

  if (missingEndpoints.length > 0) {
    console.error(
      "The following endpoints specified in httpServer.ts are missing from the HTTP API docs in httpapi.md:",
    );
    console.error(missingEndpoints);
    anyError = true;
  }

  if (missingDocTagEndpoints.length > 0) {
    console.error(
      "The following endpoints specified as @doc-tags in httpServer.ts are missing from the HTTP API docs in httpapi.md:",
    );
    // console.error(missingDocTagEndpoints);
    for (const endpoint of missingDocTagEndpoints) {
      const { lineNumbers } = docTags[endpoint];
      console.error(`Endpoint "${endpoint}" (on httpServer.ts: line ${lineNumbers.join(", ")})`);
    }

    anyError = true;
  }

  if (missingDocTags.length > 0) {
    console.error("The following endpoints specified in httpServer.ts are missing doc tags:");
    console.error(missingDocTags);
    anyError = true;
  }

  if (missingRpcMethods.length > 0) {
    console.error("Some RPC methods are missing from the HTTP API");
    anyError = true;
  }

  anyError = checkParametersInDocs(docTags, trees) || anyError;

  if (anyError) {
    console.log("❌ HTTP API docs are not up to date");
    process.exit(1);
  } else {
    console.log("✨ HTTP API docs are up to date");
  }
}
