import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { AppForm } from '../ng-models/form';
import { User } from '../ng-models/user';

export interface FormWizard {
  user: User;
  form: AppForm;
  community: string;
}

@Injectable()
export class FormService {
  private formRoute = '/api/forms';

  constructor(private http: HttpClient) { }

  listForms(communityId: string, isSenior = false, ...searches: any[]) {
    let params = new HttpParams();
    for (const search of searches) {
      if (search.id && search.operator && search.value) {
        params = params.append(`filter[${search.id}][${search.operator}]`, search.value);
      }
      if (search.id && search.excludes && search.excludes === 1) {
        params = params.append(`excludes[${search.id}]`, search.excludes);
      }
      if (search.id && search.includes && search.includes === 1) {
        params = params.append(`includes[${search.id}]`, search.includes);
      }
    }

    return this.http.get<AppForm[]>(`${this.formRoute}/community/${communityId}${isSenior ? '?type=senior' : ''}`, { params });
  }

  listFormsWithUserProfiles(communityId: string, year: number, submitted: boolean, isSenior = false) {
    return this.http.get<any[]>(`${this.formRoute}/community/${communityId}?profile=1&year=${year}${submitted ? '&submitted=1' : ''}${isSenior ? '&type=senior' : ''}`);
  }

  submittedFormsPreview(communityId: string, year: number, submitted: boolean, isSenior = false) {
    return this.http.get<any[]>(`${this.formRoute}/community/${communityId}/preview?year=${year}${submitted ? '&submitted=1' : ''}${isSenior ? '&type=senior' : ''}`);
  }

  getForm(formId: string, communityId: string, userId?: string, isSenior = false) {
    if (userId) {
      return this.http.get<AppForm>(`${this.formRoute}/${formId}/community/${communityId}?id=${userId}${isSenior ? '&type=senior' : ''}`);
    } else {
      return this.http.get<AppForm>(`${this.formRoute}/${formId}/community/${communityId}${isSenior ? '?type=senior' : ''}`);
    }
  }

  getFormWizard(formId: string, communityId: string, isSenior = false) {
    return this.http.get<FormWizard>(`${this.formRoute}/wizard/${formId}/community/${communityId}${isSenior ? '?type=senior' : ''}`);
  }

  phantomGetsFormWizard(token: string, formId: string, communityId: string, formType: string) {
    return this.http.get<FormWizard>(`/api/phantomjs/${token}/form/${formId}/community/${communityId}/${formType}`);
  }

  exportFormToPdf(communitiesGroup: string, formId: string, communityId: string, formType: string) {
    const options = { responseType: 'blob' as const, };
    return this.http.get(`/api/phantomjs/form/${formId}/community/${communityId}/${formType}?group=${communitiesGroup}`, options);
  }

  getFormArchive(communitiesGroup: string, formIds: string, communityId: string, uid?: string, isSenior = false) {
    const options = { responseType: 'blob' as const, };
    return this.http.get(
      `/api/upload/archive/community/${communityId}/forms?group=${communitiesGroup}&ids=${formIds}${uid ? '&uid=' + uid : ''}${isSenior ? '&type=senior' : ''}`,
      options);
  }

  createForm(communityId: string, email: string, formType: string, isSenior = false) {
    return this.http.post<AppForm>(`${this.formRoute}/community/${communityId}${isSenior ? '?type=senior' : ''}`, { email, formType });
  }

  updateForm(
    formId: string,
    communityId: string,
    userId?: string,
    communitiesGroup?: string,
    isSenior = false,
    submit?: boolean,
    formType?: string,
    formTemplate?: any,
    userAnsweredForm?: any,
    juryDecision?: any
  ) {
    let params = new HttpParams();
    if (userId) {
      params = params.set('id', userId);
    }
    if (communitiesGroup) {
      params = params.set('group', communitiesGroup);
    }
    if (isSenior) {
      params = params.set('type', 'senior');
    }
    if (submit) {
      params = params.set('submit', + submit);
    }

    return this.http.put<AppForm>(`${this.formRoute}/${formId}/community/${communityId}`, { formType, formTemplate, userAnsweredForm, juryDecision }, { params });
  }

  updateFormEmail(formId: string, communityId: string, email: string, userId?: string, isSenior = false) {
    if (userId) {
      return this.http.put<AppForm>(`${this.formRoute}/${formId}/community/${communityId}?id=${userId}${isSenior ? '&type=senior' : ''}`, { email });
    } else {
      return this.http.put<AppForm>(`${this.formRoute}/${formId}/community/${communityId}${isSenior ? '?type=senior' : ''}`, { email });
    }
  }

  deleteForm(communitiesGroup: string, formId: string, communityId: string, userId?: string, isSenior = false) {
    if (userId) {
      return this.http.delete<AppForm>(`${this.formRoute}/${formId}/community/${communityId}?id=${userId}${isSenior ? '&type=senior' : ''}${communitiesGroup ? '&group=' + communitiesGroup : ''}`);
    } else if (isSenior) {
      return this.http.delete<AppForm>(`${this.formRoute}/${formId}/community/${communityId}?type=senior${communitiesGroup ? '&group=' + communitiesGroup : ''}`);
    } else {
      return this.http.delete<AppForm>(`${this.formRoute}/${formId}/community/${communityId}${communitiesGroup ? '?group=' + communitiesGroup : ''}`);
    }
  }

  getStats(communitiesGroup: string) {
    return this.http.get<any>(`${this.formRoute}/stats?group=${communitiesGroup}`);
  }

  getCommunityStats(communityId: string, year: number) {
    return this.http.get<any>(`${this.formRoute}/community/${communityId}/stats?year=${year}`);
  }
}
