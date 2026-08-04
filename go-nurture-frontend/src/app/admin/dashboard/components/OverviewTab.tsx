import { Users, FileText, Heart, Mail, MapPin, Calendar } from "lucide-react";

interface Stats {
  total_partners: number;
  active_partners: number;
  total_referrals: number;
  pending_referrals: number;
  recent_referrals: number;
  total_donations: number;
  total_donation_amount: number;
  total_contacts: number;
  total_venues: number;
  total_cohorts: number;
  referrals_by_status: Record<string, number>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red";
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    yellow: "bg-yellow-50",
    red: "bg-red-50",
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function OverviewTab({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div className="rounded-xl bg-white p-12 shadow-sm text-center">
        <p className="text-gray-500">Loading stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Partners"
          value={stats.total_partners}
          subtitle={`${stats.active_partners} active`}
          icon={<Users className="text-blue-600" size={24} />}
          color="blue"
        />
        <StatCard
          title="Total Referrals"
          value={stats.total_referrals}
          subtitle={`${stats.recent_referrals} in last 30 days`}
          icon={<FileText className="text-green-600" size={24} />}
          color="green"
        />
        <StatCard
          title="Pending Referrals"
          value={stats.pending_referrals}
          subtitle="Awaiting review"
          icon={<Calendar className="text-yellow-600" size={24} />}
          color="yellow"
        />
        <StatCard
          title="Total Donations"
          value={`£${stats.total_donation_amount.toFixed(2)}`}
          subtitle={`${stats.total_donations} donations`}
          icon={<Heart className="text-red-600" size={24} />}
          color="red"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Mail className="text-purple-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Contact Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_contacts}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <MapPin className="text-orange-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Venues</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_venues}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Calendar className="text-indigo-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Cohorts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_cohorts}</p>
            </div>
          </div>
        </div>
      </div>

      {stats.referrals_by_status && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-heading text-xl font-bold text-gray-900 mb-4">
            Referrals by Status
          </h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(stats.referrals_by_status).map(([status, count]) => {
              const colorMap: Record<string, string> = {
                pending: "bg-yellow-50 text-yellow-700",
                approved: "bg-green-50 text-green-700",
                rejected: "bg-red-50 text-red-700",
                completed: "bg-blue-50 text-blue-700",
              };
              const cls = colorMap[status] || "bg-gray-100 text-gray-700";
              return (
                <div
                  key={status}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 ${cls}`}
                >
                  <span className="text-sm font-medium capitalize">{status}</span>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}