import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenALPRScanner } from './openalpr-scanner.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule
    ],
    declarations: [ OpenALPRScanner ],
    exports: [ OpenALPRScanner ],
})

export class OpenALPRScannerModule {
    static forRoot() {
        return {
            ngModule: OpenALPRScannerModule
        };
    }
}
