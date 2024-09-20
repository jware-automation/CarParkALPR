import { Component, OnInit } from '@angular/core';
import { PlateDataService } from '../services/plate-data.service';
import { PlateData } from '../models/plate-data.model';
// import { Geolocation, Position } from '@capacitor/geolocation';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {
  savedPlates: PlateData[] = [];
  // public currentLocation: string = '';

  constructor(private plateDataService: PlateDataService) {}

  ngOnInit() {
    this.loadSavedPlates();
  }

  loadSavedPlates() {
    this.savedPlates = this.plateDataService.getSavedPlates();
  }
}
