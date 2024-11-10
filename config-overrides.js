// config-overrides.js

module.exports = function override(config, env) {
    // Add fallback for 'fs' module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  };
  