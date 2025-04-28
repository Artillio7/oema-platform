import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

import { FileUploadService } from '../../../common/ng-services/file-upload.service';
import { UserService } from '../../../common/ng-services/user.service';

@Component({
  selector: 'app-form-user-photo',
  templateUrl: './user-photo-input-file.component.html',
  styleUrls: ['./user-photo-input-file.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UserPhotoInputFileComponent),
      multi: true
    }
  ]
})
export class UserPhotoInputFileComponent implements ControlValueAccessor {
  @Input() userId!: string;
  @Input() imgSrc: any = 'assets/img/avatars/profile.png';
  @Input() formControl!: FormControl;
  @Input() profileHasError!: boolean;

  fileStatus = false;
  statusMessage = '';

  // the internal data model for form control value access
  private innerFileNameValue: any = '';

  constructor(
    private sanitizer : DomSanitizer,
    private fileUploadService: FileUploadService,
    private userService: UserService
  ) { }

  fileChange(input: HTMLInputElement) {
    if (input.files?.length) {
      if (input.files[0].type.startsWith('image/')) {
        this.fileStatus = true;
        this.statusMessage = '<i class="fa fa-spinner fa-pulse fa-fw"></i>';

        // Rename and upload the file
        const filename = `${this.userId}-profile-photo`;
        const formData = new FormData();
        formData.append('filefield', input.files[0], filename);
        this.fileUploadService.uploadFile(formData).subscribe({
          next: result => {
            this.fileStatus = false;
            this.statusMessage = '';

            this.userService.hasUploadedPhoto(this.userId).subscribe();
            this.imgSrc = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(input.files![0]));
            this.onChange(filename);
          },
          error: error => {
            this.fileStatus = true;
            this.statusMessage = 'Upload error!';
          }
        });

      } else {
        this.fileStatus = true;
        this.statusMessage = 'Only image!';
      }

    }
  }

  /*** ControlValueAccessor ***/
  // on form value changed
  onChange(newValue: any) {
    // set changed value
    this.innerFileNameValue = newValue;
    // propagate value into form control using control value accessor interface
    this.propagateChange(this.innerFileNameValue);
  }

  // get accessor
  get value(): any {
    return this.innerFileNameValue;
  }

  // set accessor including call the onchange callback
  set value(v: any) {
    if (v !== this.innerFileNameValue) {
      this.innerFileNameValue = v;
    }
  }

  // propagate changes into the custom form control
  propagateChange = (_: any) => { }
  onTouched = () => { };

  // ControlValueAccessor interface
  // writes a new value from the form model into the view or (if needed) DOM property
  writeValue(value: any) {
    this.innerFileNameValue = value;
  }

  // ControlValueAccessor interface
  // registers a handler that should be called when something in the view has changed
  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  // ControlValueAccessor interface
  // registers a handler specifically for when the form control receives a touch event
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }
}
