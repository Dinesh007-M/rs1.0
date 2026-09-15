import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { reportService } from '../services';
import { FileText, Download, Check, Calendar, BarChart3, TrendingUp, ShieldCheck } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleExport = async (type: string, filename: string) => {
    setIsExporting(type);
    const blob = await reportService.exportData(type as any);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(null);
    setDownloadSuccess(type);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const reports = [
    {
      id: 'pavement_quality',
      title: 'Municipal Pavement Health & Roughness Audit (IRI)',
      description: 'Comprehensive road surface degradation scores calculated across 65.5 km of transit routes.',
      category: 'Infrastructure',
      frequency: 'Weekly',
      lastGenerated: 'Today at 06:00 UTC',
    },
    {
      id: 'fleet_coverage',
      title: 'Mobile Sensing Network Coverage & Spatial Gap Analysis',
      description: 'Spatial scan frequency, blind spot identification, and bus camera operating hours.',
      category: 'Operations',
      frequency: 'Daily',
      lastGenerated: 'Today at 02:00 UTC',
    },
    {
      id: 'incident_summary',
      title: 'Urban Safety & Wrong-Way Trajectory Log',
      description: 'Pedestrian conflicts, opposite-flow vehicle sightings, and emergency corridor dispatches.',
      category: 'Public Safety',
      frequency: 'Monthly',
      lastGenerated: 'Yesterday',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Urban Intelligence Reports & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Auditable municipal exports for department of transportation, city council, and public works.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('DEFECTS_CSV', 'road_defects_export.csv')}
            disabled={Boolean(isExporting)}
            icon={
              downloadSuccess === 'DEFECTS_CSV' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )
            }
          >
            Export Defects CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExport('RAW_EVENTS_JSON', 'road_sense_events_telemetry.json')}
            disabled={Boolean(isExporting)}
            icon={
              downloadSuccess === 'RAW_EVENTS_JSON' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )
            }
          >
            Export All Events JSON
          </Button>
        </div>
      </div>

      {/* Available Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map((rep) => (
          <Card key={rep.id} className="flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="info" size="sm">
                  {rep.category}
                </Badge>
                <span className="text-[11px] text-slate-500 font-mono">{rep.frequency}</span>
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">{rep.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{rep.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">Gen: {rep.lastGenerated}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('REPORT_CSV', `${rep.id}.csv`)}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
