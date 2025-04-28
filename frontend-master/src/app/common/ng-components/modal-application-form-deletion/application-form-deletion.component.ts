import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { FormValidationService } from '../../ng-services/form-validation.service';

@Component({
  selector: 'app-ngb-modal-application-form-deletion',
  templateUrl: './application-form-deletion.component.html'
})
export class ApplicationFormDeletionComponent implements OnInit {
  @Input() userEmail!: string;
  @Input() isUser = true;
  @Output() deleteForm = new EventEmitter<null>();

  deleteAppForm!: FormGroup;
  deleteAppFormHasError = false;

  constructor(private formBuilder: FormBuilder, private formValidationService: FormValidationService, public activeModal: NgbActiveModal) { }

  ngOnInit() {
    this.deleteAppForm = this.formBuilder.group({
      'email': ['', Validators.compose([Validators.required, this.formValidationService.isThisEmailValidator(this.userEmail)])],
      'confirm': ['',
        Validators.compose([Validators.required,
        this.formValidationService.deleteAccountConfirmationValidator(`delete ${this.isUser ? 'my' : 'the'} application`)])
      ]
    });
  }

  get deleteAppFormEmail() {
    return this.deleteAppForm.get('email') as FormControl;
  }

  get deleteAppFormConfirm() {
    return this.deleteAppForm.get('confirm') as FormControl;
  }

  onDeletingAppForm() {
    this.deleteAppFormHasError = !this.deleteAppForm.valid;

    if (!this.deleteAppFormHasError) {
      this.deleteForm.emit();
    }
  }
}
