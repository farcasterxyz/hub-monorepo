import { readFileSync } from "fs";
import { join, dirname } from "path";
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

  function findMissingEndpointsInDocs(endpoints, docsContent) {
    const missingEndpoints = endpoints.filter((endpoint) => !docsContent.includes(`### ${endpoint}`));

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

  function getParametersForEndpoint(endpoint, tree) {
    let foundEndpoint = false;
    let parameters = [];
    let line = 0;

    tree.children.forEach((node, index) => {
      if (node.type === "heading" && node.children[0].value === endpoint) {
        foundEndpoint = true;
      }

      if (foundEndpoint && node.type === "table") {
        parameters = node.children
          .slice(1)
          .map((row) => row.children[0].children[0]?.value)
          .filter((p) => p !== undefined);
        line = node.position.start.line;
        foundEndpoint = false; // Reset to stop looking after finding the table
      }
    });

    return { parameters, line };
  }

  function checkParametersInDocs(docTags, tree) {
    // For each endpoint, check if the parameters in the doc tags are present in the docs
    let anyError = false;
    for (const endpoint in docTags) {
      const { parameters, line } = getParametersForEndpoint(endpoint, tree);

      for (const param of docTags[endpoint].params) {
        if (!parameters.includes(param)) {
          anyError = true;
          console.error(
            `Parameter "${param}" specified in the @doc-tag (on httpServer.ts: line ${docTags[
              endpoint
            ].lineNumbers.join(
              ", ",
            )}) is missing documentation in the parameters table (on httpapi.md: line ${line}) for endpoint "${endpoint}"`,
          );
        }
      }

      // Check the other way. No excess params
      for (const param of parameters) {
        if (!docTags[endpoint].params.includes(param)) {
          anyError = true;
          console.error(
            `Parameter "${param}" is documented in the parameters table (on httpapi.md: line ${line}) for endpoint "${endpoint}" but is not specified in the @doc-tag (on httpServer.ts: line ${docTags[
              endpoint
            ].lineNumbers.join(", ")})`,
          );
        }
      }
    }

    return anyError;
  }

  const apiFilePath = join(__dirname, "../src/rpc/httpServer.ts");
  const contents = readFileSync(apiFilePath, "utf-8");

  const endpoints = extractUniqueEndpoints(contents);
  const docTags = extractDocTags(contents);

  const docFilePath = join(__dirname, "../www/docs/docs/httpapi.md");
  const docsContent = readFileSync(docFilePath, "utf-8");
  const tree = parseMarkdown(docsContent);

  // console.log(getParametersForEndpoint("castsByParent", tree));

  // First, get all endPoints that are not documented in the docs
  const missingEndpoints = findMissingEndpointsInDocs(endpoints, docsContent);

  // Next, get all endpoints that are documented but are missing doc tags
  const missingDocTags = findMissingDocTags(docTags, endpoints);

  // console.log(docTags);
  // Last, check for parameters
  let anyError = checkParametersInDocs(docTags, tree);

  if (missingEndpoints.length > 0) {
    console.error(
      "The following endpoints specified in httpServer.ts are missing from the HTTP API docs in httpapi.md:",
    );
    console.error(missingEndpoints);
    anyError = true;
  }

  if (missingDocTags.length > 0) {
    console.error("The following endpoints specified in httpServer.ts are missing doc tags:");
    console.error(missingDocTags);
    anyError = true;
  }

  if (anyError) {
    console.log("❌ HTTP API docs are not up to date");
    process.exit(1);
  } else {
    console.log("✨ HTTP API docs are up to date");
  }
}
