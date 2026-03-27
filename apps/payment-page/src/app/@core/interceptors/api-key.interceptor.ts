import { HttpInterceptorFn } from '@angular/common/http'
import { environment } from '../../../environments/environment'

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.apiUrl)) {
    req = req.clone({ setHeaders: { 'X-Api-Key': environment.apiKey } })
  }
  return next(req)
}
