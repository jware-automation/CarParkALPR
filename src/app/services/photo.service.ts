import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { OpenALPR, OpenALPROptions, OpenALPRResult } from '@awesome-cordova-plugins/openalpr/ngx';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: UserPhoto[] = [];

  constructor(private openALPR: OpenALPR) { }

  public async addNewToGallery() {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    let res = '';

    this.openALPR.scan(capturedPhoto.dataUrl, {
      country: this.openALPR.Country.EU,
      amount: 3
    }).then((result: [OpenALPRResult]) => {

      res = "Success";

      this.photos.unshift({
        filepath: "soon...",
        webviewPath: capturedPhoto.webPath!,
        detectionResult: res!,
        resultsArray: result.length!
      });
    })
      .catch(error => {

        res = "Failed";

        this.photos.unshift({
          filepath: "soon...",
          webviewPath: capturedPhoto.webPath!,
          detectionResult: res!
        });
        
      });
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  detectionResult?: string;
  resultsArray?: number;
}