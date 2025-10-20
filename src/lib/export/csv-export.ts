/**
 * CSV Export Utilities
 */

export interface ExportCustomer {
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  lastBookingDate: string | null;
  status: string;
  joinedDate: string;
}

export interface ExportVehicle {
  registration: string;
  make: string;
  model: string;
  year: number;
  ownerName: string;
  totalBookings: number;
  lastBookingDate: string | null;
  motStatus: string;
  lastMotDate: string | null;
}

/**
 * Escape CSV field values
 */
function escapeCSVField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }

  const stringField = String(field);

  // If field contains comma, newline, or double quote, wrap in quotes and escape quotes
  if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  headers: (keyof T)[]
): string {
  if (data.length === 0) {
    return '';
  }

  // Create header row
  const headerRow = headers.map(h => escapeCSVField(String(h))).join(',');

  // Create data rows
  const dataRows = data.map(row =>
    headers.map(header => escapeCSVField(row[header])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Export customers to CSV
 */
export function exportCustomersToCSV(customers: ExportCustomer[]): void {
  const headers: (keyof ExportCustomer)[] = [
    'name',
    'email',
    'phone',
    'totalBookings',
    'lastBookingDate',
    'status',
    'joinedDate',
  ];

  const csv = arrayToCSV(customers, headers);
  downloadCSV(csv, 'customers');
}

/**
 * Export vehicles to CSV
 */
export function exportVehiclesToCSV(vehicles: ExportVehicle[]): void {
  const headers: (keyof ExportVehicle)[] = [
    'registration',
    'make',
    'model',
    'year',
    'ownerName',
    'totalBookings',
    'lastBookingDate',
    'motStatus',
    'lastMotDate',
  ];

  const csv = arrayToCSV(vehicles, headers);
  downloadCSV(csv, 'vehicles');
}

/**
 * Download CSV file
 */
function downloadCSV(csv: string, filename: string): void {
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_export_${date}.csv`;

  // Create blob
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Create temporary URL
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  // Set link attributes
  link.setAttribute('href', url);
  link.setAttribute('download', fullFilename);
  link.style.visibility = 'hidden';

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up URL
  URL.revokeObjectURL(url);
}

/**
 * Export selected items to CSV
 */
export function exportSelectedToCSV<T extends Record<string, any>>(
  items: T[],
  headers: (keyof T)[],
  filename: string
): void {
  const csv = arrayToCSV(items, headers);
  downloadCSV(csv, filename);
}

