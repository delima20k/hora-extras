import { parseSalary } from '../utils/validators.js';

export class ProfileController {
  constructor({ profileRepository, imageService, onSaved }) { this.profileRepository = profileRepository; this.imageService = imageService; this.onSaved = onSaved; this.pendingAvatar = undefined; this.previewUrl = null; }
  async handleFile(file, image, status) {
    try {
      if (!file) return;
      const blob = await this.imageService.process(file); this.pendingAvatar = blob;
      this.imageService.revokePreview(this.previewUrl); this.previewUrl = this.imageService.createPreview(blob); image.src = this.previewUrl; status.textContent = 'Imagem pronta para salvar.'; status.className = 'form-status success';
    } catch (error) { status.textContent = error.message; status.className = 'form-status error'; }
  }
  async submit(values, submitButton, status) {
    if (submitButton.disabled) return;
    submitButton.disabled = true; status.textContent = 'Salvando perfil...'; status.className = 'form-status';
    try {
      const result = await this.profileRepository.saveProfileBundle({
        name: values.name, notes: values.notes, avatar: this.pendingAvatar,
        workSchedule: { workDays: values.workDays, startTime: values.startTime, endTime: values.endTime, breakDurationMinutes: values.breakDurationMinutes },
        payrollSettings: { salary: parseSalary(values.salary), payrollClosingDay: values.payrollClosingDay, invalidClosingDayStrategy: values.invalidClosingDayStrategy, monthlyWorkload: values.monthlyWorkload }
      });
      this.pendingAvatar = undefined; this.imageService.revokePreview(this.previewUrl); this.previewUrl = null; await this.onSaved(result); status.textContent = 'Perfil atualizado com sucesso.'; status.className = 'form-status success';
    } catch (error) { status.textContent = error.message || 'Não foi possível salvar o perfil.'; status.className = 'form-status error'; }
    finally { submitButton.disabled = false; }
  }
  destroy() { this.imageService.revokePreview(this.previewUrl); this.previewUrl = null; }
}
