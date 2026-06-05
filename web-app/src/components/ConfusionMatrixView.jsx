import React from 'react';

const ConfusionMatrixView = ({ metrics, modelName }) => {
  if (!metrics) return null;

  const { tn, fp, fn, tp } = metrics.confusion_matrix;
  const total = tn + fp + fn + tp;

  // Convert percentages for display in heatmap
  const tnPct = ((tn / total) * 100).toFixed(1);
  const fpPct = ((fp / total) * 100).toFixed(1);
  const fnPct = ((fn / total) * 100).toFixed(1);
  const tpPct = ((tp / total) * 100).toFixed(1);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-lol-greyDark border border-lol-border/30 rounded-lg shadow-hextech">
      {/* 2x2 Matrix Heatmap */}
      <div className="flex flex-col flex-1">
        <h4 className="text-sm font-bold text-lol-gold uppercase tracking-wider mb-4">
          {modelName} 오차 행렬 (Confusion Matrix)
        </h4>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          {/* Header Row */}
          <div></div>
          <div className="text-lol-goldLight/70 font-semibold pb-1">패배 예측 (Win=0)</div>
          <div className="text-lol-goldLight/70 font-semibold pb-1">승리 예측 (Win=1)</div>

          {/* Row 1: Actual Win=0 */}
          <div className="flex items-center justify-center text-lol-goldLight/70 text-right pr-2">
            실제 패배 (Win=0)
          </div>
          {/* True Negative (TN) */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded flex flex-col justify-center items-center group transition-all hover:bg-emerald-950/60">
            <span className="text-lg font-bold text-emerald-400">{tn}</span>
            <span className="text-[10px] text-emerald-400/70">True Negative (TN)</span>
            <span className="text-xs font-bold text-emerald-300 mt-1">{tnPct}%</span>
          </div>
          {/* False Positive (FP) */}
          <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded flex flex-col justify-center items-center group transition-all hover:bg-rose-950/30">
            <span className="text-lg font-bold text-rose-400/80">{fp}</span>
            <span className="text-[10px] text-rose-400/50">False Positive (FP)</span>
            <span className="text-xs font-bold text-rose-300/80 mt-1">{fpPct}%</span>
          </div>

          {/* Row 2: Actual Win=1 */}
          <div className="flex items-center justify-center text-lol-goldLight/70 text-right pr-2">
            실제 승리 (Win=1)
          </div>
          {/* False Negative (FN) */}
          <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded flex flex-col justify-center items-center group transition-all hover:bg-rose-950/30">
            <span className="text-lg font-bold text-rose-400/80">{fn}</span>
            <span className="text-[10px] text-rose-400/50">False Negative (FN)</span>
            <span className="text-xs font-bold text-rose-300/80 mt-1">{fnPct}%</span>
          </div>
          {/* True Positive (TP) */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded flex flex-col justify-center items-center group transition-all hover:bg-emerald-950/60">
            <span className="text-lg font-bold text-emerald-400">{tp}</span>
            <span className="text-[10px] text-emerald-400/70">True Positive (TP)</span>
            <span className="text-xs font-bold text-emerald-300 mt-1">{tpPct}%</span>
          </div>
        </div>
        <p className="text-[11px] text-lol-goldLight/40 mt-3 italic leading-relaxed">
          * 전체 데이터 세트 ({total}경기) 기준 평가 결과입니다. 초록색 상자(TN, TP)는 예측이 일치한 정확한 판단이며, 붉은색 상자(FP, FN)는 예측이 빗나간 판단입니다.
        </p>
      </div>

      {/* Metrics Cards List */}
      <div className="flex flex-col w-full lg:w-72 justify-between border-t lg:border-t-0 lg:border-l border-lol-border/30 pt-4 lg:pt-0 lg:pl-6">
        <h4 className="text-sm font-bold text-lol-gold uppercase tracking-wider mb-4">
          평가 지표 (Metrics)
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          {/* Accuracy */}
          <div className="bg-lol-obsidian border border-lol-border/30 p-3 rounded flex justify-between items-center">
            <div>
              <span className="text-xs text-lol-goldLight/50 block font-semibold">정확도 (Accuracy)</span>
              <span className="text-base font-extrabold text-lol-goldLight">{(metrics.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="h-8 w-8 rounded-full border-2 border-lol-gold/40 flex items-center justify-center text-lol-gold text-[10px] font-bold">
              ACC
            </div>
          </div>

          {/* F1-Score */}
          <div className="bg-lol-obsidian border border-lol-border/30 p-3 rounded flex justify-between items-center">
            <div>
              <span className="text-xs text-lol-goldLight/50 block font-semibold">F1 스코어 (F1)</span>
              <span className="text-base font-extrabold text-lol-goldLight">{(metrics.f1 * 100).toFixed(2)}%</span>
            </div>
            <div className="h-8 w-8 rounded-full border-2 border-lol-gold/40 flex items-center justify-center text-lol-gold text-[10px] font-bold">
              F1
            </div>
          </div>

          {/* ROC-AUC */}
          <div className="bg-lol-obsidian border border-lol-border/30 p-3 rounded flex justify-between items-center">
            <div>
              <span className="text-xs text-lol-goldLight/50 block font-semibold">ROC-AUC 면적</span>
              <span className="text-base font-extrabold text-lol-goldLight">{(metrics.auc * 100).toFixed(2)}%</span>
            </div>
            <div className="h-8 w-8 rounded-full border-2 border-lol-gold/40 flex items-center justify-center text-lol-gold text-[10px] font-bold">
              AUC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfusionMatrixView;
