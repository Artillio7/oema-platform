import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-input-checkboxes',
  templateUrl: './input-checkboxes.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputCheckboxesComponent),
      multi: true
    }
  ]
})
export class InputCheckboxesComponent implements ControlValueAccessor {
  @Input() formElement!: Question;

  // the internal data model for form control value access
  innerCompetencesList: any = {};

  /*** ControlValueAccessor ***/
  // on chechbox clicked
  onChecked(event: any) {
    const newExpertise: { [key: string]: any } = {};
    newExpertise[event.target.name] = event.target.checked ? 1 : 0; // /*example: { c-5g: 1 } */
    this.innerCompetencesList = Object.assign(this.innerCompetencesList, newExpertise);
    // propagate value into form control using control value accessor interface
    this.propagateChange(this.innerCompetencesList);
  }

  // get accessor
  get value(): any {
    return this.innerCompetencesList;
  }

  // set accessor including call the onchange callback
  set value(v: any) {
    if (v !== this.innerCompetencesList) {
      this.innerCompetencesList = v;
    }
  }

  // propagate changes into the custom form control
  propagateChange = (_: any) => { }
  onTouched = () => { };

  // ControlValueAccessor interface
  // writes a new value from the form model into the view or (if needed) DOM property
  writeValue(value: any) {
    this.innerCompetencesList = Object.assign(this.innerCompetencesList, value);
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
