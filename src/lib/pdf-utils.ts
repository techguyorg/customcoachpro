import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { createElement } from 'react';

// Shared PDF styles
export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  date: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    color: '#6b7280',
    flex: 1,
  },
  value: {
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
    color: '#4b5563',
    fontSize: 9,
  },
  mealCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  mealTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 16,
  },
  macroItem: {
    fontSize: 9,
    color: '#4b5563',
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    marginBottom: 4,
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  leaderboardRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 10,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgePrimary: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
});

// Helper function to download PDF
export async function downloadPdf(document: React.ReactElement, filename: string) {
  const blob = await pdf(document).toBlob();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format date for PDF
export function formatPdfDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
