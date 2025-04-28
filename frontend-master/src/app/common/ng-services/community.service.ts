import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Community } from '../ng-models/community';
import { User } from '../ng-models/user';

@Injectable()
export class CommunityService {
  private communityRoute = '/api/communities';

  constructor(private http: HttpClient) { }

  listCommunities(...searches: any[]) {
    let params = new HttpParams();
    for (const search of searches) {
      if (search.id && search.operator && search.value) {
        params = params.append(`filter[${search.id}][${search.operator}]`, search.value); // the user's search value using regex
      }
      if (search.id && search.value) {
        params = params.append(`filter[${search.id}]`, search.value); // === search exact matching the value
      }
      if (search.id && search.excludes && search.excludes === 1) {
        params = params.append(`excludes[${search.id}]`, search.excludes);
      }
      if (search.id && search.includes && search.includes === 1) {
        params = params.append(`includes[${search.id}]`, search.includes);
      }
      if (search.group) {
        params = params.append('group', search.group);
      }
      if (search.forms) {
        params = params.append('forms', search.forms);
      }
    }

    return this.http.get<Community[]>(this.communityRoute, { params });
  }

  getCommunity(communityId: string) {
    return this.http.get<Community>(`${this.communityRoute}/${communityId}`);
  }

  createCommunity(name: string, label: string, flag: number, referentName: string, referentMail: string) {
    return this.http.post<Community>(`${this.communityRoute}`, { name, label, flag, referentName, referentMail });
  }

  updateCommunity(communityId: string, name: string, referentName: string, referentMail: string) {
    return this.http.put<Community>(`${this.communityRoute}/${communityId}`, { name, referentName, referentMail });
  }

  listReviewersByCommunityName(communityName: string, isSenior = false) {
    return this.http.get<User[]>(`${this.communityRoute}?name=${encodeURIComponent(communityName)}&reviewers=1${isSenior ? '&type=senior': ''}`);
  }

  listReferentsByCommunityId(communityId?: string) {
    return this.http.get<User[]>(`${this.communityRoute}/${communityId}/referents`);
  }

  copyAppFormAsDraft(communityId: string, formType: string, isSenior = false) {
    let option = {};
    switch(formType) {
      case 'new':
        option = { newFormDraft: 'copy' };
        break;
      case 'renew':
        option = { renewalFormDraft: 'copy' };
        break;
    }
    return this.http.put<Community>(`${this.communityRoute}/${communityId}${isSenior ? '?type=senior': ''}`, option);
  }

  createAppFormDraftFromCanvas(communityId: string, formType: string, isSenior = false) {
    let option = {};
    switch(formType) {
      case 'new':
        option = { newFormDraft: 'canvas' };
        break;
      case 'renew':
        option = { renewalFormDraft: 'canvas' };
        break;
    }

    return this.http.put<Community>(`${this.communityRoute}/${communityId}${isSenior ? '?type=senior': ''}`, option);
  }

  createRenewalAppFormDraftFromNewTemplate(communityId: string, isSenior = false) {
    const option: any = { renewalFormDraft: 'new' };

    return this.http.put<Community>(`${this.communityRoute}/${communityId}${isSenior ? '?type=senior': ''}`, option);
  }

  createAppFormDraftFromPreviousTemplate(communityId: string, formType: string, isSenior = false) {
    let option = {};
    switch(formType) {
      case 'new':
        option = { newFormDraft: 'previous' };
        break;
      case 'renew':
        option = { renewalFormDraft: 'previous' };
        break;
    }

    return this.http.put<Community>(`${this.communityRoute}/${communityId}${isSenior ? '?type=senior': ''}`, option);
  }

  updateAppFormDraft(communityId: string, formType: string, form: any, isSenior = false) {
    let option = {};
    switch(formType) {
      case 'new':
        option = { newFormDraft: form };
        break;
      case 'renew':
        option = { renewalFormDraft: form };
        break;
    }

    return this.http.put<Community>(`${this.communityRoute}/${communityId}${isSenior ? '?type=senior': ''}`, option);
  }

  publishAppFormDraft(communitiesGroup: string, communityId: string, formType: string, notifyUsers?: string, isSenior = false) {
    let reqBody: any = {};
    switch(formType) {
      case 'new':
        reqBody = { newFormDraft: 'publish' };
        break;
      case 'renew':
        reqBody = { renewalFormDraft: 'publish' };
        break;
    }

    if (notifyUsers) {
      reqBody['notifyUsers'] = notifyUsers;
    }

    return this.http.put<any>(`${this.communityRoute}/${communityId}?group=${communitiesGroup}${isSenior ? '&type=senior': ''}`, reqBody);
  }

  deleteAppFormDraft(communityId: string, formType: string, isSenior = false) {
    let option = {};
    switch(formType) {
      case 'new':
        option = { newFormDraft: 'delete' };
        break;
      case 'renew':
        option = { renewalFormDraft: 'delete' };
        break;
    }

    return this.http.put<Community>(`${this.communityRoute}/${communityId}${isSenior ? '?type=senior': ''}`, option);
  }

  restoreAppForm(communityId: string, formType: string, isSenior = false) {
    let option = {};
    switch(formType) {
      case 'new':
        option = { newFormBackup: 1 };
        break;
      case 'renew':
        option = { renewalFormBackup: 1 };
        break;
    }

    return this.http.put<Community>(`${this.communityRoute}/${communityId}${isSenior ? '?type=senior': ''}`, option);
  }
}
