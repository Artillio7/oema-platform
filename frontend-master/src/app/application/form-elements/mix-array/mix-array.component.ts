import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FormElementType, Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-mix-array',
  templateUrl: './mix-array.component.html'
})
export class MixArrayComponent {
  @Input() formElement!: Question;
  @Input() maForm!: FormGroup;

  FormElementType = FormElementType;
}
