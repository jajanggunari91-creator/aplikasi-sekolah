import { getAccessToken } from './googleAuth';
import { AttendanceRecord, Student, ClassGrade } from '../types';
import { INITIAL_STUDENTS } from '../data/initialData';

export interface DriveSpreadsheetItem {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

// Extract Spreadsheet ID from standard Google Sheets URL or raw ID
export const parseSpreadsheetId = (input: string): string => {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
};

// Helper to execute fetch with exponential backoff & jitter for multi-user concurrency safety
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      // If server returns rate limit (429) or transient Google server error (500, 502, 503, 504)
      if ([429, 500, 502, 503, 504].includes(response.status) && attempt < maxRetries - 1) {
        attempt++;
        // Exponential backoff with random jitter: (500 * 2^attempt) + random(100, 400)ms
        const delay = Math.pow(2, attempt) * 400 + Math.floor(Math.random() * 300);
        console.warn(`[Concurrency Retry] Google API status ${response.status}. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (err: any) {
      if (attempt < maxRetries - 1) {
        attempt++;
        const delay = Math.pow(2, attempt) * 400 + Math.floor(Math.random() * 300);
        console.warn(`[Network Retry] Fetch error. Retrying in ${delay}ms...`, err);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  return fetch(url, options);
};

// Helper to format Google API errors clearly
const formatGoogleError = (status: number, rawMessage?: string): string => {
  const msg = rawMessage || '';
  if (
    msg.toLowerCase().includes('insufficient authentication scopes') ||
    msg.toLowerCase().includes('insufficient scope') ||
    msg.toLowerCase().includes('insufficient permissions')
  ) {
    return 'Izin pembuatan/pengeditan Google Sheets belum disetujui pada akun Google Anda. Silakan klik tombol "Beri Izin Akses Google Sheets" untuk menyetujui akses.';
  }
  if (status === 401) {
    return 'Sesi login Google telah berakhir. Silakan login ulang.';
  }
  if (status === 403) {
    return msg || 'Akses ditolak (403). Pastikan akun Anda memiliki izin Google Sheets dan Google Drive.';
  }
  return msg || `Terjadi kesalahan pada layanan Google (${status})`;
};

// List user's spreadsheets from Google Drive
export const listSpreadsheets = async (): Promise<DriveSpreadsheetItem[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Silakan login dengan Google terlebih dahulu.');

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const response = await fetchWithRetry(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=30`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatGoogleError(response.status, errorData.error?.message));
  }

  const data = await response.json();
  return data.files || [];
};

// Get Spreadsheet metadata (sheet names, title)
export const getSpreadsheetMetadata = async (spreadsheetId: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Silakan login dengan Google terlebih dahulu.');

  const cleanId = parseSpreadsheetId(spreadsheetId);
  const response = await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatGoogleError(response.status, errorData.error?.message || `Gagal membuka spreadsheet (${response.status})`));
  }

  const data = await response.json();
  const sheetNames = (data.sheets || []).map((s: any) => s.properties?.title as string);
  return {
    id: cleanId,
    title: data.properties?.title || 'Spreadsheet Absensi',
    sheetNames,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
  };
};

// Read student data from a specific sheet in the spreadsheet
export const fetchStudentsFromSpreadsheet = async (
  spreadsheetId: string,
  sheetName: string,
  targetClass: ClassGrade
): Promise<Student[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Silakan login dengan Google terlebih dahulu.');

  const cleanId = parseSpreadsheetId(spreadsheetId);
  const encodedRange = encodeURIComponent(`${sheetName}!A1:Z100`);

  const response = await fetchWithRetry(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatGoogleError(response.status, errorData.error?.message || `Gagal membaca sheet ${sheetName}`));
  }

  const data = await response.json();
  const rows: string[][] = data.values || [];
  if (rows.length <= 1) {
    return [];
  }

  // Detect header indices
  const headerRow = rows[0].map((h) => (h || '').toString().toLowerCase().trim());
  let nisIdx = headerRow.findIndex((h) => h.includes('nis') || h.includes('nomor induk'));
  let nameIdx = headerRow.findIndex((h) => h.includes('nama') || h.includes('siswa') || h.includes('peserta didik'));
  let genderIdx = headerRow.findIndex((h) => h.includes('jk') || h.includes('gender') || h.includes('jenis kelamin') || h.includes('l/p'));

  // Fallback default column order if headers not explicitly labeled
  if (nisIdx === -1) nisIdx = 1;
  if (nameIdx === -1) nameIdx = 2;
  if (genderIdx === -1) genderIdx = 3;

  const students: Student[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawName = row[nameIdx] || row[1] || '';
    if (!rawName.trim()) continue;

    const rawNis = row[nisIdx] || row[0] || `${targetClass.replace(/\s+/g, '')}-${i}`;
    const rawGender = (row[genderIdx] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';

    students.push({
      id: `${targetClass.replace(/\s+/g, '')}-${i}`,
      nis: rawNis.trim(),
      name: rawName.trim(),
      gender: rawGender,
      className: targetClass,
    });
  }

  return students;
};

