
import React from 'react';
import { MeterAnalysis } from '../types';

interface TaqtiTableProps {
  analysis: MeterAnalysis;
}

const TaqtiTable: React.FC<TaqtiTableProps> = ({ analysis }) => {
  return (
    <div className="mt-8 bg-white rounded-lg shadow-inner overflow-hidden border border-gray-100 p-1">
      <div className="bg-aruuz-primary/5 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-xl font-bold urdu-text text-aruuz-primary">بحر کا تجزیہ: {analysis.name}</h3>
        <span className="text-xs text-gray-400 font-mono tracking-widest uppercase">Scansion Analysis</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse table-auto min-w-max">
          <thead>
            <tr className="bg-gray-50/50">
              {analysis.results.map((res, i) => (
                <th 
                  key={i} 
                  className="border p-3 urdu-text font-semibold text-gray-700 whitespace-nowrap"
                  style={{ width: `${Math.max(res.word.length * 15, 80)}px` }}
                >
                  {res.word}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {analysis.results.map((res, i) => (
                <td key={i} className="border p-5 text-2xl font-bold urdu-text text-aruuz-primary bg-white">
                  {res.weight}
                </td>
              ))}
            </tr>
            <tr>
              {analysis.results.map((res, i) => (
                <td key={i} className="border p-3 font-mono text-lg bg-gray-50/30">
                  <div className="flex justify-center gap-1">
                    {res.scansion.split('').map((bit, j) => (
                      <span 
                        key={j} 
                        className={`inline-block w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${bit === '1' ? 'bg-red-400' : 'bg-blue-400'}`}
                        title={bit === '1' ? 'Sakin / Long' : 'Mutaharrik / Short'}
                      >
                        {bit === '1' ? '—' : '∪'}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaqtiTable;
