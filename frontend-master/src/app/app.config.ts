import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IAppConfig } from './common/ng-models/app-config';

import { lastValueFrom } from 'rxjs';

@Injectable()
export class AppConfig {
  settings?: IAppConfig;
  constructor(private http: HttpClient) { }
  async load() {
    const jsonFile = `assets/config/app.config.json`;
    if (!this.settings) {
      this.settings = await lastValueFrom(this.http.get<IAppConfig>(jsonFile));
    }
  }
}
