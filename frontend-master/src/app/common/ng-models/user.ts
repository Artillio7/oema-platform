export interface ApplicationSchema {
  _id: string;
  community: string;
  communityId: string;
  formType: string;
  status: string;
  year: number;
  submittedAt: any;
  info: string;
  formId: string;
}

export interface User {
  _id: string;
  email: string;
  cuid?: string;
  role: string;
  referent?: number,
  reviewer?: any;
  account: string;
  photo?: string,
  firstname?: string;
  lastname?: string;
  gender?: string;
  birthday?: string;
  phone?: string;
  classification?: string;
  entity?: string;
  location?: string;
  country?: string;
  managerFirstname?: string;
  managerLastname?: string;
  managerEmail?: string;
  hrFirstname?: string;
  hrLastname?: string;
  hrEmail?: string;
  directoryUrl?: string;
  community: string;
  communityId?: string;
  history: ApplicationSchema[];
  acceptPolicy: boolean;
  lastLogin: any;
  createdAt: any;
}

export interface PaginatedUsers {
  recordsTotal: number;
  recordsFiltered: number;
  users: User[];
}

export const FAKE_SENIOR_ORANGE_EXPERTS_FLAG = 65280;
