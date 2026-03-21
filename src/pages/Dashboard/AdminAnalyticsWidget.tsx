import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Typography } from 'antd';

const data = [
  { name: 'Sep', admissions: 400, inquiries: 800 },
  { name: 'Oct', admissions: 300, inquiries: 700 },
  { name: 'Nov', admissions: 500, inquiries: 900 },
  { name: 'Dec', admissions: 200, inquiries: 500 },
  { name: 'Jan', admissions: 600, inquiries: 1200 },
  { name: 'Feb', admissions: 750, inquiries: 1400 },
];

export default function AdminAnalyticsWidget() {
  return (
    <div className="w-full bg-[var(--cv-card)]/40 border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl backdrop-blur-3xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--cv-accent)]/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <Typography.Title level={4} className="!mb-1 !text-white font-bold tracking-wide">
            Enrollment Trends
          </Typography.Title>
          <Typography.Text className="!text-white/50 text-sm">
            Admissions vs Inquiries over the last 6 months
          </Typography.Text>
        </div>
        <div className="flex gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 max-w-min">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--cv-accent)] shadow-[0_0_8px_var(--cv-accent)]" />
            <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Admissions</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
            <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Inquiries</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--cv-accent)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--cv-accent)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorInquiries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', backdropFilter: 'blur(10px)', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.5rem' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '5 5' }}
            />
            <Area type="monotone" dataKey="inquiries" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorInquiries)" animationDuration={1500} />
            <Area type="monotone" dataKey="admissions" stroke="var(--cv-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorAdmissions)" animationDuration={1500} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
