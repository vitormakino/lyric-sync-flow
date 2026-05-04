import { SubtitleLine } from '../types';
import { Download, FileText, Code, Music } from 'lucide-react';
import { exportToSRT, exportToWebVTTKaraoke } from '../utils/subtitleUtils';

interface ExportPanelProps {
  lines: SubtitleLine[];
}

export function ExportPanel({ lines }: ExportPanelProps) {
  const download = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = lines.flatMap(l => l.words.map(w => ({
      text: w.text,
      start: w.start,
      end: w.end
    })));
    download(JSON.stringify(data, null, 2), 'subtitles.json');
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => download(exportToSRT(lines), 'subtitles.srt')}
        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 text-[10px] font-bold rounded-lg transition-all border border-white/5 uppercase tracking-wider"
      >
        SRT
      </button>
      <button
        onClick={() => download(exportToWebVTTKaraoke(lines), 'subtitles.vtt')}
        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-500 text-black text-[10px] font-black rounded-lg transition-all shadow-lg shadow-amber-500/20 uppercase tracking-wider"
      >
        VTT (KARAOKE)
      </button>
      <button
        onClick={handleExportJSON}
        className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-[10px] font-bold rounded-lg transition-all border border-white/5 uppercase tracking-widest text-slate-500"
      >
        JSON DATA
      </button>
    </div>
  );
}
