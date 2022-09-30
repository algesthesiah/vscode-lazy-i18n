import path  from 'path';
import vscode from 'vscode';
import { getConfig } from './get-config';

export function getRootDir(): string | undefined {
  return getConfig().rootPath;
}
