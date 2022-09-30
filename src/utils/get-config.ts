import fs from 'fs';
import path from 'path';
import vscode from 'vscode';
import { getWorkspaceFolder, readJSONFile } from './filepath';

type FrameworkType = 'react';

export interface IConfig {
  rootPath: string;
  locoExportKey: string;
  localePath: string;
  // I18n 文件扩展名，默认 json，多语言文件后缀不一定是 json
  ext: string;
  frameworkType?: FrameworkType;
  keyPrefixMaxDepth: number;
  /**
   * 生成 I18n key 的时候，去掉前缀
   *
   * 例如：stripKeyPrefix: "src/pages"
   *
   * 原本生成 src_pages_users_show_100 会变成 users_show_100
   */
  stripKeyPrefix: string;
}

const DEFAULT_CONFIG: IConfig = {
  rootPath: '',
  localePath: 'lang',
  ext: 'po',
  frameworkType: 'react',
  keyPrefixMaxDepth: 0,
  stripKeyPrefix: '',
  locoExportKey: '',
};

const findNearPackageJSON = () => {
  const document = vscode.window.activeTextEditor?.document;
  const rootPath = getWorkspaceFolder();
  if (!rootPath) {
    return 'package.json';
  }

  if (!document) {
    return path.join(rootPath, 'package.json');
  }

  // 递归寻找最近的 package.json
  let parentDir = path.dirname(document.uri.path);
  while (!fs.existsSync(path.join(parentDir, 'package.json'))) {
    parentDir = path.join(parentDir, '..');
    if (parentDir == rootPath || parentDir == '') {
      return path.join(rootPath, 'package.json');
    }
  }

  return path.join(parentDir, 'package.json');
};

export const getConfig = (): IConfig => {
  const packagePath = findNearPackageJSON();
  const rootPath = path.dirname(packagePath);

  DEFAULT_CONFIG.rootPath = rootPath;

  let packageJson;
  if (fs.existsSync(packagePath)) {
    packageJson = readJSONFile(packagePath);
  } else {
    vscode.window.showWarningMessage(
      '项目根目录缺少 package.json，无法正确运行。'
    );
    return DEFAULT_CONFIG;
  }

  let { lazyI18n } = packageJson || {};


  let config: any = {};

  if (lazyI18n) {
    config.rootPath = rootPath;
    config.locoExportKey = lazyI18n.locoExportKey;
    config.localePath = lazyI18n.localePath || lazyI18n.langPath || DEFAULT_CONFIG.localePath;
    config.ext = lazyI18n.ext || DEFAULT_CONFIG.ext;
    config.frameworkType = lazyI18n.frameworkType || DEFAULT_CONFIG.frameworkType;
    config.keyPrefixMaxDepth = lazyI18n.keyPrefixMaxDepth || DEFAULT_CONFIG.keyPrefixMaxDepth;
    config.stripKeyPrefix = lazyI18n.stripKeyPrefix || DEFAULT_CONFIG.stripKeyPrefix;
  }

  return config;
};
