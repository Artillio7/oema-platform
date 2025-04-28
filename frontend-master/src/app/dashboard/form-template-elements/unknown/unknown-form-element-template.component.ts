import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

import { FormElementType, Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-unknown-element-template',
  styleUrls: ['./unknown-form-element-template.component.scss'],
  templateUrl: './unknown-form-element-template.component.html'
})
export class UnknownFormElementTemplateComponent {
  @Input() formElement?: Question;
  @Input() labelFormControl!: FormControl;
  @Input() noMixArray = false;
  @Output() createFormQuestion = new EventEmitter<FormElementType>();
  @Output() cancelFormQuestion = new EventEmitter<null>();
  questionType: FormElementType = FormElementType.Unknown;

  FormElementType = FormElementType;

  cancel() {
    this.cancelFormQuestion.emit();
  }

  createFormElement() {
    this.createFormQuestion.emit(this.questionType);
  }
}
