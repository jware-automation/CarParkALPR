import { Injectable } from '@angular/core';
import { PlateData } from '../models/plate-data.model';
// import { Geolocation } from '@awesome-cordova-plugins/geolocation/ngx';

@Injectable({
  providedIn: 'root'
})
export class PlateDataService {
  private plates: PlateData[] = [];

  // constructor(private geolocation: Geolocation) {}

  // Method to save detected plate information
  async savePlateData(numberPlate: string, image: string) {
    // Get current location
    // const position = await this.getCurrentLocation();

    const state = 'Nowhere'; // This can later be replaced with dynamic data
    // const location = position ? `${position.lat}, ${position.lng}` : 'Location unavailable';
    const location = "Location unavailable";

    const newPlateData = new PlateData(numberPlate, image, location, state);
    this.plates.push(newPlateData);
    console.log('Plate data saved:', newPlateData);
  }

  // Method to get all saved plates
  getSavedPlates(): PlateData[] {
    return this.plates;
  }

  // Method to get the current location using GPS
  // private async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  //   try {
  //     const position = await this.geolocation.getCurrentPosition();
  //     const lat = position.coords.latitude;
  //     const lng = position.coords.longitude;
  //     return { lat, lng };
  //   } catch (error) {
  //     console.error('Error getting location', error);
  //     return null;
  //   }
  // }
}
