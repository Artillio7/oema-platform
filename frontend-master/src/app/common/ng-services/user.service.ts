import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { map } from 'rxjs/operators';

import { ApplicationSchema, User, PaginatedUsers } from '../ng-models/user';

@Injectable()
export class UserService {
  private userRoute = '/api/users';

  constructor(private http: HttpClient) { }

  listUsers(...searches: any[]) {
    let params = new HttpParams();
    for (const search of searches) {
      if (search.id && search.operator && search.value) {
        params = params.append(`filter[${search.id}][${search.operator}]`, search.value);
      }
      if (search.limit) {
        params = params.append('limit', search.limit);
        params = params.append('skip', search.skip || 0);
      }
      if (search.sort) {
        params = params.append('sort', search.sort);
        params = params.append('order', search.order || 1);
      }
      if (search.searchValue) {
        params = params.append('search', search.searchValue);
      }
    }

    return this.http.get<PaginatedUsers>(this.userRoute, { params });
  }

  search(...searches: any[]) {
    let params = new HttpParams();
    for (const search of searches) {
      if (search.id && search.operator && search.value) {
        params = params.append(`filter[${search.id}][${search.operator}]`, search.value);
      }
    }

    return this.http.get<PaginatedUsers>(this.userRoute, { params })
      .pipe(
        map((resp: PaginatedUsers) => {
          const values = [];
          for (const user of resp.users) {
            const obj = {
              lastname: user.lastname,
              firstname: user.firstname,
              email: user.email,
              _id: user['_id']
            };
            values.push(obj);
          }
          return values;
        })
      );
  }

  getUser(userId: string) {
    return this.http.get<User>(`${this.userRoute}/${userId}`);
  }

  createUser(email: string, password: string) {
    return this.http.post<User>(this.userRoute, { email, password });
  }

  hasAcceptedPolicy(userId: string) {
    return this.http.put<User>(`${this.userRoute}/${userId}`, { acceptPolicy: true });
  }

  hasUploadedPhoto(userId: string) {
    return this.http.put<User>(`${this.userRoute}/${userId}`, { photo: `${userId}-profile-photo` });
  }

  updateUser(
    userId: string,
    account?: string,
    password?: string,
    directoryUrl?: string,
    firstname?: string,
    lastname?: string,
    gender?: string,
    birthday?: string,
    cuid?: string,
    email?: string,
    phone?: string,
    classification?: string,
    entity?: string,
    country?: string,
    location?: string,
    managerFirstname?: string,
    managerLastname?: string,
    managerEmail?: string,
    hrFirstname?: string,
    hrLastname?: string,
    hrEmail?: string
  ) {
    return this.http.put<User>(`${this.userRoute}/${userId}`,
      {
        account, password, directoryUrl, firstname, lastname, gender, birthday,
        cuid, email, phone, classification, entity, country, location,
        managerFirstname, managerLastname, managerEmail, hrFirstname, hrLastname, hrEmail
      });
  }

  deleteUser(userId: string) {
    return this.http.delete<User>(`${this.userRoute}/${userId}`);
  }

  deleteUsers(userIds: string[]) {
    return this.http.delete<User[]>(`${this.userRoute}/?ids=${userIds.join()}`);
  }

  createNewUserApplication(userId: string, community: string, communityId: string, formType: string, isSenior = false) {
    return this.http.post<ApplicationSchema[]>(`${this.userRoute}/${userId}/history${isSenior ? '?type=senior' : ''}`, { community, communityId, formType });
  }

  updateLastUserApplicationWithCommunityId(
    userId: string,
    reqCommunityId: string,
    isSenior = false,
    community?: string,
    communityId?: string,
    formType?: string,
    status?: string, info?: string) {
    return this.http.put<ApplicationSchema[]>(`${this.userRoute}/${userId}/history?community=${reqCommunityId}${isSenior ? '&type=senior' : ''}`,
      { community, communityId, formType, status, info });
  }

  updateUserAccount(userId: string, email: string, password: string, account: string) {
    return this.http.put<User>(`${this.userRoute}/${userId}`, { email, password, account });
  }

  switchUserAsReviewer(communitiesGroup: string, userId: string, role: string, community: string, isSenior = false) {
    return this.http.put<User>(`${this.userRoute}/${userId}?group=${communitiesGroup}&community=${encodeURIComponent(community)}${isSenior ? '&type=senior': ''}`,
      { role });
  }

  switchUsersAsReviewers(communitiesGroup: string, userIds: string, role: string, community: string, isSenior = false) {
    return this.http.put<any>(`${this.userRoute}?group=${communitiesGroup}&community=${encodeURIComponent(community)}&ids=${userIds}${isSenior ? '&type=senior': ''}`,
      { role });
  }

  // used for upgrading a user as a Referent in /dashboard/communities/communities.component.ts
  updateUserRole(userId: string, role: string, community: string, isSenior = false) {
    return this.http.put<User>(`${this.userRoute}/${userId}?community=${encodeURIComponent(community)}${isSenior ? '&type=senior' : ''}`, { role });
  }

  switchUsersAsReferents(userIds: string, role: string, community: string, isSenior = false) {
    return this.http.put<any>(`${this.userRoute}?community=${encodeURIComponent(community)}&ids=${userIds}${isSenior ? '&type=senior' : ''}`, { role });
  }
}
