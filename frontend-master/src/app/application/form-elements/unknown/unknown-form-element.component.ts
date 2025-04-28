import { Component, Input } from '@angular/core';

import { Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-unknown-element',
  template: `
  	<mark *ngIf="!formElement; else labelTemplate">Error: unknown form element!</mark>
    <ng-template #labelTemplate>
      <p [innerHTML]="formElement!.label"></p>
    </ng-template>
  `
})
export class UnknownFormElementComponent {
  @Input() formElement?: Question;
}
