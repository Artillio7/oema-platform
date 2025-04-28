import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { Alert } from './alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private subject = new Subject<Alert>();
  lastType = '';
  alertTimeout?: ReturnType<typeof setTimeout>;

  onAlert(): Observable<Alert> {
    return this.subject.asObservable();
  }

  success(message: string) {
    this.unknown('success', message);
  }

  info(message: string) {
    this.unknown('info', message);

  }

  warning(message: string) {
    this.unknown('warning', message);
  }

  danger(message: string) {
    this.unknown('danger', message);
  }

  unknown(type: string, message: string) {
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.lastType = type;
    this.subject.next({type, message});
  }

  clear() {
    this.lastType = '';
    this.subject.next({type: '', message: '' });
  }

  setAlertTimeout(timeMs: number) {
    this.alertTimeout = setTimeout(() => {
      this.clear();
    }, timeMs);
  }
}
