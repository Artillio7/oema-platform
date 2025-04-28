import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { saveAs } from 'file-saver';

import { FileUploadService } from '../../ng-services/file-upload.service';

import { FormElementType, WizardStep } from '../../ng-models/community';
import { User } from '../../ng-models/user';

@Component({
  selector: 'app-application-form-viewer',
  templateUrl: './application-form-viewer.component.html',
  styleUrls: ['./application-form-viewer.component.scss']
})
export class ApplicationFormViewerComponent implements OnInit {
  @Input() steps!: WizardStep[];
  @Input() userAnsweredForm: any;
  @Input() user!: User;
  @Input() communityId!: string;
  @Input() formId?: string;
  @Input() isSeniorExpert!: boolean;
  @Input() isPhantomatic = false;
  @Output() msgAlert = new EventEmitter<any>();

  FormElementType = FormElementType;

  userPhotoSrc: any = 'assets/img/avatars/profile.png';

  constructor(private fileUploadService: FileUploadService, private sanitizer : DomSanitizer) { }

  ngOnInit() {
    if (this.user.photo && !this.isPhantomatic) {
      // Don't get user photo if the form is requested for pdf export (using puppeteer)
      this.fileUploadService.getFile(this.user._id, `${this.user._id}-profile-photo`)
        .subscribe({
          next: (resp: Blob) => {
            this.userPhotoSrc = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(new Blob([resp])));
          },
          error: error => {
            console.error(error);
          }
      });
    }
  }

  viewFile(filename: string) {
    if (this.formId) {
      this.fileUploadService.getFile(this.user._id, (this.isSeniorExpert ? 'Senior-' : '') + this.communityId + '-' + this.formId + '-' + filename)
        .subscribe({
          next: (resp: Blob) => {
            saveAs(new Blob([resp], { type: 'application/pdf' }), filename);
          },
          error: error => {
            this.msgAlert.emit({ type: 'danger', message: error });
            console.log(error);
          }
      });
    }
  }

  getS3File(filename: string) {
    if (this.formId) {
      this.fileUploadService
        .downloadS3File(this.user._id, (this.isSeniorExpert ? 'Senior-' : '') + this.communityId + '-' + this.formId + '-' + filename)
        .subscribe({
          next: (data) => {
          saveAs(new Blob([data]), filename);
          },
          error: error => {
            this.msgAlert.emit({ type: 'danger', message: error });
            console.log(error);
          }
      });
    }
  }
}
