import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface RespMsg {
  success: boolean;
  message: string;
}

@Injectable()
export class ContactService {
  private contactRoute = '/api/contact';

  constructor(private http: HttpClient) { }

  contactAdmin(communitiesGroup: string, message: string) {
    return this.http.post<RespMsg>(`${this.contactRoute}?group=${communitiesGroup}`, { message });
  }

  contactUsers(
    recipients: string[],
    from: string,
    ccemails: string[],
    bccemails: string[],
    subject: string,
    message: string
  ) {
    return this.http.post<RespMsg>(`${this.contactRoute}/users`, { recipients, from, ccemails, bccemails, subject, message });
  }
}
