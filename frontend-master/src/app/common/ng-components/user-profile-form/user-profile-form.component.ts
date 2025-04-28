import { Component, Input } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { createMask } from '@ngneat/input-mask';

@Component({
  selector: 'app-user-profile-form',
  templateUrl: './user-profile-form.component.html',
  styles: [`
    .form-group .input-group .input-group-addon {
      width:36px;
    }
    .form-group .input-group .input-group-addon i {
      margin: 0 auto;
    }
  `]
})
export class UserProfileFormComponent {
  @Input() profileHasError!: boolean;
  @Input() profileForm!: FormGroup;

  dateMask = createMask({alias: 'datetime', inputFormat: 'dd/mm/yyyy'});
  cuidMask = createMask('aaaa9999');

  get profileFormDirectoryUrl() {
    return this.profileForm.get('directoryUrl') as FormControl;
  }

  get profileFormFirstname() {
    return this.profileForm.get('firstname') as FormControl;
  }

  get profileFormLastname() {
    return this.profileForm.get('lastname') as FormControl;
  }

  get profileFormBirthday() {
    return this.profileForm.get('birthday') as FormControl;
  }

  get profileFormCuid() {
    return this.profileForm.get('cuid') as FormControl;
  }

  get profileFormPhone() {
    return this.profileForm.get('phone') as FormControl;
  }

  get profileFormClassification() {
    return this.profileForm.get('classification') as FormControl;
  }

  get profileFormEntity() {
    return this.profileForm.get('entity') as FormControl;
  }

  get profileFormCountry() {
    return this.profileForm.get('country') as FormControl;
  }

  get profileFormLocation() {
    return this.profileForm.get('location') as FormControl;
  }

  get profileFormManagerFirstname() {
    return this.profileForm.get('managerFirstname') as FormControl;
  }

  get profileFormManagerLastname() {
    return this.profileForm.get('managerLastname') as FormControl;
  }

  get profileFormManagerEmail() {
    return this.profileForm.get('managerEmail') as FormControl;
  }


  get profileFormHrFirstname() {
    return this.profileForm.get('hrFirstname') as FormControl;
  }

  get profileFormHrLastname() {
    return this.profileForm.get('hrLastname') as FormControl;
  }

  get profileFormHrEmail() {
    return this.profileForm.get('hrEmail') as FormControl;
  }
}
