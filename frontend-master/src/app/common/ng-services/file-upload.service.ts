import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface RespMsg {
  success: boolean;
  message: string;
}

@Injectable()
export class FileUploadService {
  private uploadRoute = '/api/upload';

  constructor(private http: HttpClient) { }

  checkFile(filename: string) {
    return this.http.get<{ success: boolean }>(`${this.uploadRoute}/${filename}?exists=1`);
  }

  getFile(userId: string, filename: string) {
    const options = { responseType: 'blob' as const, };
    return this.http.get(`${this.uploadRoute}/${userId}/${filename}`, options);
  }

  deleteFile(userId: string, filename: string) {
    return this.http.delete<RespMsg>(`${this.uploadRoute}/${userId}/${filename}`);
  }

  uploadFile(formData: FormData) {
    return this.http.post<RespMsg>(this.uploadRoute, formData);
  }

  downloadS3File(userId: string, filename: string) {
    const options = { responseType: 'blob' as const, };
    return this.http.get(`${this.uploadRoute}/aws?user=${userId}&file=${filename}`, options);
  }

  uploadS3File(formData: FormData) {
    return this.http.post<RespMsg>(`${this.uploadRoute}/aws`, formData);
  }

  deleteS3File(userId: string, filename: string) {
    return this.http.delete<RespMsg>(`${this.uploadRoute}/aws?user=${userId}&file=${filename}`);
  }
}
