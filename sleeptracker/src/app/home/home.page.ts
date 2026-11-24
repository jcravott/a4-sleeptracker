import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular';
import { IonHeader, IonToolbar, IonContent, IonFooter, IonButton, IonIcon, IonDatetime, IonDatetimeButton, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline, timeOutline, arrowForwardOutline, addOutline, trashOutline, createOutline, closeOutline, checkmarkCircleOutline, settingsOutline } from 'ionicons/icons';
import { SleepService, SleepRecord } from '../services/sleep.service';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';
import { localDateTime, overnightError, sleepinessError } from '../services/sleep-validation';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonContent, IonFooter, IonButton, IonIcon, IonDatetime, IonDatetimeButton, IonModal],
})
export class HomePage {
  section: 'sleep' | 'sleepiness' | 'history' = 'sleep';
  filter = 'all';
  bedtime = '';
  wakeTime = '';
  checkTime = '';
  rating: number | null = null;
  editingId: string | null = null;
  error = '';
  maxDate = localDateTime(new Date());
  readonly scale = StanfordSleepinessData.ScaleValues.slice(1);
  readonly scaleLabels = ['Wide awake', 'Focused', 'Relaxed', 'A little foggy', 'Slowing down', 'Fighting sleep', 'Ready to drift off'];

  constructor(public sleepService: SleepService, private alerts: AlertController, private toasts: ToastController) {
    addIcons({ moonOutline, sunnyOutline, timeOutline, arrowForwardOutline, addOutline, trashOutline, createOutline, closeOutline, checkmarkCircleOutline, settingsOutline });
    this.reset();
  }

  get nights() { return this.sleepService.overnight; }
  get latest() { return this.nights[0]; }
  get average() {
    return this.nights.length ? Math.round(this.nights.reduce((sum, night) => sum + night.durationMinutes, 0) / this.nights.length) : 0;
  }
  get recent() { return this.nights.slice(0, 7).reverse(); }
  get history() {
    return [...this.sleepService.records]
      .filter(record => this.filter === 'all' || (this.filter === 'sleep') === this.isNight(record))
      .sort((a, b) => this.recordDate(b).getTime() - this.recordDate(a).getTime());
  }
  get duration() { return Math.round((new Date(this.wakeTime).getTime() - new Date(this.bedtime).getTime()) / 60000); }
  get previewError() { return overnightError(new Date(this.bedtime), new Date(this.wakeTime)); }
  get allSleepData() { return this.sleepService.records; }

  isNight(record: SleepRecord): record is OvernightSleepData { return record instanceof OvernightSleepData; }
  recordDate(record: SleepRecord) { return this.isNight(record) ? record.sleepEnd : record.loggedAt; }
  durationLabel(minutes: number) {
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
  barHeight(night: OvernightSleepData) { return Math.max(5, night.durationMinutes / 1440 * 100); }
  navigate(section: 'sleep' | 'sleepiness' | 'history') {
    this.section = section;
    this.reset();
  }
  reset() {
    const end = new Date();
    end.setHours(8, 0, 0, 0);
    if (end > new Date()) end.setDate(end.getDate() - 1);
    this.wakeTime = localDateTime(end);
    this.bedtime = localDateTime(new Date(end.getTime() - 8 * 3600000));
    this.checkTime = localDateTime(new Date());
    this.maxDate = localDateTime(new Date());
    this.rating = null;
    this.editingId = null;
    this.error = '';
  }
  async save() {
    this.error = this.section === 'sleep'
      ? overnightError(new Date(this.bedtime), new Date(this.wakeTime))
      : sleepinessError(this.rating ?? 0, new Date(this.checkTime));
    if (this.error) return;
    const record = this.section === 'sleep'
      ? new OvernightSleepData(new Date(this.bedtime), new Date(this.wakeTime))
      : new StanfordSleepinessData(this.rating!, new Date(this.checkTime));
    const edited = this.editingId !== null;
    if (this.editingId) record.id = this.editingId;
    try {
      this.sleepService.save(record);
      this.reset();
      await this.notify(edited ? 'Entry updated.' : 'Entry saved.');
    } catch (error) { this.error = (error as Error).message; }
  }
  edit(record: SleepRecord) {
    this.reset();
    this.editingId = record.id;
    if (this.isNight(record)) {
      this.section = 'sleep';
      this.bedtime = localDateTime(record.sleepStart);
      this.wakeTime = localDateTime(record.sleepEnd);
    } else {
      this.section = 'sleepiness';
      this.rating = record.loggedValue;
      this.checkTime = localDateTime(record.loggedAt);
    }
  }
  cancelEdit() { this.reset(); this.section = 'history'; }
  updateDeleteConfirmation(event: Event) {
    const input = event.target as HTMLInputElement;
    try {
      this.sleepService.setAskBeforeDeleting(input.checked);
    } catch (error) {
      input.checked = this.sleepService.askBeforeDeleting;
      this.error = (error as Error).message;
    }
  }
  async remove(record: SleepRecord) {
    if (!this.sleepService.askBeforeDeleting) {
      await this.deleteRecord(record);
      return;
    }
    const alert = await this.alerts.create({
      cssClass: 'delete-confirmation',
      header: 'Delete this entry?',
      message: 'You can undo immediately after deleting.',
      inputs: [{ type: 'checkbox', label: "Don't ask me again", value: 'skip-confirmation', checked: false }],
      buttons: [{ text: 'Keep entry', role: 'cancel' }, { text: 'Delete', role: 'destructive' }]
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss<{ values?: string[] }>();
    if (role !== 'destructive') return;
    try {
      if (data?.values?.includes('skip-confirmation')) this.sleepService.setAskBeforeDeleting(false);
      await this.deleteRecord(record);
    } catch (error) { this.error = (error as Error).message; }
  }
  private async deleteRecord(record: SleepRecord) {
    try {
      this.sleepService.delete(record.id);
      const toast = await this.toasts.create({
        message: 'Entry deleted.', duration: 7000, position: 'top',
        buttons: [{ text: 'Undo', handler: () => {
          try { this.sleepService.save(record); }
          catch (error) { this.error = (error as Error).message; }
        } }]
      });
      await toast.present();
    } catch (error) { this.error = (error as Error).message; }
  }
  private async notify(message: string) {
    const toast = await this.toasts.create({ message, duration: 2600, position: 'top', icon: 'checkmark-circle-outline' });
    await toast.present();
  }
}
