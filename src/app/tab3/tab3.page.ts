import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { VideoService } from '../services/video.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
})
export class Tab3Page implements AfterViewInit {
  @ViewChild('videoFeed', { static: false }) videoFeed!: ElementRef<HTMLVideoElement>;
  detectedPlate: string | null = null;
  scanningInProgress = false;

  constructor(public videoService: VideoService) {}

  ngAfterViewInit() {
    this.startScanner();
  }

  async startScanner() {
    this.scanningInProgress = true;
    const videoStream = await this.videoService.startVideoStream(this.videoFeed.nativeElement);
    
    if (videoStream) {
      this.detectedPlate = await this.videoService.scanVideoStream(this.videoFeed.nativeElement);
      this.scanningInProgress = false;
    } else {
      this.scanningInProgress = false;
      this.detectedPlate = null;
    }
  }
}
