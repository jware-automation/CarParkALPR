import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';

let stream: MediaStream;

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'openalpr-scanner',
    templateUrl: './openalpr-scanner.component.html',
    styleUrls: ['./openalpr-scanner.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class OpenALPRScanner implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('preview', { static: false }) previewElemRef: ElementRef;

  @Input() autofocusEnabled = true;
  @Input() device: MediaDeviceInfo;
  @Input() openalprsecret: string;
  @Input() openalprcountry: string = 'eu';
  @Input() openalprstate: string = 'fr';

  @Input()
  set disable(disable: any) {
    if (disable) {
      this.disableCamera();
    }
  }

  @Output() camerasFound = new EventEmitter<MediaDeviceInfo[]>();
  @Output() permissionResponse = new EventEmitter<boolean>();
  @Output() hasDevices = new EventEmitter<boolean>();
  @Output() camerasNotFound = new EventEmitter<any>();

  @Output() licencePlate = new EventEmitter<any>();
  @Output() inProgress = new EventEmitter<any>();

  public hasNavigator: boolean;
  public isMediaDevicesSuported: boolean;
  public hasPermission: boolean;
  public isEnumerateDevicesSuported: boolean;
  public videoInputDevices: MediaDeviceInfo[];
  public videoInputDevice: MediaDeviceInfo;
  public active: boolean;
  public error: boolean

  constructor() {
    this.hasNavigator = typeof navigator !== 'undefined';
    this.isMediaDevicesSuported = this.hasNavigator && !!navigator.mediaDevices;
    this.isEnumerateDevicesSuported = !!(this.isMediaDevicesSuported && navigator.mediaDevices.enumerateDevices);
  }

  public setPermission(hasPermission: boolean | null) {
    this.hasPermission = hasPermission;
    this.permissionResponse.next(hasPermission);

    return this.permissionResponse;
  }

  async changeDevice(device: MediaDeviceInfo) {
    if (!device) {
      return false;
    }

    stream.getTracks().forEach(function (track) { track.stop(); });
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { deviceId: { exact: device.deviceId }}});

    this.previewElemRef.nativeElement.srcObject = stream;
  }

  public handlePermissionException(err: DOMException) : any {
    let permission: boolean;

    switch (err.name) {
      case 'NotSupportedError':
        console.warn('openalpr-scanner', err.message);
        // could not claim
        permission = null;
        // can't check devices
        this._hasDevices = null;
        break;

      // user denied permission
      case 'NotAllowedError':
        console.warn('openalpr-scanner', err.message);
        // claimed and denied permission
        permission = false;
        // this means that input devices exists
        this._hasDevices = true;
        break;

      // the device has no attached input devices
      case 'NotFoundError':
        console.warn('openalpr-scanner', err.message);
        // no permissions claimed
        permission = null;
        // because there was no devices
        this._hasDevices = false;
        // tells the listener about the error
        this.camerasNotFound.next(err);
        break;

      case 'NotReadableError':
        console.warn('openalpr-scanner', 'Couldn\'t read the device(s)\'s stream, it\'s probably in use by another app.');
        // no permissions claimed
        permission = null;
        // there are devices, which I couldn't use
        this._hasDevices = false;
        // tells the listener about the error
        this.camerasNotFound.next(err);
        break;

      default:
        console.warn('openalpr-scanner', 'I was not able to define if I have permissions for camera or not.', err);
        // unknown
        permission = null;
        // this._hasDevices = undefined;
        break;
    }
  }

  public set _hasDevices(hasDevice: boolean) {
    this.hasDevices.next(hasDevice);
  }

  async askForPermission(): Promise<boolean> {
    if (!this.hasNavigator) {
        console.error('openalpr-scanner', 'askForPermission', 'Can\'t ask permission, navigator is not present.');
        this.setPermission(null);
        return this.hasPermission;
    }

    if (!this.isMediaDevicesSuported) {
        console.error('openalpr-scanner', 'askForPermission', 'Can\'t get user media, this is not supported.');
        this.setPermission(null);
        return this.hasPermission;
    }

    try {
        // Will try to ask for permission
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    } catch (err) {
        return this.handlePermissionException(err);
    }

    let permission: boolean;

    try {
      this.previewElemRef.nativeElement.srcObject = stream;

      permission = true;
      this.setPermission(permission);
    } catch (err) {
      console.error('openalpr-scanner', 'askForPermission', err);

      permission = null;
      this.setPermission(permission);
    }

    // Returns the event emitter, so the dev can subscribe to it
    return permission;
  }

  public async enumarateVideoDevices(): Promise<MediaDeviceInfo[]> {
    if (!this.hasNavigator) {
        console.error('openalpr-scanner', 'enumarateVideoDevices', 'Can\'t enumerate devices, navigator is not present.');
        return;
    }

    if (!this.isEnumerateDevicesSuported) {
        console.error('openalpr-scanner', 'enumarateVideoDevices', 'Can\'t enumerate devices, method not supported.');
        return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();

    this.videoInputDevices = [];

    for (const device of devices) {
      const videoDevice: any = {};

      // tslint:disable-next-line:forin
      for (const key in device) {
          videoDevice[key] = device[key];
      }

      if (videoDevice.kind === 'video') {
          videoDevice.kind = 'videoinput';
      }

      if (!videoDevice.deviceId) {
          videoDevice.deviceId = (<any>videoDevice).id;
      }

      if (!videoDevice.label) {
          videoDevice.label = 'Camera (no permission 🚫)';
      }

      if (videoDevice.kind === 'videoinput') {
          this.videoInputDevices.push(videoDevice);
      }
    }

    return this.videoInputDevices;
  }

  async ngAfterViewInit(): Promise<void> {
    // Chrome 63 fix
    if (!this.previewElemRef) {
        console.warn('openalpr-scanner', 'Preview element not found!');
        return;
    }

    // iOS 11 Fix
    this.previewElemRef.nativeElement.setAttribute('autoplay', false);
    this.previewElemRef.nativeElement.setAttribute('muted', true);
    this.previewElemRef.nativeElement.setAttribute('playsinline', true);
    this.previewElemRef.nativeElement.setAttribute('autofocus', this.autofocusEnabled);

    // Asks for permission before enumerating devices so it can get all the device's info
    const hasPermission = await this.askForPermission();

    // gets and enumerates all video devices
    this.enumarateVideoDevices().then((videoInputDevices: MediaDeviceInfo[]) => {
      if (videoInputDevices && videoInputDevices.length > 0) {
          this._hasDevices = true;
          this.camerasFound.next(videoInputDevices);
      } else {
          this._hasDevices = false;
          this.camerasNotFound.next();
      }
    });

    // There's nothin' to do anymore if we don't have permissions.
    if (hasPermission !== true) {
      return;
    }
  }

  public disableCamera() {
    stream.getTracks().forEach(function (track) { track.stop(); });
  }

  public scanPlate() {
    this.inProgress.next(true);

    const video = document.querySelector('video');
    const canvas = document.querySelector('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    this.disableCamera();
    this.active = true
    this.sendOpenALPR(canvas.toDataURL().split('data:image/png;base64,')[1]);
  }

  getDeviceById(deviceId: string): MediaDeviceInfo {
    return this.videoInputDevices.find(device => device.deviceId === deviceId);
  }

  public sendOpenALPR(file: any) {
    const xmlhttp = new XMLHttpRequest();

    const requestUrl = 'https://api.openalpr.com/v2/recognize_bytes?secret_key=' + this.openalprsecret + '&recognize_vehicle=0&country=' + this.openalprcountry + '&state=' + this.openalprstate + '&return_image=0&topn=10';

    // const requestUrl = 'https://api.openalpr.com/v2/recognize_bytes?recognize_vehicle=1&state=fr&country=' + this.openalprcountry + ',&secret_key=' + this.openalprsecret + '&return_image=0&topn=10';

    xmlhttp.open('POST', requestUrl, true);

    xmlhttp.onreadystatechange = () => {
      if (xmlhttp.readyState === 4) {
          if (xmlhttp.status === 200) {
              this.inProgress.next(false);

              const result = JSON.parse(xmlhttp.responseText);

              if (result.results && result.results[0]) {
                return this.licencePlate.next(result.results[0].plate);
              }

              this.licencePlate.next('');
          } else {
            this.licencePlate.next('Error');
          }
      }
    }

    xmlhttp.send(file);
  }

  ngOnDestroy(): void {
    this.disableCamera();
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes.device) {
        if (this.device) {
            this.changeDevice(this.device);
        } else {
            console.warn('openalpr-scanner', 'device', 'Unselected device.');
        }
    }
  }
}
