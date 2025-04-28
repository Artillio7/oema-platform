/* "Barrel" of Http Interceptors */
import { requestOptionsProvider } from './default-request-options.interceptor';

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
  requestOptionsProvider
];
