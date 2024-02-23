/**
 * Configures the process supervisor for Hubble.
 *
 * This ensures if the process fails/dies we recover as quickly as possible.
 * Even if you're using a container process monitor like Docker, some systems
 * (e.g. ECS/Fargate) will still take 1-2 minutes to spin up a new container.
 * Using pm2 allows the container to remain running and thus recover faster.
 */

module.exports = {
  apps: [
    {
      name: "hubble",
      script: "./build/cli.js",
      instances: 1,
      exec_mode: "cluster",
      // HACK: Allows us to pass arguments in a way recognized by the CLI flag processing library we use
      // This is only necessary when running via PM2.
      args: process.env.HUBBLE_ARGS,
      watch: false,
      log_type: "json",
      err_file: "/dev/stderr",
    },
  ],
};