// Standard headers for Attendance sheets
export const ATTENDANCE_HEADERS = [
  'ID Sesi',
  'Timestamp',
  'Tanggal',
  'Jam Ke',
  'Guru Pengampu',
  'Mata Pelajaran',
  'Kelas',
  'NIS',
  'Nama Siswa',
  'L/P',
  'Status Kehadiran (H/I/S/A)',
  'Keterangan',
  'Materi / Topik Bahasan',
  'Persentase Sesi (%)',
];

// Helper to get attendance sheet name based on class
export const getTargetAttendanceSheetName = (className: string): string => {
  return `Absensi ${className}`;
};

// Function to ensure a specific sheet exists in a spreadsheet with headers, creating it if absent
export const ensureAttendanceSheetExists = async (
  spreadsheetId: string,
  targetSheetName: string
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Silakan login dengan Google terlebih dahulu.');

  const cleanId = parseSpreadsheetId(spreadsheetId);

  // Check existing sheets
  const meta = await getSpreadsheetMetadata(cleanId);
  const exists = meta.sheetNames.some(
    (name) => name.toLowerCase() === targetSheetName.toLowerCase()
  );

  if (!exists) {
    // Add sheet
    const addSheetResponse = await fetchWithRetry(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: targetSheetName,
                  gridProperties: { rowCount: 500, columnCount: 15, frozenRowCount: 1 },
                },
              },
            },
          ],
        }),
      }
    );

    if (addSheetResponse.ok) {
      // Add headers
      const range = `'${targetSheetName}'!A1:N1`;
      await fetchWithRetry(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(
          range
        )}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [ATTENDANCE_HEADERS],
          }),
        }
      );
    }
  }
};

