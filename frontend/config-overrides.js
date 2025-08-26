const path = require('path');

module.exports = function override(config, env) {
  // Tắt source map warnings từ node_modules
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Can't resolve 'fs'/,
    /Module not found: Error: Can't resolve/,
    /source-map-loader/,
  ];

  // Cấu hình source-map-loader để bỏ qua face-api.js
  const sourceMapLoader = config.module.rules.find(rule => 
    rule.use && rule.use.some(use => 
      use.loader && use.loader.includes('source-map-loader')
    )
  );

  if (sourceMapLoader) {
    sourceMapLoader.exclude = [
      ...(sourceMapLoader.exclude || []),
      /node_modules\/face-api\.js/,
      /node_modules\/@tensorflow/,
    ];
  }

  return config;
};
