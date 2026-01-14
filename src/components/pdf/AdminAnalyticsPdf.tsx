import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles, formatPdfDate } from '@/lib/pdf-utils';

interface AdminAnalyticsData {
  generatedDate: string;
  userStats: {
    totalUsers: number;
    totalAdmins: number;
    totalCoaches: number;
    totalClients: number;
  };
  engagementStats: {
    activeCoachings: number;
    pendingRequests: number;
  };
  contentStats: {
    exercises: number;
    workoutTemplates: number;
    dietPlans: number;
    recipes: number;
    foods: number;
  };
  activityStats: {
    newUsersWeek: number;
    checkinsMonth: number;
    workoutsMonth: number;
    topCoachClients: number;
  };
  platformHealth: {
    coachToClientRatio: string;
    avgClientsPerCoach: string;
    requestConversionRate: string;
  };
}

export function AdminAnalyticsPdf({ data }: { data: AdminAnalyticsData }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>Platform Analytics Report</Text>
          <Text style={pdfStyles.subtitle}>CustomCoachPro Admin Dashboard</Text>
          <Text style={pdfStyles.date}>Generated on {formatPdfDate(data.generatedDate)}</Text>
        </View>

        {/* User Statistics */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>User Statistics</Text>
          <View style={pdfStyles.statsGrid}>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.userStats.totalUsers}</Text>
              <Text style={pdfStyles.statLabel}>Total Users</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.userStats.totalAdmins}</Text>
              <Text style={pdfStyles.statLabel}>Super Admins</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.userStats.totalCoaches}</Text>
              <Text style={pdfStyles.statLabel}>Coaches</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.userStats.totalClients}</Text>
              <Text style={pdfStyles.statLabel}>Clients</Text>
            </View>
          </View>
        </View>

        {/* Engagement */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Engagement</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Active Coach-Client Relationships</Text>
            <Text style={pdfStyles.value}>{data.engagementStats.activeCoachings}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Pending Coaching Requests</Text>
            <Text style={pdfStyles.value}>{data.engagementStats.pendingRequests}</Text>
          </View>
        </View>

        {/* System Content */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>System Content</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Exercises</Text>
            <Text style={pdfStyles.value}>{data.contentStats.exercises}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Workout Templates</Text>
            <Text style={pdfStyles.value}>{data.contentStats.workoutTemplates}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Diet Plans</Text>
            <Text style={pdfStyles.value}>{data.contentStats.dietPlans}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Recipes</Text>
            <Text style={pdfStyles.value}>{data.contentStats.recipes}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Foods</Text>
            <Text style={pdfStyles.value}>{data.contentStats.foods}</Text>
          </View>
        </View>

        {/* Activity Metrics */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Activity Metrics</Text>
          <View style={pdfStyles.statsGrid}>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>+{data.activityStats.newUsersWeek}</Text>
              <Text style={pdfStyles.statLabel}>New Users (7 days)</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.activityStats.checkinsMonth}</Text>
              <Text style={pdfStyles.statLabel}>Check-ins (30 days)</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.activityStats.workoutsMonth}</Text>
              <Text style={pdfStyles.statLabel}>Workouts (30 days)</Text>
            </View>
            <View style={pdfStyles.statBox}>
              <Text style={pdfStyles.statValue}>{data.activityStats.topCoachClients}</Text>
              <Text style={pdfStyles.statLabel}>Top Coach Clients</Text>
            </View>
          </View>
        </View>

        {/* Platform Health */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Platform Health</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Coach to Client Ratio</Text>
            <Text style={pdfStyles.value}>{data.platformHealth.coachToClientRatio}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Average Clients per Coach</Text>
            <Text style={pdfStyles.value}>{data.platformHealth.avgClientsPerCoach}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Request Conversion Rate</Text>
            <Text style={pdfStyles.value}>{data.platformHealth.requestConversionRate}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          CustomCoachPro - Platform Analytics Report • {formatPdfDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
