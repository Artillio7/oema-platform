import { Component, Input, forwardRef, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-battery-levels',
  templateUrl: './battery-levels.component.html',
  styleUrls: ['./battery-levels.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BatteryLevelsComponent),
      multi: true
    }
  ]
})
export class BatteryLevelsComponent implements ControlValueAccessor {
  @Input() formElement!: Question;

  // the internal data model for form control value access
  innerBatteriesList: any = {};

  /*** ControlValueAccessor ***/
  // on form value changed
  onChecked(event: any) {
    const newExpertise: { [key: string]: any } = {};
    newExpertise[event.target.name] = event.target.value; /*example: { b-database: "battery-2" } */
    this.innerBatteriesList = Object.assign(this.innerBatteriesList, newExpertise);
    // propagate value into form control using control value accessor interface
    this.propagateChange(this.innerBatteriesList);
  }

  // get accessor
  get value(): any {
    return this.innerBatteriesList;
  }

  // set accessor including call the onchange callback
  set value(v: any) {
    if (v !== this.innerBatteriesList) {
      this.innerBatteriesList = v;
    }
  }

  // propagate changes into the custom form control
  propagateChange = (_: any) => { }
  onTouched = () => { };

  // ControlValueAccessor interface
  // writes a new value from the form model into the view or (if needed) DOM property
  writeValue(value: any) {
    this.innerBatteriesList = Object.assign(this.innerBatteriesList, value);
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
