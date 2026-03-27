import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { environment } from '../../../environments/environment'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.apiUrl)) {
    const cloned = req.clone({
      setHeaders: { 'X-Api-Key': environment.apiKey },
    })
    return next(cloned)
  }
  return next(req)
}
