// This stub replaces the massive @opentelemetry/semantic-conventions package
// to save ~300KB in the bundle. We do not use the constants from this package
// in the client code, preferring string literals where necessary.

export const ATTR_SERVICE_NAME = 'service.name';
export const ATTR_SERVICE_VERSION = 'service.version';
export const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment';
export const ATTR_TELEMETRY_SDK_NAME = 'telemetry.sdk.name';
export const ATTR_TELEMETRY_SDK_LANGUAGE = 'telemetry.sdk.language';
export const ATTR_TELEMETRY_SDK_VERSION = 'telemetry.sdk.version';
export const TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = 'webjs';
export const ATTR_PROCESS_RUNTIME_NAME = 'process.runtime.name';
export const ATTR_PROCESS_RUNTIME_VERSION = 'process.runtime.version';
export const ATTR_PROCESS_RUNTIME_DESCRIPTION = 'process.runtime.description';
export const ATTR_EXCEPTION_MESSAGE = 'exception.message';
export const ATTR_EXCEPTION_STACKTRACE = 'exception.stacktrace';
export const ATTR_EXCEPTION_TYPE = 'exception.type';

// HTTP semconv 1.21+ (replaces deprecated http.method, http.url, http.status_code)
export const ATTR_HTTP_REQUEST_METHOD = 'http.request.method';
export const ATTR_HTTP_ROUTE = 'http.route';
export const ATTR_URL_PATH = 'url.path';
export const ATTR_HTTP_RESPONSE_STATUS_CODE = 'http.response.status_code';
