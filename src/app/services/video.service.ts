import { Injectable } from '@angular/core';
import { OpenALPR, OpenALPRResult } from '@awesome-cordova-plugins/openalpr/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private videoStream: MediaStream | null = null;

  constructor(private platform: Platform, private openALPR: OpenALPR) {}

  async startVideoStream(videoElement: HTMLVideoElement): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoElement.srcObject = stream;
      this.videoStream = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing the camera', error);
      return null;
    }
  }

  async scanVideoStream(): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      const captureFrame = async () => {
        if (!this.videoStream) return;

        const canvas = document.createElement('canvas');
        canvas.width = 640; // Set width and height based on video stream
        canvas.height = 480;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(canvas, 0, 0, canvas.width, canvas.height);

      var capturedPhoto = canvas.toDataURL('image/png');
      const base64Data = await this.readAsBase64(capturedPhoto);

        
        if (this.platform.is('cordova')) {
          // Use OpenALPR if running on Cordova
          try {
            const result: [OpenALPRResult] = await this.openALPR.scan(base64Data, {
              country: this.openALPR.Country.US,
              amount: 3,
            });
            if (result.length > 0) {
              resolve(result[0].number!); // Resolve with detected plate
            } else {
              requestAnimationFrame(captureFrame); // Continue scanning if no result
            }
          } catch (error) {
            console.error('ALPR scan failed', error);
            resolve(null); // Handle failure
          }
        } else {
          // Mock results for web browser
          console.log('Cordova not available, using mock result');
          //genarate random number between 0 and 5 , if it 3 then resolve with plate number otherwise continue scanning
          if (Math.floor(Math.random() * 6) !== 3) {
            requestAnimationFrame(captureFrame); // Continue scanning
          } else {
            setTimeout(() => {
              resolve('MOCK123'); // Mock plate number
          }, 5000); // Simulate a delay for scanning
        }

        }
      };
      
      captureFrame();
    });
  }
  private async readAsBase64(photo: string): Promise<string> {
    const response = await fetch(photo);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
    
  }

  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

