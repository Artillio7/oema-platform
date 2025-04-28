import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';

@Injectable()
export class FormValidationService {

  onlyEmailOrangeValidator(control: AbstractControl): { [key: string]: any } | null {
    // W3C compliant regex
    const emailRegexp = /^[a-z0-9.!#$%&’*+/=?^_`{|}~-]+@orange.com/;
    return control.value && !emailRegexp.test(control.value) ?
      { invalidEmail: true } : null;
  }

  excludeExternEmailValidator(control: AbstractControl): { [key: string]: any } | null {
    // RFC 2822 compliant regex
    const emailRegexp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

    // exclude extern email address
    // The Orange Expert programme is restricted to internal employees.
    const excludeExtOrangeAddr = /^((?!\.ext@).)*$/;

    if (control.value) {
      if (!emailRegexp.test(control.value))
        return { invalidEmail: true };
      if (!excludeExtOrangeAddr.test(control.value))
        return { externEmail: true };
    }

    return null;
  }

  emailValidator(control: AbstractControl): { [key: string]: any } | null {
    // RFC 2822 compliant regex
    const emailRegexp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

    return control.value && !emailRegexp.test(control.value) ?
      { invalidEmail: true } : null;
  }

  phoneValidator(control: AbstractControl): { [key: string]: any } | null {
    const phoneRegexp = /^(?:(?:\(?(?:00|\+)([1-4]\d\d|[1-9]\d?)\)?)?[\-\.\ \\\/]?)?((?:\(?\d{1,}\)?[\-\.\ \\\/]?){0,})(?:[\-\.\ \\\/]?(?:#)[\-\.\ \\\/]?(\d+))?$/;

    return control.value && !phoneRegexp.test(control.value) ?
      { invalidPhoneNumber: true } : null;
  }

  urlValidator(control: AbstractControl): { [key: string]: any } | null {
    const urlRegexp = /(http:\/\/|https:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;%=.]+$/gm;

    return control.value && !urlRegexp.test(control.value) ?
      { invalidUrl: true } : null;
  }

  birthdayValidator(control: AbstractControl): { [key: string]: any } | null {
    const birthRegexp = /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;

    return control.value && !birthRegexp.test(control.value) ?
      { invalidBirthday: true } : null;
  }

  cuidValidator(control: AbstractControl): { [key: string]: any } | null {
    const cuidRegexp = /^[a-zA-Z]{4}[0-9]{4}$/;

    return control.value && !cuidRegexp.test(control.value) ?
      { invalidCuid: true } : null;
  }

  passwordValidator(control: AbstractControl): { [key: string]: any } | null {
    const passwdRegexp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!"#$%&'()*+.\/:;<=>?@\[\\\]^_`{|}~-]).{8,}$/;
    return !control.value || !passwdRegexp.test(control.value) ?
      { invalidPassword: true } : null;
  }

  newPasswordValidator(control: AbstractControl): { [key: string]: any } | null {
    const passwdRegexp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!"#$%&'()*+.\/:;<=>?@\[\\\]^_`{|}~-]).{8,}$/;
    return control.value && !passwdRegexp.test(control.value) ?
      { invalidPassword: true } : null;
  }

  matchingPasswords(passwordKey: string, passwordConfirmationKey: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get(passwordKey);
      const passwordConfirmation = control.get(passwordConfirmationKey);
      return password && passwordConfirmation && password.value !== passwordConfirmation.value ?
        { mismatchedPasswords: true } : null;
    };
  }

  numberValidator(control: AbstractControl): { [key: string]: any } | null {
    const onlyNumberRegexp = /.*[^0-9].*/;
    return control.value && onlyNumberRegexp.test(control.value) ?
      { invalidNumber: true } : null;
  }

  isThisEmailValidator(email: string) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      return control.value && control.value !== email ?
        { invalidUserEmail: true } : null;
    };
  }

  deleteAccountConfirmationValidator(value: string) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      return control.value !== value ?
        { invalidConfirmMsg: true } : null;
    };
  }

  atLeastOneValidator(keys: string[]) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      return keys.some(key => control.get(key)?.value)
        ? null
        : { atLeastOneRequired: true };
    };
  }
}