// Create a complete, beautifully structured Attendance Spreadsheet on user's Google Drive with separate sheets per class
export const createMasterAttendanceSpreadsheet = async (
  title = 'Absensi Guru Mapel TJKT - Master'
): Promise<{ id: string; url: string; title: string }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Silakan login dengan Google terlebih dahulu.');

  const body = {
    properties: {
      title,
    },
    sheets: [
      // Kelas 10 TJKT
      {
        properties: {
          title: 'Absensi 10 TJKT',
          gridProperties: { rowCount: 500, columnCount: 15, frozenRowCount: 1 },
          tabColor: { red: 0.1, green: 0.65, blue: 0.4 },
        },
      },
      {
        properties: {
          title: 'Data Siswa 10 TJKT',
          gridProperties: { rowCount: 100, columnCount: 6, frozenRowCount: 1 },
          tabColor: { red: 0.2, green: 0.45, blue: 0.85 },
        },
      },
      // Kelas 11 TJKT
      {
        properties: {
          title: 'Absensi 11 TJKT',
          gridProperties: { rowCount: 500, columnCount: 15, frozenRowCount: 1 },
          tabColor: { red: 0.9, green: 0.55, blue: 0.1 },
        },
      },
      {
        properties: {
          title: 'Data Siswa 11 TJKT',
          gridProperties: { rowCount: 100, columnCount: 6, frozenRowCount: 1 },
          tabColor: { red: 0.95, green: 0.4, blue: 0.15 },
        },
      },
      // Kelas 12 TJKT
      {
        properties: {
          title: 'Absensi 12 TJKT',
          gridProperties: { rowCount: 500, columnCount: 15, frozenRowCount: 1 },
          tabColor: { red: 0.65, green: 0.25, blue: 0.75 },
        },
      },
      {
        properties: {
          title: 'Data Siswa 12 TJKT',
          gridProperties: { rowCount: 100, columnCount: 6, frozenRowCount: 1 },
          tabColor: { red: 0.45, green: 0.2, blue: 0.7 },
        },
      },
    ],
  };

  const response = await fetchWithRetry('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatGoogleError(response.status, errorData.error?.message || 'Gagal membuat spreadsheet baru di Google Drive.'));
  }

  const createdSheet = await response.json();
  const spreadsheetId = createdSheet.spreadsheetId;

  // Populate initial headers and student data for each class sheet
  const valuesData: Array<{ range: string; values: any[][] }> = [
    {
      range: "'Absensi 10 TJKT'!A1:N1",
      values: [ATTENDANCE_HEADERS],
    },
    {
      range: "'Absensi 11 TJKT'!A1:N1",
      values: [ATTENDANCE_HEADERS],
    },
    {
      range: "'Absensi 12 TJKT'!A1:N1",
      values: [ATTENDANCE_HEADERS],
    },
  ];

  // Populate Data Siswa 10 TJKT
  const s10 = INITIAL_STUDENTS.filter((s) => s.className === '10 TJKT');
  valuesData.push({
    range: "'Data Siswa 10 TJKT'!A1:D" + (s10.length + 1),
    values: [
      ['No', 'NIS', 'Nama Lengkap Siswa', 'Jenis Kelamin (L/P)'],
      ...s10.map((s, idx) => [idx + 1, s.nis, s.name, s.gender]),
    ],
  });

  // Populate Data Siswa 11 TJKT
  const s11 = INITIAL_STUDENTS.filter((s) => s.className === '11 TJKT');
  valuesData.push({
    range: "'Data Siswa 11 TJKT'!A1:D" + (s11.length + 1),
    values: [
      ['No', 'NIS', 'Nama Lengkap Siswa', 'Jenis Kelamin (L/P)'],
      ...s11.map((s, idx) => [idx + 1, s.nis, s.name, s.gender]),
    ],
  });

  // Populate Data Siswa 12 TJKT
  const s12 = INITIAL_STUDENTS.filter((s) => s.className === '12 TJKT');
  valuesData.push({
    range: "'Data Siswa 12 TJKT'!A1:D" + (s12.length + 1),
    values: [
      ['No', 'NIS', 'Nama Lengkap Siswa', 'Jenis Kelamin (L/P)'],
      ...s12.map((s, idx) => [idx + 1, s.nis, s.name, s.gender]),
    ],
  });

  // Batch update values
  await fetchWithRetry(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valuesData,
      }),
    }
  );

  return {
    id: spreadsheetId,
    url: createdSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title: createdSheet.properties?.title || title,
  };
};

// Append attendance record to the class-specific attendance sheet
export const appendAttendanceRecordToSheet = async (
  spreadsheetId: string,
  recordOrSheetName: AttendanceRecord | string,
  maybeRecord?: AttendanceRecord
): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Silakan login dengan Google terlebih dahulu.');

  let record: AttendanceRecord;
  let preferredSheetName: string | undefined;

  if (typeof recordOrSheetName === 'string') {
    preferredSheetName = recordOrSheetName;
    record = maybeRecord!;
  } else {
    record = recordOrSheetName;
  }

  const cleanId = parseSpreadsheetId(spreadsheetId);
  // Separate sheet per class: "Absensi 10 TJKT", "Absensi 11 TJKT", "Absensi 12 TJKT"
  const targetSheet = preferredSheetName && !preferredSheetName.includes('Rekap Absensi Harian')
    ? preferredSheetName
    : getTargetAttendanceSheetName(record.className);

  // Format rows: one row per student
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const rows = record.details.map((detail) => [
    record.id,
    timestamp,
    record.date,
    record.period,
    record.teacherName,
    record.subject,
    record.className,
    detail.nis,
    detail.studentName,
    detail.gender,
    detail.status,
    detail.notes || '-',
    record.topic || '-',
    `${record.attendancePercentage}%`,
  ]);

  const range = `'${targetSheet}'!A:N`;
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  let response = await fetchWithRetry(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  // If failed because sheet does not exist (e.g. existing/older spreadsheet), create sheet and retry
  if (!response.ok) {
    const errText = await response.text();
    if (errText.includes('Unable to parse range') || response.status === 400) {
      console.info(`Sheet "${targetSheet}" belum ada, membuat sheet otomatis...`);
      await ensureAttendanceSheetExists(cleanId, targetSheet);
      // Retry append after creation
      response = await fetchWithRetry(appendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gagal menyimpan absensi ke sheet ${targetSheet}`);
    }
  }

  return true;
};
