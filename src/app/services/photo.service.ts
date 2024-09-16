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
  public openALPRResults: OpenALPRResult[] = [];

  constructor(private openALPR: OpenALPR) { }

  public async addNewToGallery() {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      quality: 100
    });

    let res = '';

    this.openALPR.scan(capturedPhoto.base64String, {
      country: this.openALPR.Country.US,
      amount: 3
    }).then((result: [OpenALPRResult]) => {

      res = "Success";

      result.sort((a, b) => {
        if (a.confidence > b.confidence) return -1;
        if (a.confidence < b.confidence) return 1;
        return 0;
      })

      this.openALPRResults.push(...result)

      this.photos.unshift({
        filepath: capturedPhoto.format,
        webviewPath: capturedPhoto.webPath!,
        detectionResult: res!,
        resultsArray: result.length!,
        plateNumber: result[0].number!,
        confidence: result[0].confidence!
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
  plateNumber?: string;
  confidence?: number;
}