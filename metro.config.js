const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    const target = moduleName.startsWith('@/assets/')
      ? path.join(projectRoot, 'assets', moduleName.slice('@/assets/'.length))
      : path.join(projectRoot, 'src', moduleName.slice('@/'.length));

    if (defaultResolveRequest) {
      return defaultResolveRequest(context, target, platform);
    }

    return context.resolveRequest(context, target, platform);
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
