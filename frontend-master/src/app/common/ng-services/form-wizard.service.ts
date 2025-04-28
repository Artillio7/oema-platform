import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { WizardStep } from '../ng-models/community';

@Injectable()
export class FormWizardService {
  private formwizardRoute = '/api/formwizards';

  constructor(private http: HttpClient) { }

  getFormWizardFromCommunity(communityId: string, formType: string) {
    const params = new HttpParams()
      .set('type', formType);

    return this.http.get<WizardStep[]>(`${this.formwizardRoute}/${communityId}`, { params });
  }
}
