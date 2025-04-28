import { Directive, HostListener } from '@angular/core';

/**
 * Allows the user menu to be toggled via click on <a>.
 */
@Directive({
  selector: '[appEnableAnchor]'
})
export class EnableAnchorDirective {
  @HostListener('click', ['$event'])
  toggleOpen($event: any) {
    $event.preventDefault();
    $event.stopPropagation();
  }
}
