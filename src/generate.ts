import fs from 'fs';
import path from 'path';
import vscode from 'vscode';
import { generateKeyPrefix, readJSONFile } from './utils/filepath';
import { getConfig } from './utils/get-config';

let i18nFile;
let messages;
let messagesHash = {};
let generated = 0;

const initMessage = () => {
  if (fs.existsSync(i18nFile)) {
    try {
      messages = readJSONFile(i18nFile);
      Object.keys(messages).forEach(key => {
        if (typeof messages[key] === 'string') {
          messagesHash[messages[key]] = key;
        }
      });
      //获取最大的 index
      generated =
        Math.max(
          ...Object.keys(messages).map(
            // @ts-ignore
            item => item.replace(/([^\d]+)|(\d\_+)/g, '') - 0
          ),
          Object.keys(messages).length
        ) || 0;
      // generated = Object.keys(messages).length || 1;
    } catch (e) {
      console.log(e);
    }
  }
  if (!messages || !Object.keys(messages).length) {
    messages = {};
  }
};

const writeMessage = () => {
  fs.writeFileSync(i18nFile, JSON.stringify(messages, null, '  ') + '\n', 'utf8');
};

/**
 * 获取当前 key
 * @returns {*}
 */
const getCurrentKey = (match, file) => {
  if (messagesHash[match]) return messagesHash[match];
  generated++;
  let key = generateKeyPrefix(file, getConfig()) + generated;
  if (!messages[key]) return key.toLowerCase();
  return getCurrentKey(match, file);
};

const generateReactFile = (file, type, frameworkType) => {
  let hasReplaced = false;
  let content = fs.readFileSync(file, 'utf8');

  const replaceJS = match => {
    //替换注释部分
    let comments = {};
    let commentsIndex = 0;
    match = match.replace(/(\/\*(.|\n|\r)*?\*\/)|(\/\/.*)/gim, (match, p1, p2, p3, offset, str) => {
      //排除掉 url 协议部分
      if (offset > 0 && str[offset - 1] === ':') return match;
      let commentsKey = `/*comment_${commentsIndex++}*/`;
      comments[commentsKey] = match;
      return commentsKey;
    });
    match = match.replace(/(['"`])([^'"`\n\r]*[\u4e00-\u9fa5]+[^'"`\n\r]*)(['"`])/gim, (_, prev, match, after) => {
      match = match.trim();
      let currentKey;
      let result = '';
      if (prev !== '`') {
        //对于普通字符串的替换
        currentKey = getCurrentKey(match, file);
        const _str = `t\`${currentKey}\`\n`;
        result = _str;
      } else {
        //对于 `` 拼接字符串的替换
        currentKey = getCurrentKey(match, file);
        result = `t({
            id: '${currentKey}',
            message: ${match},
          })\n`;
      }
      // readFileSync 时，会把 value 里的\n转仓\\n，在这里需要转回去
      messages[currentKey] = match.replace(/\\n/g, '\n');
      messagesHash[match] = currentKey;
      hasReplaced = true;
      return result;
    });
    //换回注释
    return match.replace(/\/\*comment_\d+\*\//gim, match => {
      return comments[match];
    });
  };

  const replaceTemplate = (oriContent: string) => {
    return oriContent.replace(/<(.|\n|\r)*>/gim, match => {
      return match.replace(
        /(\w+='|\w+="|>|'|")([^'"<>]*[\u4e00-\u9fa5]+[^'"<>]*)(['"<])/gim,
        (_, prev, match, after) => {
          match = match.trim();
          let result = '';
          let currentKey;

          if (match.match(/{[^{}]+}/)) {
            //对于 muscache 中部分的替换
            let matchArr: string[] = [];
            currentKey = getCurrentKey(match, file);
            const _message = match.replace(/(^{)|(}$)/gm, '');
            result = `${prev}{t({
            id: '${currentKey}',
            message: ${_message},
          })}\n${after}`;
          } else {
            currentKey = getCurrentKey(match, file);
            if (prev.match(/^\w+='$/)) {
              //对于属性中普通文本的替换
              result = `${prev}{t\`${currentKey}\`}\n${after}`;
            } else if (prev.match(/^\w+="$/)) {
              //对于属性中普通文本的替换
              result = `${prev}{t\`${currentKey}\`}\n${after}`;
            } else if (prev === '"' || prev === "'") {
              //对于属性中参数形式中的替换
              result = `t\`${prev}${currentKey}${after}\`\n`;
            } else {
              //对于 tag 标签中的普通文本替换
              result = `${prev}{t\`${currentKey}\`}\n${after}`;
            }
          }
          messages[currentKey] = match;
          messagesHash[match] = currentKey;
          hasReplaced = true;
          return result;
        }
      );
    });
  };
  content = replaceTemplate(content);
  content = replaceJS(content);

  if (!hasReplaced) {
    return false;
  }
  hasReplaced && fs.writeFileSync(file, content, 'utf-8');
  return true;
};

const generate = (file: string, rootPath: string | undefined, type = 'jsx') => {
  if (!rootPath) {
    vscode.window.showErrorMessage('rootPath 没有正确获取');
    return;
  }

  const { localePath, frameworkType, extName = 'messages.json' } = getConfig();
  i18nFile = path.join(rootPath, localePath, `zh-CN`, extName);
  if (!fs.existsSync(i18nFile)) {
    vscode.window.showErrorMessage(`I18n 文件："${i18nFile}" 没有找到`);
    return;
  }

  messages = {};
  messagesHash = {};
  generated = 1;
  initMessage();
  const hasReplaced =
    frameworkType === 'react'
      ? generateReactFile(file, type, frameworkType)
      : generateReactFile(file, type, frameworkType);
  if (hasReplaced) {
    writeMessage();
    vscode.window.showInformationMessage(`成功提取中文到 ${i18nFile} 内`);
  } else {
    vscode.window.showWarningMessage('没有需要提取的内容');
  }
};

export { generate };
