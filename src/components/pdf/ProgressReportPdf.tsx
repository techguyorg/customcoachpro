import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles, formatPdfDate } from '@/lib/pdf-utils';

interface Measurement {
  date: string;
  weight: number;
  bodyFat?: number;
  waist?: number;
  chest?: number;
}

interface Goal {
  title: string;
  type: string;
  status: string;
  progress: number;
  target?: number;
  current?: number;
  unit?: string;
}

interface ProgressData {
  clientName: string;
  generatedDate: string;
  measurements: Measurement[];
  goals: Goal[];
  stats: {
    startingWeight?: number;
    currentWeight?: number;
    weightChange?: number;
    totalCheckIns: number;
    photosUploaded: number;
    goalsCompleted: number;
    activeGoals: number;
  };
}

export function ProgressReportPdf({ data }: { data: ProgressData }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>Progress Report</Text>
          <Text style={pdfStyles.subtitle}>{data.clientName}</Text>
          <Text style={pdfStyles.date}>Generated on {formatPdfDate(data.generatedDate)}</Text>
        </View>

        {/* Summary Stats */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Progress Summary</Text>
          <View style={pdfStyles.statsGrid}>
            {data.stats.currentWeight && (
              <View style={pdfStyles.statBox}>
                <Text style={pdfStyles.statValue}>{data.stats.currentWeight} kg</Text>
                <Text style={pdfStyles.statLabel}>Current Weight</Text>
              </View>
            )}
            {data.stats.weightChange !== undefined && (
              <View style={pdfStyles.statBox}>
                <Text style={[pdfStyles.statValue, { color: data.stats.weightChange < 0 ? '#16a34a' : '#ea580c' }]}>
                  {data.stats.weightChange > 0 ? '+' : ''}{data.stats.weightChange.toFixed(1)} kg
                </Text>
                <Text style={pdfStyles.statLabel}>Weight Change</Text>
              </View>
            )}
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.stats.totalCheckIns}</Text>
              <Text style={pdfStyles.statLabel}>Check-ins Logged</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.stats.goalsCompleted}</Text>
              <Text style={pdfStyles.statLabel}>Goals Achieved</Text>
            </View>
          </View>
        </View>

        {/* Goals */}
        {data.goals.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Goals</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 2 }]}>Goal</Text>
                <Text style={pdfStyles.tableHeaderCell}>Type</Text>
                <Text style={pdfStyles.tableHeaderCell}>Status</Text>
                <Text style={pdfStyles.tableHeaderCell}>Progress</Text>
              </View>
              {data.goals.map((goal, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{goal.title}</Text>
                  <Text style={pdfStyles.tableCell}>{goal.type}</Text>
                  <Text style={pdfStyles.tableCell}>{goal.status}</Text>
                  <Text style={pdfStyles.tableCell}>{goal.progress}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Measurement History */}
        {data.measurements.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Measurement History</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={pdfStyles.tableHeaderCell}>Date</Text>
                <Text style={pdfStyles.tableHeaderCell}>Weight (kg)</Text>
                <Text style={pdfStyles.tableHeaderCell}>Body Fat (%)</Text>
                <Text style={pdfStyles.tableHeaderCell}>Waist (cm)</Text>
                <Text style={pdfStyles.tableHeaderCell}>Chest (cm)</Text>
              </View>
              {data.measurements.slice(0, 10).map((measurement, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.tableCell}>{formatPdfDate(measurement.date)}</Text>
                  <Text style={pdfStyles.tableCell}>{measurement.weight}</Text>
                  <Text style={pdfStyles.tableCell}>{measurement.bodyFat || '—'}</Text>
                  <Text style={pdfStyles.tableCell}>{measurement.waist || '—'}</Text>
                  <Text style={pdfStyles.tableCell}>{measurement.chest || '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          CustomCoachPro - Progress Report • {formatPdfDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
