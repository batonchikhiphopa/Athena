import { EyeClosedIcon, EyeOpenIcon } from "../icon";

type EditorActionButtonsProps = {
  analysisEnabled: boolean;
  onInsertTag: () => void;
  onNewBlankPage: () => void;
  onToggleAnalysisEnabled: () => void;
};

export function EditorActionButtons({
  analysisEnabled,
  onInsertTag,
  onNewBlankPage,
  onToggleAnalysisEnabled,
}: EditorActionButtonsProps) {
  return (
    <>
      <button
        aria-label="Начать ввод тега"
        onClick={onInsertTag}
        type="button"
        className="
          absolute top-1 right-16 z-20
          h-6 w-6 flex items-center justify-center
          rounded-full

          text-[14px] leading-none
          text-zinc-400
          hover:text-zinc-700
          hover:bg-zinc-200/40

          opacity-70 hover:opacity-100
          transition
        "
      >
        #
      </button>

      <button
        aria-label={
          analysisEnabled ? "Запретить анализ текста" : "Разрешить анализ текста"
        }
        aria-pressed={analysisEnabled}
        onClick={onToggleAnalysisEnabled}
        type="button"
        className="
          absolute top-1 right-10 z-20
          h-6 w-6 flex items-center justify-center
          rounded-full

          text-zinc-400
          hover:text-zinc-700
          hover:bg-zinc-200/40

          opacity-70 hover:opacity-100
          transition
        "
      >
        {analysisEnabled ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </button>

      <button
        aria-label="Открыть чистый лист"
        onClick={onNewBlankPage}
        type="button"
        className="
          absolute top-1 right-2 z-20
          h-6 w-6 flex items-center justify-center
          rounded-full

          text-[14px] leading-none
          text-zinc-400
          hover:text-zinc-700
          hover:bg-zinc-200/40

          opacity-70 hover:opacity-100
          transition
        "
      >
        <span className="translate-y-[-2px]">×</span>
      </button>
    </>
  );
}
