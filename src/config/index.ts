import { Configuration, InferenceProviders } from '../types';
import baseUrl from './baseUrl';
import defaultConfig from './config-default.json';
import highlightThemes from './highlight.js-themes.json';
import inferenceProviders from './inference-providers.json';

export const isDev: boolean = import.meta.env.MODE === 'development';

export const CONFIG_DEFAULT: Readonly<Configuration> =
  Object.freeze(defaultConfig);

export const THEMES: readonly string[] = Object.freeze(['light', 'dark', 'system']);

export const SYNTAX_THEMES: readonly string[] = Object.freeze(highlightThemes);

export const INFERENCE_PROVIDERS: Readonly<InferenceProviders> =
  Object.freeze(inferenceProviders);

export { baseUrl };