export const ROUTES = Object.freeze({ today: 'Dia atual', hours: 'Adicionar horas', month: 'Mês', total: 'Total a receber', profile: 'Perfil' });
export const WORK_DAYS = Object.freeze([
  ['monday', 'Segunda-feira'], ['tuesday', 'Terça-feira'], ['wednesday', 'Quarta-feira'], ['thursday', 'Quinta-feira'], ['friday', 'Sexta-feira'], ['saturday', 'Sábado'], ['sunday', 'Domingo']
]);
export const CLOSING_STRATEGIES = Object.freeze(['last-day-of-month', 'first-day-next-month']);
export const PRIMARY_EMPLOYEE_KEY = 'primaryEmployeeId';
export const DEFAULT_MONTHLY_WORKLOAD = 220;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
