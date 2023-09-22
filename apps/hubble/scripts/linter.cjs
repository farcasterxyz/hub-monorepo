/**
 * Custom linters for Hubble. There are some additional things we want to check
 * for that are not covered by the default linters.
 *
 * For eg. we want to check if the Grafana dashboards are valid JSON and if the
 * datasource is set to "Graphite".
 *
 * Add linters as .cjs files in this directory and they will be executed as a
 * part of "yarn lint".
 */

async function executeAll() {
  const grafana = require("./grafanadash.cjs");
  const clidocs = require("./clidocs.cjs");
  const { httpapidocs } = await import("./httpapidocs.js");

  await Promise.all([grafana(), clidocs(), httpapidocs()]);
}

executeAll();
