import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'capitalizeName'})
export class CapitalizeNamePipe implements PipeTransform {
  transform(value: string): string {
    return value.toLowerCase().replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase());
  }
}
