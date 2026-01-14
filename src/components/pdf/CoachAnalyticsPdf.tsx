import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles, formatPdfDate } from '@/lib/pdf-utils';

interface ClientLeaderboardEntry {
  name: string;
  score: number;
  adherence: number;
  consistency: number;
  goalsCompleted: number;
}

interface CoachAnalyticsData {
  coachName: string;
  generatedDate: string;
  stats: {
    totalClients: number;
    activeClients: number;
    pendingCheckins: number;
    activePlans: number;
  };
  quickMetrics: {
    avgResponseTime: string;
    checkinRate: string;
    clientRetention: string;
  };
  checkinStats: {
    pending: number;
    reviewed: number;
    draft: number;
  };
  assignmentStats: {
    workout: number;
    diet: number;
    total: number;
  };
  leaderboard: ClientLeaderboardEntry[];
}

export function CoachAnalyticsPdf({ data }: { data: CoachAnalyticsData }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>Coach Analytics Report</Text>
          <Text style={pdfStyles.subtitle}>{data.coachName}</Text>
          <Text style={pdfStyles.date}>Generated on {formatPdfDate(data.generatedDate)}</Text>
        </View>

        {/* Overview Stats */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Overview</Text>
          <View style={pdfStyles.statsGrid}>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.stats.totalClients}</Text>
              <Text style={pdfStyles.statLabel}>Total Clients</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.stats.activeClients}</Text>
              <Text style={pdfStyles.statLabel}>Active Clients</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.stats.pendingCheckins}</Text>
              <Text style={pdfStyles.statLabel}>Pending Check-ins</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.stats.activePlans}</Text>
              <Text style={pdfStyles.statLabel}>Active Plans</Text>
            </View>
          </View>
        </View>

        {/* Quick Metrics */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Performance Metrics</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Average Response Time</Text>
            <Text style={pdfStyles.value}>{data.quickMetrics.avgResponseTime}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Check-in Rate (7 days)</Text>
            <Text style={pdfStyles.value}>{data.quickMetrics.checkinRate}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Client Retention</Text>
            <Text style={pdfStyles.value}>{data.quickMetrics.clientRetention}</Text>
          </View>
        </View>

        {/* Check-in Status */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Check-in Status</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Pending Review</Text>
            <Text style={pdfStyles.value}>{data.checkinStats.pending}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Reviewed</Text>
            <Text style={pdfStyles.value}>{data.checkinStats.reviewed}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Draft</Text>
            <Text style={pdfStyles.value}>{data.checkinStats.draft}</Text>
          </View>
        </View>

        {/* Plan Assignments */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Plan Assignments</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Workout Plans</Text>
            <Text style={pdfStyles.value}>{data.assignmentStats.workout}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Diet Plans</Text>
            <Text style={pdfStyles.value}>{data.assignmentStats.diet}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Total Assignments</Text>
            <Text style={pdfStyles.value}>{data.assignmentStats.total}</Text>
          </View>
        </View>

        {/* Client Leaderboard */}
        {data.leaderboard.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Top Performing Clients</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 0.5 }]}>Rank</Text>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 2 }]}>Client</Text>
                <Text style={pdfStyles.tableHeaderCell}>Adherence</Text>
                <Text style={pdfStyles.tableHeaderCell}>Consistency</Text>
                <Text style={pdfStyles.tableHeaderCell}>Goals</Text>
                <Text style={pdfStyles.tableHeaderCell}>Score</Text>
              </View>
              {data.leaderboard.map((client, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={[pdfStyles.tableCell, { flex: 0.5 }]}>#{index + 1}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{client.name}</Text>
                  <Text style={pdfStyles.tableCell}>{client.adherence}%</Text>
                  <Text style={pdfStyles.tableCell}>{client.consistency}%</Text>
                  <Text style={pdfStyles.tableCell}>{client.goalsCompleted}</Text>
                  <Text style={pdfStyles.tableCell}>{client.score}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          CustomCoachPro - Coach Analytics Report • {formatPdfDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
