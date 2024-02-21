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
      // First arg is implicitly `node`
      args: "--max-old-space-size=8192 ./build/cli.js start --network 1",
      instances: 1, // Only one hub process can access RocksDB at a time
      watch: false,
      log_type: "json",
      out_file: "/dev/stdout",
      err_file: "/dev/stderr",
    },
  ],
};
